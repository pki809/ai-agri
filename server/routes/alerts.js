const express = require("express");
const { validationResult, body, query } = require("express-validator");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { catchAsync, AppError } = require("../middleware/errorHandler");
const db = require("../database/db");

const router = express.Router();

// Get all alerts with filtering
router.get(
  "/",
  [
    authenticateToken,
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("severity").optional().isIn(["low", "medium", "high", "critical"]),
    query("is_read").optional().isBoolean(),
    query("alert_type").optional().isLength({ max: 50 }),
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
    const { severity, is_read, alert_type } = req.query;

    let whereClause = "WHERE (a.user_id = $1 OR a.user_id IS NULL)";
    const queryParams = [req.user.id];
    let paramIndex = 2;

    if (severity) {
      whereClause += ` AND a.severity = $${paramIndex++}`;
      queryParams.push(severity);
    }

    if (is_read !== undefined) {
      whereClause += ` AND a.is_read = $${paramIndex++}`;
      queryParams.push(is_read === "true");
    }

    if (alert_type) {
      whereClause += ` AND a.alert_type = $${paramIndex++}`;
      queryParams.push(alert_type);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM alerts a ${whereClause}`;
    const countResult = await db.query(countQuery, queryParams);
    const totalAlerts = parseInt(countResult.rows[0].count);

    // Get alerts data
    const alertsQuery = `
      SELECT 
        a.id, a.title, a.message, a.alert_type, a.severity,
        a.is_read, a.metadata, a.created_at,
        CASE 
          WHEN a.created_at >= NOW() - INTERVAL '1 hour' THEN 'new'
          WHEN a.created_at >= NOW() - INTERVAL '24 hours' THEN 'recent'
          ELSE 'old'
        END as age_category
      FROM alerts a
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    queryParams.push(limit, offset);
    const result = await db.query(alertsQuery, queryParams);

    res.json({
      success: true,
      data: {
        alerts: result.rows,
        pagination: {
          page,
          limit,
          total: totalAlerts,
          totalPages: Math.ceil(totalAlerts / limit),
        },
      },
    });
  }),
);

