const express = require("express");
const { validationResult, body, query } = require("express-validator");
const {
  authenticateToken,
  requireRole,
  requireApiKey,
} = require("../middleware/auth");
const { catchAsync, AppError } = require("../middleware/errorHandler");
const db = require("../database/db");

const router = express.Router();

// Get ML predictions with filtering
router.get(
  "/predictions",
  [
    authenticateToken,
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("prediction_type")
      .optional()
      .isIn([
        "churn_risk",
        "purchase_prediction",
        "demand_forecast",
        "price_forecast",
        "inventory_optimization",
      ]),
    query("customer_id").optional().isUUID(),
    query("commodity").optional().isLength({ max: 100 }),
    query("min_confidence").optional().isFloat({ min: 0, max: 1 }),
  ],
  catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { prediction_type, customer_id, commodity, min_confidence } =
      req.query;

    let whereClause = "WHERE 1=1";
    const queryParams = [];
    let paramIndex = 1;

    if (prediction_type) {
      whereClause += ` AND mp.prediction_type = $${paramIndex++}`;
      queryParams.push(prediction_type);
    }

    if (customer_id) {
      whereClause += ` AND mp.customer_id = $${paramIndex++}`;
      queryParams.push(customer_id);
    }

    if (commodity) {
      whereClause += ` AND mp.commodity ILIKE $${paramIndex++}`;
      queryParams.push(`%${commodity}%`);
    }

    if (min_confidence) {
      whereClause += ` AND mp.confidence_score >= $${paramIndex++}`;
      queryParams.push(min_confidence);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM ml_predictions mp ${whereClause}`;
    const countResult = await db.query(countQuery, queryParams);
    const totalPredictions = parseInt(countResult.rows[0].count);

    // Get predictions data
    const predictionsQuery = `
      SELECT 
        mp.id, mp.prediction_type, mp.confidence_score, mp.predicted_value,
        mp.prediction_date, mp.model_version, mp.input_features,
        mp.commodity, mp.created_at,
        c.name as customer_name, c.email as customer_email,
        CASE 
          WHEN mp.confidence_score >= 0.8 THEN 'high'
          WHEN mp.confidence_score >= 0.6 THEN 'medium'
          ELSE 'low'
        END as confidence_level
      FROM ml_predictions mp
      LEFT JOIN customers c ON mp.customer_id = c.id
      ${whereClause}
      ORDER BY mp.prediction_date DESC, mp.confidence_score DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    queryParams.push(limit, offset);
    const result = await db.query(predictionsQuery, queryParams);

    res.json({
      success: true,
      data: {
        predictions: result.rows,
        pagination: {
          page,
          limit,
          total: totalPredictions,
          totalPages: Math.ceil(totalPredictions / limit),
        },
      },
    });
  }),
);

