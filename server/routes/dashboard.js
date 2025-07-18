const express = require("express");
const { validationResult, query } = require("express-validator");
const { authenticateToken } = require("../middleware/auth");
const { catchAsync } = require("../middleware/errorHandler");
const db = require("../database/db");

const router = express.Router();

// Get dashboard overview metrics
router.get(
  "/overview",
  [authenticateToken, query("timeframe").optional().isIn(["7d", "30d", "90d"])],
  catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }

    const timeframe = req.query.timeframe || "30d";
    let dateFilter = "";

    switch (timeframe) {
      case "7d":
        dateFilter = "AND created_at >= NOW() - INTERVAL '7 days'";
        break;
      case "30d":
        dateFilter = "AND created_at >= NOW() - INTERVAL '30 days'";
        break;
      case "90d":
        dateFilter = "AND created_at >= NOW() - INTERVAL '90 days'";
        break;
    }

    // Key metrics
    const metricsResult = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM orders WHERE 1=1 ${dateFilter}) as total_orders,
        (SELECT SUM(total_amount) FROM orders WHERE 1=1 ${dateFilter}) as total_revenue,
        (SELECT COUNT(*) FROM customers WHERE is_active = true) as active_customers,
        (SELECT COUNT(*) FROM supplies WHERE current_stock <= reorder_level) as low_stock_items,
        (SELECT COUNT(*) FROM alerts WHERE is_read = false) as unread_alerts,
        (SELECT AVG(total_amount) FROM orders WHERE 1=1 ${dateFilter}) as avg_order_value
    `);

    // Revenue trend (daily)
    const revenueTrendResult = await db.query(`
      SELECT 
        DATE(created_at) as date,
        SUM(total_amount) as revenue,
        COUNT(*) as order_count
      FROM orders
      WHERE 1=1 ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Top selling supplies
    const topSuppliesResult = await db.query(`
      SELECT 
        s.id, s.name, s.category,
        SUM(oi.quantity) as total_sold,
        SUM(oi.subtotal) as total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN supplies s ON oi.supply_id = s.id
      WHERE 1=1 ${dateFilter.replace("created_at", "o.created_at")}
      GROUP BY s.id, s.name, s.category
      ORDER BY total_revenue DESC
      LIMIT 10
    `);

    // Order status distribution
    const orderStatusResult = await db.query(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(total_amount) as revenue
      FROM orders
      WHERE 1=1 ${dateFilter}
      GROUP BY status
      ORDER BY count DESC
    `);

    // Recent activities (last 10 orders)
    const recentActivitiesResult = await db.query(`
      SELECT 
        o.id, o.order_number, o.status, o.total_amount, o.created_at,
        c.name as customer_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        timeframe,
        metrics: metricsResult.rows[0],
        revenue_trend: revenueTrendResult.rows,
        top_supplies: topSuppliesResult.rows,
        order_status_distribution: orderStatusResult.rows,
        recent_activities: recentActivitiesResult.rows,
      },
    });
  }),
);

// Get inventory overview
router.get(
  "/inventory",
  authenticateToken,
  catchAsync(async (req, res) => {
    // Inventory summary
    const inventoryResult = await db.query(`
      SELECT 
        COUNT(*) as total_supplies,
        COUNT(CASE WHEN current_stock <= reorder_level THEN 1 END) as low_stock_count,
        COUNT(CASE WHEN current_stock = 0 THEN 1 END) as out_of_stock_count,
        SUM(current_stock * cost_per_unit) as total_inventory_value
      FROM supplies
    `);

    // Stock levels by category
    const categoryStockResult = await db.query(`
      SELECT 
        category,
        COUNT(*) as item_count,
        SUM(current_stock * cost_per_unit) as category_value,
        COUNT(CASE WHEN current_stock <= reorder_level THEN 1 END) as low_stock_items
      FROM supplies
      GROUP BY category
      ORDER BY category_value DESC
    `);

    // Most critical low stock items
    const criticalStockResult = await db.query(`
      SELECT 
        s.id, s.name, s.category, s.current_stock, s.reorder_level, s.unit,
        sup.name as supplier_name,
        ROUND((s.current_stock / s.reorder_level * 100)::numeric, 2) as stock_percentage
      FROM supplies s
      LEFT JOIN suppliers sup ON s.supplier_id = sup.id
      WHERE s.current_stock <= s.reorder_level
      ORDER BY stock_percentage ASC, s.current_stock ASC
      LIMIT 10
    `);

    // Recent inventory movements
    const recentMovementsResult = await db.query(`
      SELECT 
        it.transaction_type, it.quantity, it.reason, it.created_at,
        s.name as supply_name, s.unit,
        u.full_name as user_name
      FROM inventory_transactions it
      JOIN supplies s ON it.supply_id = s.id
      LEFT JOIN users u ON it.user_id = u.id
      ORDER BY it.created_at DESC
      LIMIT 15
    `);

    res.json({
      success: true,
      data: {
        overview: inventoryResult.rows[0],
        by_category: categoryStockResult.rows,
        critical_stock: criticalStockResult.rows,
        recent_movements: recentMovementsResult.rows,
      },
    });
  }),
);