// Get alert by ID
router.get(
  "/:id",
  authenticateToken,
  catchAsync(async (req, res) => {
    const { id } = req.params;

    const result = await db.query(
      `
      SELECT * FROM alerts 
      WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)
    `,
      [id, req.user.id],
    );

    if (result.rows.length === 0) {
      throw new AppError("Alert not found", 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  }),
);

// Create new alert
router.post(
  "/",
  [
    authenticateToken,
    requireRole("admin", "manager"),
    body("title").notEmpty().isLength({ max: 200 }).trim(),
    body("message").notEmpty().isLength({ max: 1000 }).trim(),
    body("alert_type").notEmpty().isLength({ max: 50 }).trim(),
    body("severity").isIn(["low", "medium", "high", "critical"]),
    body("user_id").optional().isUUID(),
    body("metadata").optional().isObject(),
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

    const { title, message, alert_type, severity, user_id, metadata } =
      req.body;

    // Verify user exists if user_id is provided
    if (user_id) {
      const userCheck = await db.query("SELECT id FROM users WHERE id = $1", [
        user_id,
      ]);
      if (userCheck.rows.length === 0) {
        throw new AppError("User not found", 400);
      }
    }

    const result = await db.query(
      `
      INSERT INTO alerts (
        title, message, alert_type, severity, user_id, metadata
      ) 
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
      [title, message, alert_type, severity, user_id, metadata],
    );

    // Emit real-time alert if Socket.io is available
    if (req.app.get("io")) {
      const io = req.app.get("io");
      const alertData = result.rows[0];

      if (user_id) {
        // Send to specific user
        io.to(`user_${user_id}`).emit("new_alert", alertData);
      } else {
        // Broadcast to all users
        io.emit("new_alert", alertData);
      }
    }

    res.status(201).json({
      success: true,
      message: "Alert created successfully",
      data: result.rows[0],
    });
  }),
);

// Mark alert as read
router.put(
  "/:id/read",
  authenticateToken,
  catchAsync(async (req, res) => {
    const { id } = req.params;

    const result = await db.query(
      `
      UPDATE alerts 
      SET is_read = true, updated_at = NOW() 
      WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)
      RETURNING *
    `,
      [id, req.user.id],
    );

    if (result.rows.length === 0) {
      throw new AppError("Alert not found", 404);
    }

    res.json({
      success: true,
      message: "Alert marked as read",
      data: result.rows[0],
    });
  }),
);

// Mark multiple alerts as read
router.put(
  "/bulk/read",
  [authenticateToken, body("alert_ids").isArray().notEmpty()],
  catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }

    const { alert_ids } = req.body;

    // Validate all IDs are UUIDs
    for (const id of alert_ids) {
      if (
        !id ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          id,
        )
      ) {
        throw new AppError("Invalid alert ID format", 400);
      }
    }

    const placeholders = alert_ids.map((_, index) => `$${index + 2}`).join(",");
    const query = `
      UPDATE alerts 
      SET is_read = true, updated_at = NOW() 
      WHERE id IN (${placeholders}) AND (user_id = $1 OR user_id IS NULL)
      RETURNING id
    `;

    const result = await db.query(query, [req.user.id, ...alert_ids]);

    res.json({
      success: true,
      message: `${result.rows.length} alerts marked as read`,
      updated_count: result.rows.length,
    });
  }),
);

// Get alert statistics
router.get(
  "/stats/overview",
  authenticateToken,
  catchAsync(async (req, res) => {
    const statsResult = await db.query(
      `
      SELECT 
        COUNT(*) as total_alerts,
        COUNT(CASE WHEN is_read = false THEN 1 END) as unread_alerts,
        COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_alerts,
        COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_alerts,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as alerts_24h,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as alerts_7d
      FROM alerts 
      WHERE user_id = $1 OR user_id IS NULL
    `,
      [req.user.id],
    );

    const typeStatsResult = await db.query(
      `
      SELECT 
        alert_type,
        COUNT(*) as count,
        COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count
      FROM alerts 
      WHERE user_id = $1 OR user_id IS NULL
      GROUP BY alert_type
      ORDER BY count DESC
      LIMIT 10
    `,
      [req.user.id],
    );

    const recentAlertsResult = await db.query(
      `
      SELECT 
        id, title, severity, alert_type, created_at, is_read
      FROM alerts 
      WHERE user_id = $1 OR user_id IS NULL
      ORDER BY created_at DESC
      LIMIT 5
    `,
      [req.user.id],
    );

    res.json({
      success: true,
      data: {
        overview: statsResult.rows[0],
        by_type: typeStatsResult.rows,
        recent_alerts: recentAlertsResult.rows,
      },
    });
  }),
);

// Delete alert
router.delete(
  "/:id",
  [authenticateToken, requireRole("admin", "manager")],
  catchAsync(async (req, res) => {
    const { id } = req.params;

    const result = await db.query(
      "DELETE FROM alerts WHERE id = $1 RETURNING id",
      [id],
    );

    if (result.rows.length === 0) {
      throw new AppError("Alert not found", 404);
    }

    res.json({
      success: true,
      message: "Alert deleted successfully",
    });
  }),
);

// Create system alerts (automated)
router.post(
  "/system/stock-alerts",
  [authenticateToken, requireRole("admin", "manager")],
  catchAsync(async (req, res) => {
    // Find supplies with low stock
    const lowStockSupplies = await db.query(`
      SELECT 
        s.id, s.name, s.current_stock, s.reorder_level, s.unit,
        sup.name as supplier_name
      FROM supplies s
      LEFT JOIN suppliers sup ON s.supplier_id = sup.id
      WHERE s.current_stock <= s.reorder_level
    `);

    const alertsCreated = [];

    for (const supply of lowStockSupplies.rows) {
      const urgencyLevel = supply.current_stock / supply.reorder_level;
      let severity = "medium";

      if (urgencyLevel <= 0.2) {
        severity = "critical";
      } else if (urgencyLevel <= 0.5) {
        severity = "high";
      }

      const alertData = {
        title: `Low Stock Alert: ${supply.name}`,
        message: `${supply.name} is running low. Current stock: ${supply.current_stock} ${supply.unit}. Reorder level: ${supply.reorder_level} ${supply.unit}.`,
        alert_type: "low_stock",
        severity,
        metadata: {
          supply_id: supply.id,
          current_stock: supply.current_stock,
          reorder_level: supply.reorder_level,
          supplier_name: supply.supplier_name,
        },
      };

      const result = await db.query(
        `
        INSERT INTO alerts (title, message, alert_type, severity, metadata)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
        [
          alertData.title,
          alertData.message,
          alertData.alert_type,
          alertData.severity,
          alertData.metadata,
        ],
      );

      alertsCreated.push(result.rows[0]);

      // Emit real-time alert
      if (req.app.get("io")) {
        const io = req.app.get("io");
        io.emit("new_alert", result.rows[0]);
      }
    }

    res.json({
      success: true,
      message: `${alertsCreated.length} stock alerts created`,
      alerts_created: alertsCreated.length,
      data: alertsCreated,
    });
  }),
);

// Create market trend alerts
router.post(
  "/system/market-alerts",
  [authenticateToken, requireRole("admin", "manager")],
  catchAsync(async (req, res) => {
    // Find significant market changes in the last 24 hours
    const significantChanges = await db.query(`
      SELECT 
        commodity, percentage_change, trend_direction, closing_price
      FROM market_trends
      WHERE created_at >= NOW() - INTERVAL '24 hours'
        AND ABS(percentage_change) >= 5
      ORDER BY ABS(percentage_change) DESC
    `);

    const alertsCreated = [];

    for (const trend of significantChanges.rows) {
      const changeAbs = Math.abs(trend.percentage_change);
      let severity = "medium";

      if (changeAbs >= 15) {
        severity = "critical";
      } else if (changeAbs >= 10) {
        severity = "high";
      }

      const direction = trend.percentage_change > 0 ? "increased" : "decreased";
      const alertData = {
        title: `Market Alert: ${trend.commodity} Price ${direction}`,
        message: `${trend.commodity} price has ${direction} by ${changeAbs.toFixed(2)}% to $${trend.closing_price}`,
        alert_type: "market_change",
        severity,
        metadata: {
          commodity: trend.commodity,
          percentage_change: trend.percentage_change,
          closing_price: trend.closing_price,
          trend_direction: trend.trend_direction,
        },
      };

      const result = await db.query(
        `
        INSERT INTO alerts (title, message, alert_type, severity, metadata)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
        [
          alertData.title,
          alertData.message,
          alertData.alert_type,
          alertData.severity,
          alertData.metadata,
        ],
      );

      alertsCreated.push(result.rows[0]);

      // Emit real-time alert
      if (req.app.get("io")) {
        const io = req.app.get("io");
        io.emit("new_alert", result.rows[0]);
      }
    }

    res.json({
      success: true,
      message: `${alertsCreated.length} market alerts created`,
      alerts_created: alertsCreated.length,
      data: alertsCreated,
    });
  }),
);

module.exports = router;