// Store new ML prediction (API key required)
router.post(
  "/predictions",
  [
    requireApiKey,
    body("prediction_type")
      .isIn([
        "churn_risk",
        "purchase_prediction",
        "demand_forecast",
        "price_forecast",
        "inventory_optimization",
      ])
      .withMessage("Invalid prediction type"),
    body("confidence_score").isFloat({ min: 0, max: 1 }),
    body("predicted_value").notEmpty(),
    body("model_version").notEmpty().isLength({ max: 50 }).trim(),
    body("input_features").optional().isObject(),
    body("customer_id").optional().isUUID(),
    body("supply_id").optional().isUUID(),
    body("commodity").optional().isLength({ max: 100 }).trim(),
  ],
  catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }

    const {
      prediction_type,
      confidence_score,
      predicted_value,
      model_version,
      input_features,
      customer_id,
      supply_id,
      commodity,
    } = req.body;

    // Validate references exist
    if (customer_id) {
      const customerCheck = await db.query(
        "SELECT id FROM customers WHERE id = $1",
        [customer_id],
      );
      if (customerCheck.rows.length === 0) {
        throw new AppError("Customer not found", 400);
      }
    }

    if (supply_id) {
      const supplyCheck = await db.query(
        "SELECT id FROM supplies WHERE id = $1",
        [supply_id],
      );
      if (supplyCheck.rows.length === 0) {
        throw new AppError("Supply not found", 400);
      }
    }

    const result = await db.query(
      `
      INSERT INTO ml_predictions (
        prediction_type, confidence_score, predicted_value, model_version,
        input_features, customer_id, supply_id, commodity
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
      [
        prediction_type,
        confidence_score,
        predicted_value,
        model_version,
        input_features,
        customer_id,
        supply_id,
        commodity,
      ],
    );

    res.status(201).json({
      success: true,
      message: "Prediction stored successfully",
      data: result.rows[0],
    });
  }),
);

// Get training data for ML models
router.get(
  "/training-data/:dataset",
  [
    requireApiKey,
    query("start_date").optional().isISO8601(),
    query("end_date").optional().isISO8601(),
    query("limit").optional().isInt({ min: 1, max: 10000 }),
  ],
  catchAsync(async (req, res) => {
    const { dataset } = req.params;
    const { start_date, end_date, limit } = req.query;

    let query = "";
    let queryParams = [];
    let paramIndex = 1;

    switch (dataset) {
      case "customer-behavior":
        query = `
          SELECT 
            c.id as customer_id, c.customer_type, c.company_name,
            COUNT(o.id) as order_count,
            SUM(o.total_amount) as total_spent,
            AVG(o.total_amount) as avg_order_value,
            MAX(o.created_at) as last_order_date,
            MIN(o.created_at) as first_order_date,
            EXTRACT(DAYS FROM (MAX(o.created_at) - MIN(o.created_at))) as customer_lifespan_days,
            STRING_AGG(DISTINCT s.category, ',') as purchased_categories
          FROM customers c
          LEFT JOIN orders o ON c.id = o.customer_id AND o.status NOT IN ('cancelled')
          LEFT JOIN order_items oi ON o.id = oi.order_id
          LEFT JOIN supplies s ON oi.supply_id = s.id
          WHERE c.is_active = true
        `;
        break;

      case "sales-patterns":
        query = `
          SELECT 
            o.id as order_id, o.total_amount, o.created_at,
            c.customer_type, c.company_name,
            COUNT(oi.id) as item_count,
            STRING_AGG(s.category, ',') as categories,
            SUM(oi.quantity) as total_quantity,
            EXTRACT(DOW FROM o.created_at) as day_of_week,
            EXTRACT(MONTH FROM o.created_at) as month,
            EXTRACT(HOUR FROM o.created_at) as hour
          FROM orders o
          JOIN customers c ON o.customer_id = c.id
          LEFT JOIN order_items oi ON o.id = oi.order_id
          LEFT JOIN supplies s ON oi.supply_id = s.id
          WHERE o.status NOT IN ('cancelled')
        `;
        break;

      case "inventory-usage":
        query = `
          SELECT 
            s.id as supply_id, s.name, s.category, s.cost_per_unit,
            it.transaction_type, it.quantity, it.created_at,
            EXTRACT(DOW FROM it.created_at) as day_of_week,
            EXTRACT(MONTH FROM it.created_at) as month,
            LAG(s.current_stock) OVER (PARTITION BY s.id ORDER BY it.created_at) as previous_stock
          FROM inventory_transactions it
          JOIN supplies s ON it.supply_id = s.id
          WHERE it.transaction_type IN ('sold', 'received')
        `;
        break;

      case "market-trends":
        query = `
          SELECT 
            commodity, date, opening_price, closing_price, high_price, low_price,
            volume, percentage_change, trend_direction,
            LAG(closing_price) OVER (PARTITION BY commodity ORDER BY date) as previous_close,
            AVG(closing_price) OVER (
              PARTITION BY commodity 
              ORDER BY date 
              ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
            ) as ma_7day
          FROM market_trends
          WHERE 1=1
        `;
        break;

      default:
        throw new AppError("Invalid dataset type", 400);
    }

    // Add date filters if provided
    if (start_date) {
      if (dataset === "market-trends") {
        query += ` AND date >= $${paramIndex++}`;
      } else {
        query += ` AND created_at >= $${paramIndex++}`;
      }
      queryParams.push(start_date);
    }

    if (end_date) {
      if (dataset === "market-trends") {
        query += ` AND date <= $${paramIndex++}`;
      } else {
        query += ` AND created_at <= $${paramIndex++}`;
      }
      queryParams.push(end_date);
    }

    // Add grouping for customer behavior
    if (dataset === "customer-behavior") {
      query += `
        GROUP BY c.id, c.customer_type, c.company_name
        HAVING COUNT(o.id) > 0
      `;
    } else if (dataset === "sales-patterns") {
      query += `
        GROUP BY o.id, o.total_amount, o.created_at, c.customer_type, c.company_name
      `;
    }

    // Add ordering and limit
    if (dataset === "market-trends") {
      query += ` ORDER BY commodity, date DESC`;
    } else {
      query += ` ORDER BY created_at DESC`;
    }

    if (limit) {
      query += ` LIMIT $${paramIndex++}`;
      queryParams.push(limit);
    } else {
      query += ` LIMIT 5000`; // Default limit
    }

    const result = await db.query(query, queryParams);

    res.json({
      success: true,
      data: {
        dataset,
        record_count: result.rows.length,
        records: result.rows,
      },
    });
  }),
);

// Get model performance metrics
router.get(
  "/models/performance",
  [authenticateToken, requireRole("admin", "manager")],
  catchAsync(async (req, res) => {
    // Prediction accuracy over time
    const performanceResult = await db.query(`
      SELECT 
        prediction_type,
        model_version,
        COUNT(*) as prediction_count,
        AVG(confidence_score) as avg_confidence,
        MIN(confidence_score) as min_confidence,
        MAX(confidence_score) as max_confidence,
        DATE_TRUNC('day', prediction_date) as prediction_day
      FROM ml_predictions
      WHERE prediction_date >= NOW() - INTERVAL '30 days'
      GROUP BY prediction_type, model_version, DATE_TRUNC('day', prediction_date)
      ORDER BY prediction_day DESC, prediction_type
    `);

    // Model usage statistics
    const usageStatsResult = await db.query(`
      SELECT 
        prediction_type,
        COUNT(*) as total_predictions,
        COUNT(DISTINCT model_version) as model_versions,
        AVG(confidence_score) as avg_confidence,
        MAX(prediction_date) as last_prediction_date
      FROM ml_predictions
      GROUP BY prediction_type
      ORDER BY total_predictions DESC
    `);

    // Recent model performance
    const recentPerformanceResult = await db.query(`
      SELECT 
        prediction_type,
        model_version,
        COUNT(*) as recent_predictions,
        AVG(confidence_score) as avg_confidence
      FROM ml_predictions
      WHERE prediction_date >= NOW() - INTERVAL '7 days'
      GROUP BY prediction_type, model_version
      ORDER BY recent_predictions DESC
    `);

    res.json({
      success: true,
      data: {
        daily_performance: performanceResult.rows,
        usage_statistics: usageStatsResult.rows,
        recent_performance: recentPerformanceResult.rows,
      },
    });
  }),
);

// Batch update predictions (API key required)
router.post(
  "/predictions/batch",
  [
    requireApiKey,
    body("predictions").isArray({ min: 1, max: 100 }),
    body("predictions.*.prediction_type").isIn([
      "churn_risk",
      "purchase_prediction",
      "demand_forecast",
      "price_forecast",
      "inventory_optimization",
    ]),
    body("predictions.*.confidence_score").isFloat({ min: 0, max: 1 }),
    body("predictions.*.predicted_value").notEmpty(),
    body("predictions.*.model_version").notEmpty(),
  ],
  catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }

    const { predictions } = req.body;
    const insertedPredictions = [];

    await db.query("BEGIN");

    try {
      for (const prediction of predictions) {
        const {
          prediction_type,
          confidence_score,
          predicted_value,
          model_version,
          input_features,
          customer_id,
          supply_id,
          commodity,
        } = prediction;

        const result = await db.query(
          `
          INSERT INTO ml_predictions (
            prediction_type, confidence_score, predicted_value, model_version,
            input_features, customer_id, supply_id, commodity
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id, prediction_type, confidence_score
        `,
          [
            prediction_type,
            confidence_score,
            predicted_value,
            model_version,
            input_features || null,
            customer_id || null,
            supply_id || null,
            commodity || null,
          ],
        );

        insertedPredictions.push(result.rows[0]);
      }

      await db.query("COMMIT");

      res.status(201).json({
        success: true,
        message: `${insertedPredictions.length} predictions stored successfully`,
        data: {
          inserted_count: insertedPredictions.length,
          predictions: insertedPredictions,
        },
      });
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  }),
);

// Get predictions summary for dashboard
router.get(
  "/predictions/summary",
  authenticateToken,
  catchAsync(async (req, res) => {
    // Recent predictions summary
    const summaryResult = await db.query(`
      SELECT 
        prediction_type,
        COUNT(*) as count,
        AVG(confidence_score) as avg_confidence,
        MAX(prediction_date) as latest_prediction
      FROM ml_predictions
      WHERE prediction_date >= NOW() - INTERVAL '7 days'
      GROUP BY prediction_type
      ORDER BY count DESC
    `);

    // High confidence predictions
    const highConfidenceResult = await db.query(`
      SELECT 
        mp.id, mp.prediction_type, mp.confidence_score, mp.predicted_value,
        mp.commodity, c.name as customer_name
      FROM ml_predictions mp
      LEFT JOIN customers c ON mp.customer_id = c.id
      WHERE mp.confidence_score >= 0.8
        AND mp.prediction_date >= NOW() - INTERVAL '24 hours'
      ORDER BY mp.confidence_score DESC
      LIMIT 10
    `);

    // Prediction trends
    const trendsResult = await db.query(`
      SELECT 
        DATE(prediction_date) as date,
        COUNT(*) as prediction_count,
        AVG(confidence_score) as avg_confidence
      FROM ml_predictions
      WHERE prediction_date >= NOW() - INTERVAL '14 days'
      GROUP BY DATE(prediction_date)
      ORDER BY date ASC
    `);

    res.json({
      success: true,
      data: {
        summary: summaryResult.rows,
        high_confidence: highConfidenceResult.rows,
        trends: trendsResult.rows,
      },
    });
  }),
);

// Delete old predictions (cleanup)
router.delete(
  "/predictions/cleanup",
  [
    requireApiKey,
    query("days_old")
      .isInt({ min: 30 })
      .withMessage("Must be at least 30 days"),
  ],
  catchAsync(async (req, res) => {
    const daysOld = parseInt(req.query.days_old);

    const result = await db.query(
      `
      DELETE FROM ml_predictions 
      WHERE prediction_date < NOW() - INTERVAL '${daysOld} days'
      RETURNING prediction_type
    `,
    );

    const deletedCount = result.rows.length;
    const deletedByType = result.rows.reduce((acc, row) => {
      acc[row.prediction_type] = (acc[row.prediction_type] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} old predictions`,
      data: {
        deleted_count: deletedCount,
        deleted_by_type: deletedByType,
      },
    });
  }),
);

module.exports = router;