// Get sales analytics
router.get(
  "/sales",
  [
    authenticateToken,
    query("period").optional().isIn(["week", "month", "quarter"]),
  ],
  catchAsync(async (req, res) => {
    const period = req.query.period || "month";
    let dateGrouping = "";
    let dateFilter = "";

    switch (period) {
      case "week":
        dateGrouping = "DATE_TRUNC('day', o.created_at)";
        dateFilter = "AND o.created_at >= NOW() - INTERVAL '7 days'";
        break;
      case "month":
        dateGrouping = "DATE_TRUNC('day', o.created_at)";
        dateFilter = "AND o.created_at >= NOW() - INTERVAL '30 days'";
        break;
      case "quarter":
        dateGrouping = "DATE_TRUNC('week', o.created_at)";
        dateFilter = "AND o.created_at >= NOW() - INTERVAL '90 days'";
        break;
    }

    // Sales performance over time
    const salesTrendResult = await db.query(`
      SELECT 
        ${dateGrouping} as period,
        COUNT(o.id) as order_count,
        SUM(o.total_amount) as revenue,
        COUNT(DISTINCT o.customer_id) as unique_customers,
        AVG(o.total_amount) as avg_order_value
      FROM orders o
      WHERE o.status NOT IN ('cancelled') ${dateFilter}
      GROUP BY ${dateGrouping}
      ORDER BY period ASC
    `);

    // Customer segmentation
    const customerSegmentResult = await db.query(`
      SELECT 
        CASE 
          WHEN total_spent >= 10000 THEN 'High Value'
          WHEN total_spent >= 5000 THEN 'Medium Value'
          WHEN total_spent >= 1000 THEN 'Low Value'
          ELSE 'New Customer'
        END as segment,
        COUNT(*) as customer_count,
        SUM(total_spent) as segment_revenue,
        AVG(total_spent) as avg_customer_value
      FROM (
        SELECT 
          c.id,
          COALESCE(SUM(o.total_amount), 0) as total_spent
        FROM customers c
        LEFT JOIN orders o ON c.id = o.customer_id AND o.status NOT IN ('cancelled')
        WHERE c.is_active = true ${dateFilter.replace("o.created_at", "o.created_at")}
        GROUP BY c.id
      ) customer_totals
      GROUP BY segment
      ORDER BY avg_customer_value DESC
    `);

    // Product performance
    const productPerformanceResult = await db.query(`
      SELECT 
        s.name, s.category,
        COUNT(oi.id) as times_ordered,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.subtotal) as total_revenue,
        AVG(oi.unit_price) as avg_price
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN supplies s ON oi.supply_id = s.id
      WHERE o.status NOT IN ('cancelled') ${dateFilter.replace("created_at", "o.created_at")}
      GROUP BY s.id, s.name, s.category
      ORDER BY total_revenue DESC
      LIMIT 15
    `);

    // Sales by customer type
    const customerTypeResult = await db.query(`
      SELECT 
        c.customer_type,
        COUNT(DISTINCT c.id) as customer_count,
        COUNT(o.id) as order_count,
        SUM(o.total_amount) as total_revenue,
        AVG(o.total_amount) as avg_order_value
      FROM customers c
      JOIN orders o ON c.id = o.customer_id
      WHERE o.status NOT IN ('cancelled') ${dateFilter.replace("created_at", "o.created_at")}
      GROUP BY c.customer_type
      ORDER BY total_revenue DESC
    `);

    res.json({
      success: true,
      data: {
        period,
        sales_trend: salesTrendResult.rows,
        customer_segments: customerSegmentResult.rows,
        product_performance: productPerformanceResult.rows,
        by_customer_type: customerTypeResult.rows,
      },
    });
  }),
);

