const express = require("express");
const { validationResult, body, query } = require("express-validator");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { catchAsync, AppError } = require("../middleware/errorHandler");
const db = require("../database/db");

const router = express.Router();

// Get all customers with filtering and pagination
router.get(
  "/",
  [
    authenticateToken,
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("search").optional().isLength({ max: 100 }),
    query("type").optional().isIn(["individual", "business"]),
    query("active").optional().isBoolean(),
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
    const { search, type, active } = req.query;

    let whereClause = "WHERE 1=1";
    const queryParams = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (c.name ILIKE $${paramIndex++} OR c.email ILIKE $${paramIndex - 1} OR c.phone ILIKE $${paramIndex - 1})`;
      queryParams.push(`%${search}%`);
    }

    if (type) {
      whereClause += ` AND c.customer_type = $${paramIndex++}`;
      queryParams.push(type);
    }

    if (active !== undefined) {
      whereClause += ` AND c.is_active = $${paramIndex++}`;
      queryParams.push(active === "true");
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM customers c ${whereClause}`;
    const countResult = await db.query(countQuery, queryParams);
    const totalCustomers = parseInt(countResult.rows[0].count);

    // Get customers data with order statistics
    const customersQuery = `
      SELECT 
        c.id, c.name, c.email, c.phone, c.address, c.customer_type,
        c.is_active, c.created_at, c.updated_at,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        MAX(o.created_at) as last_order_date
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      ${whereClause}
      GROUP BY c.id, c.name, c.email, c.phone, c.address, c.customer_type,
               c.is_active, c.created_at, c.updated_at
      ORDER BY c.updated_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    queryParams.push(limit, offset);
    const result = await db.query(customersQuery, queryParams);

    res.json({
      success: true,
      data: {
        customers: result.rows,
        pagination: {
          page,
          limit,
          total: totalCustomers,
          totalPages: Math.ceil(totalCustomers / limit),
        },
      },
    });
  }),
);

// Get customer by ID with detailed analytics
router.get(
  "/:id",
  authenticateToken,
  catchAsync(async (req, res) => {
    const { id } = req.params;

    // Get customer details
    const customerResult = await db.query(
      "SELECT * FROM customers WHERE id = $1",
      [id],
    );

    if (customerResult.rows.length === 0) {
      throw new AppError("Customer not found", 404);
    }

    // Get customer analytics
    const analyticsResult = await db.query(
      `
      SELECT 
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        COALESCE(AVG(o.total_amount), 0) as avg_order_value,
        MAX(o.created_at) as last_order_date,
        MIN(o.created_at) as first_order_date
      FROM orders o
      WHERE o.customer_id = $1
    `,
      [id],
    );

    // Get top purchased supplies
    const topSuppliesResult = await db.query(
      `
      SELECT 
        s.name, s.category,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.quantity * oi.unit_price) as total_spent
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN supplies s ON oi.supply_id = s.id
      WHERE o.customer_id = $1
      GROUP BY s.id, s.name, s.category
      ORDER BY total_spent DESC
      LIMIT 10
    `,
      [id],
    );

    // Get recent orders
    const recentOrdersResult = await db.query(
      `
      SELECT 
        o.id, o.order_number, o.status, o.total_amount, o.created_at,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.customer_id = $1
      GROUP BY o.id, o.order_number, o.status, o.total_amount, o.created_at
      ORDER BY o.created_at DESC
      LIMIT 5
    `,
      [id],
    );

    res.json({
      success: true,
      data: {
        customer: customerResult.rows[0],
        analytics: analyticsResult.rows[0],
        top_supplies: topSuppliesResult.rows,
        recent_orders: recentOrdersResult.rows,
      },
    });
  }),
);

// Create new customer
router.post(
  "/",
  [
    authenticateToken,
    requireRole("admin", "manager"),
    body("name").notEmpty().isLength({ max: 100 }).trim(),
    body("email").optional().isEmail().normalizeEmail(),
    body("phone").optional().isLength({ max: 20 }).trim(),
    body("address").optional().isLength({ max: 500 }).trim(),
    body("customer_type").isIn(["individual", "business"]),
    body("company_name").optional().isLength({ max: 100 }).trim(),
    body("tax_id").optional().isLength({ max: 50 }).trim(),
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

    const { name, email, phone, address, customer_type, company_name, tax_id } =
      req.body;

    // Check if email already exists
    if (email) {
      const emailCheck = await db.query(
        "SELECT id FROM customers WHERE email = $1",
        [email],
      );
      if (emailCheck.rows.length > 0) {
        throw new AppError("Email already registered", 400);
      }
    }

    const result = await db.query(
      `
      INSERT INTO customers (
        name, email, phone, address, customer_type, company_name, tax_id
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
      [name, email, phone, address, customer_type, company_name, tax_id],
    );

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: result.rows[0],
    });
  }),
);