// Get predictions and recommendations
router.get(
  "/insights",
  authenticateToken,
  catchAsync(async (req, res) => {
    // Purchase recommendations (supplies that might need restocking soon)
    const restockRecommendationsResult = await db.query(`
      SELECT 
        s.id, s.name, s.category, s.current_stock, s.reorder_level,
        s.unit, sup.name as supplier_name,
        COALESCE(recent_usage.avg_monthly_usage, 0) as avg_monthly_usage,
        CASE 
          WHEN COALESCE(recent_usage.avg_monthly_usage, 0) > 0 
          THEN ROUND((s.current_stock / recent_usage.avg_monthly_usage * 30)::numeric, 1)
          ELSE NULL
        END as estimated_days_remaining
      FROM supplies s
      LEFT JOIN suppliers sup ON s.supplier_id = sup.id
      LEFT JOIN (
        SELECT 
          oi.supply_id,
          AVG(monthly_usage.usage) as avg_monthly_usage
        FROM (
          SELECT 
            oi.supply_id,
            EXTRACT(YEAR FROM o.created_at) as year,
            EXTRACT(MONTH FROM o.created_at) as month,
            SUM(oi.quantity) as usage
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE o.created_at >= NOW() - INTERVAL '6 months'
            AND o.status NOT IN ('cancelled')
          GROUP BY oi.supply_id, EXTRACT(YEAR FROM o.created_at), EXTRACT(MONTH FROM o.created_at)
        ) monthly_usage
        GROUP BY monthly_usage.supply_id
      ) recent_usage ON s.id = recent_usage.supply_id
      WHERE s.current_stock > 0
      ORDER BY estimated_days_remaining ASC NULLS LAST, s.current_stock ASC
      LIMIT 10
    `);

    // Top growth opportunities (customer segments with potential)
    const growthOpportunitiesResult = await db.query(`
      SELECT 
        c.id, c.name, c.customer_type, c.company_name,
        COUNT(o.id) as order_count,
        SUM(o.total_amount) as total_spent,
        AVG(o.total_amount) as avg_order_value,
        MAX(o.created_at) as last_order_date,
        EXTRACT(DAYS FROM (NOW() - MAX(o.created_at))) as days_since_last_order
      FROM customers c
      JOIN orders o ON c.id = o.customer_id
      WHERE c.is_active = true 
        AND o.status NOT IN ('cancelled')
        AND o.created_at >= NOW() - INTERVAL '1 year'
      GROUP BY c.id, c.name, c.customer_type, c.company_name
      HAVING COUNT(o.id) >= 3 
        AND SUM(o.total_amount) >= 1000
        AND MAX(o.created_at) < NOW() - INTERVAL '30 days'
      ORDER BY total_spent DESC, days_since_last_order DESC
      LIMIT 10
    `);

    // Seasonal trends
    const seasonalTrendsResult = await db.query(`
      SELECT 
        EXTRACT(MONTH FROM o.created_at) as month,
        COUNT(o.id) as order_count,
        SUM(o.total_amount) as revenue,
        AVG(o.total_amount) as avg_order_value
      FROM orders o
      WHERE o.created_at >= NOW() - INTERVAL '2 years'
        AND o.status NOT IN ('cancelled')
      GROUP BY EXTRACT(MONTH FROM o.created_at)
      ORDER BY month
    `);

    // Latest ML predictions (if available)
    const mlPredictionsResult = await db.query(`
      SELECT 
        prediction_type,
        commodity,
        customer_id,
        confidence_score,
        predicted_value,
        prediction_date,
        c.name as customer_name
      FROM ml_predictions mp
      LEFT JOIN customers c ON mp.customer_id = c.id
      WHERE mp.prediction_date >= NOW() - INTERVAL '7 days'
      ORDER BY mp.prediction_date DESC, mp.confidence_score DESC
      LIMIT 20
    `);

    res.json({
      success: true,
      data: {
        restock_recommendations: restockRecommendationsResult.rows,
        growth_opportunities: growthOpportunitiesResult.rows,
        seasonal_trends: seasonalTrendsResult.rows,
        ml_predictions: mlPredictionsResult.rows,
      },
    });
  }),
);

// Get real-time alerts summary
router.get(
  "/alerts-summary",
  authenticateToken,
  catchAsync(async (req, res) => {
    // Alert counts by severity
    const alertCountsResult = await db.query(
      `
      SELECT 
        severity,
        COUNT(*) as count,
        COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count
      FROM alerts
      WHERE user_id = $1 OR user_id IS NULL
      GROUP BY severity
      ORDER BY 
        CASE severity 
          WHEN 'critical' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          WHEN 'low' THEN 4 
        END
    `,
      [req.user.id],
    );

    // Recent critical alerts
    const criticalAlertsResult = await db.query(
      `
      SELECT 
        id, title, message, alert_type, created_at, is_read
      FROM alerts
      WHERE (user_id = $1 OR user_id IS NULL)
        AND severity IN ('critical', 'high')
        AND created_at >= NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
      LIMIT 5
    `,
      [req.user.id],
    );

    // Alert trends (last 7 days)
    const alertTrendsResult = await db.query(
      `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as alert_count,
        COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_count
      FROM alerts
      WHERE (user_id = $1 OR user_id IS NULL)
        AND created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `,
      [req.user.id],
    );

    res.json({
      success: true,
      data: {
        alert_counts: alertCountsResult.rows,
        recent_critical: criticalAlertsResult.rows,
        alert_trends: alertTrendsResult.rows,
      },
    });
  }),
);

module.exports = router;