// Update customer
router.put(
  "/:id",
  [
    authenticateToken,
    requireRole("admin", "manager"),
    body("name").optional().isLength({ max: 100 }).trim(),
    body("email").optional().isEmail().normalizeEmail(),
    body("phone").optional().isLength({ max: 20 }).trim(),
    body("address").optional().isLength({ max: 500 }).trim(),
    body("customer_type").optional().isIn(["individual", "business"]),
    body("company_name").optional().isLength({ max: 100 }).trim(),
    body("tax_id").optional().isLength({ max: 50 }).trim(),
    body("is_active").optional().isBoolean(),
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

    const { id } = req.params;
    const {
      name,
      email,
      phone,
      address,
      customer_type,
      company_name,
      tax_id,
      is_active,
    } = req.body;

    // Check if customer exists
    const customerCheck = await db.query(
      "SELECT id FROM customers WHERE id = $1",
      [id],
    );
    if (customerCheck.rows.length === 0) {
      throw new AppError("Customer not found", 404);
    }

    // Check if email is already taken by another customer
    if (email) {
      const emailCheck = await db.query(
        "SELECT id FROM customers WHERE email = $1 AND id != $2",
        [email, id],
      );
      if (emailCheck.rows.length > 0) {
        throw new AppError("Email already registered", 400);
      }
    }

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (email !== undefined) {
      updateFields.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (phone !== undefined) {
      updateFields.push(`phone = $${paramIndex++}`);
      values.push(phone);
    }
    if (address !== undefined) {
      updateFields.push(`address = $${paramIndex++}`);
      values.push(address);
    }
    if (customer_type !== undefined) {
      updateFields.push(`customer_type = $${paramIndex++}`);
      values.push(customer_type);
    }
    if (company_name !== undefined) {
      updateFields.push(`company_name = $${paramIndex++}`);
      values.push(company_name);
    }
    if (tax_id !== undefined) {
      updateFields.push(`tax_id = $${paramIndex++}`);
      values.push(tax_id);
    }
    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE customers 
      SET ${updateFields.join(", ")} 
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);

    res.json({
      success: true,
      message: "Customer updated successfully",
      data: result.rows[0],
    });
  }),
);

// Get customer purchase patterns and analytics
router.get(
  "/analytics/purchase-patterns",
  authenticateToken,
  catchAsync(async (req, res) => {
    const timeframe = req.query.timeframe || "6months";
    let dateFilter = "";

    switch (timeframe) {
      case "1month":
        dateFilter = "AND o.created_at >= NOW() - INTERVAL '1 month'";
        break;
      case "3months":
        dateFilter = "AND o.created_at >= NOW() - INTERVAL '3 months'";
        break;
      case "6months":
        dateFilter = "AND o.created_at >= NOW() - INTERVAL '6 months'";
        break;
      case "1year":
        dateFilter = "AND o.created_at >= NOW() - INTERVAL '1 year'";
        break;
      default:
        dateFilter = "";
    }

    // Customer segmentation by purchase value
    const segmentationResult = await db.query(`
      SELECT 
        CASE 
          WHEN total_spent >= 10000 THEN 'High Value'
          WHEN total_spent >= 5000 THEN 'Medium Value'
          WHEN total_spent >= 1000 THEN 'Low Value'
          ELSE 'New Customer'
        END as segment,
        COUNT(*) as customer_count,
        AVG(total_spent) as avg_spent,
        SUM(total_spent) as total_revenue
      FROM (
        SELECT 
          c.id,
          COALESCE(SUM(o.total_amount), 0) as total_spent
        FROM customers c
        LEFT JOIN orders o ON c.id = o.customer_id
        WHERE c.is_active = true ${dateFilter}
        GROUP BY c.id
      ) customer_totals
      GROUP BY segment
      ORDER BY avg_spent DESC
    `);

    // Purchase frequency patterns
    const frequencyResult = await db.query(`
      SELECT 
        CASE 
          WHEN order_count >= 20 THEN 'Very Frequent'
          WHEN order_count >= 10 THEN 'Frequent'
          WHEN order_count >= 5 THEN 'Regular'
          WHEN order_count >= 1 THEN 'Occasional'
          ELSE 'No Orders'
        END as frequency_segment,
        COUNT(*) as customer_count,
        AVG(order_count) as avg_orders,
        AVG(avg_order_value) as avg_order_value
      FROM (
        SELECT 
          c.id,
          COUNT(o.id) as order_count,
          COALESCE(AVG(o.total_amount), 0) as avg_order_value
        FROM customers c
        LEFT JOIN orders o ON c.id = o.customer_id
        WHERE c.is_active = true ${dateFilter}
        GROUP BY c.id
      ) customer_frequency
      GROUP BY frequency_segment
      ORDER BY avg_orders DESC
    `);

    // Top products by customer segments
    const topProductsResult = await db.query(`
      SELECT 
        s.name as product_name,
        s.category,
        COUNT(DISTINCT o.customer_id) as unique_customers,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.quantity * oi.unit_price) as total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN supplies s ON oi.supply_id = s.id
      JOIN customers c ON o.customer_id = c.id
      WHERE c.is_active = true ${dateFilter}
      GROUP BY s.id, s.name, s.category
      ORDER BY total_revenue DESC
      LIMIT 15
    `);

    // Seasonal trends
    const seasonalResult = await db.query(`
      SELECT 
        EXTRACT(MONTH FROM o.created_at) as month,
        COUNT(DISTINCT o.customer_id) as active_customers,
        COUNT(o.id) as total_orders,
        SUM(o.total_amount) as total_revenue,
        AVG(o.total_amount) as avg_order_value
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE c.is_active = true ${dateFilter}
      GROUP BY EXTRACT(MONTH FROM o.created_at)
      ORDER BY month
    `);

    res.json({
      success: true,
      data: {
        timeframe,
        segmentation: segmentationResult.rows,
        frequency_patterns: frequencyResult.rows,
        top_products: topProductsResult.rows,
        seasonal_trends: seasonalResult.rows,
      },
    });
  }),
);

// Get customer predictions (placeholder for ML integration)
router.get(
  "/predictions/:id",
  authenticateToken,
  catchAsync(async (req, res) => {
    const { id } = req.params;

    // Verify customer exists
    const customerCheck = await db.query(
      "SELECT id, name FROM customers WHERE id = $1",
      [id],
    );
    if (customerCheck.rows.length === 0) {
      throw new AppError("Customer not found", 404);
    }

    // Get latest ML predictions for this customer
    const predictionsResult = await db.query(
      `
      SELECT 
        prediction_type,
        confidence_score,
        predicted_value,
        prediction_date,
        model_version
      FROM ml_predictions 
      WHERE customer_id = $1 
      AND prediction_type IN ('churn_risk', 'next_purchase_value', 'purchase_probability')
      ORDER BY prediction_date DESC
      LIMIT 10
    `,
      [id],
    );

    // Calculate customer historical patterns for context
    const patternsResult = await db.query(
      `
      SELECT 
        AVG(o.total_amount) as avg_order_value,
        COUNT(o.id) as total_orders,
        MAX(o.created_at) as last_order_date,
        AVG(EXTRACT(EPOCH FROM (o.created_at - LAG(o.created_at) OVER (ORDER BY o.created_at))) / 86400) as avg_days_between_orders
      FROM orders o
      WHERE o.customer_id = $1
    `,
      [id],
    );

    res.json({
      success: true,
      data: {
        customer: customerCheck.rows[0],
        predictions: predictionsResult.rows,
        historical_patterns: patternsResult.rows[0] || {},
      },
    });
  }),
);

// Delete customer (soft delete)
router.delete(
  "/:id",
  [authenticateToken, requireRole("admin")],
  catchAsync(async (req, res) => {
    const { id } = req.params;

    // Check if customer has orders
    const orderCheck = await db.query(
      "SELECT COUNT(*) FROM orders WHERE customer_id = $1",
      [id],
    );

    if (parseInt(orderCheck.rows[0].count) > 0) {
      // Soft delete if customer has orders
      const result = await db.query(
        "UPDATE customers SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id",
        [id],
      );

      if (result.rows.length === 0) {
        throw new AppError("Customer not found", 404);
      }

      res.json({
        success: true,
        message: "Customer deactivated successfully",
      });
    } else {
      // Hard delete if no orders
      const result = await db.query(
        "DELETE FROM customers WHERE id = $1 RETURNING id",
        [id],
      );

      if (result.rows.length === 0) {
        throw new AppError("Customer not found", 404);
      }

      res.json({
        success: true,
        message: "Customer deleted successfully",
      });
    }
  }),
);

module.exports = router;
