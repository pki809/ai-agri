const express = require("express");
const { validationResult, body, query } = require("express-validator");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { catchAsync, AppError } = require("../middleware/errorHandler");
const db = require("../database/db");

const router = express.Router();

// Get market trends with filtering
router.get(
  "/",
  [
    authenticateToken,
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("commodity").optional().isLength({ max: 100 }),
    query("timeframe").optional().isIn(["1d", "7d", "30d", "90d", "1y"]),
    query("trend_direction").optional().isIn(["up", "down", "stable"]),
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
    const { commodity, timeframe, trend_direction } = req.query;

    let whereClause = "WHERE 1=1";
    const queryParams = [];
    let paramIndex = 1;

    if (commodity) {
      whereClause += ` AND mt.commodity ILIKE $${paramIndex++}`;
      queryParams.push(`%${commodity}%`);
    }

    if (timeframe) {
      let dateFilter = "";
      switch (timeframe) {
        case "1d":
          dateFilter = "mt.date >= NOW() - INTERVAL '1 day'";
          break;
        case "7d":
          dateFilter = "mt.date >= NOW() - INTERVAL '7 days'";
          break;
        case "30d":
          dateFilter = "mt.date >= NOW() - INTERVAL '30 days'";
          break;
        case "90d":
          dateFilter = "mt.date >= NOW() - INTERVAL '90 days'";
          break;
        case "1y":
          dateFilter = "mt.date >= NOW() - INTERVAL '1 year'";
          break;
      }
      if (dateFilter) {
        whereClause += ` AND ${dateFilter}`;
      }
    }

    if (trend_direction) {
      whereClause += ` AND mt.trend_direction = $${paramIndex++}`;
      queryParams.push(trend_direction);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM market_trends mt ${whereClause}`;
    const countResult = await db.query(countQuery, queryParams);
    const totalTrends = parseInt(countResult.rows[0].count);

    // Get trends data
    const trendsQuery = `
      SELECT 
        mt.id, mt.commodity, mt.date, mt.opening_price, mt.closing_price,
        mt.high_price, mt.low_price, mt.volume, mt.trend_direction,
        mt.percentage_change, mt.created_at,
        CASE 
          WHEN mt.percentage_change > 5 THEN 'strong_up'
          WHEN mt.percentage_change > 2 THEN 'moderate_up'
          WHEN mt.percentage_change > -2 THEN 'stable'
          WHEN mt.percentage_change > -5 THEN 'moderate_down'
          ELSE 'strong_down'
        END as trend_strength
      FROM market_trends mt
      ${whereClause}
      ORDER BY mt.date DESC, mt.commodity ASC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    queryParams.push(limit, offset);
    const result = await db.query(trendsQuery, queryParams);

    res.json({
      success: true,
      data: {
        trends: result.rows,
        pagination: {
          page,
          limit,
          total: totalTrends,
          totalPages: Math.ceil(totalTrends / limit),
        },
      },
    });
  }),
);

// Get trend by ID
router.get(
  "/:id",
  authenticateToken,
  catchAsync(async (req, res) => {
    const { id } = req.params;

    const result = await db.query("SELECT * FROM market_trends WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      throw new AppError("Market trend not found", 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  }),
);

// Create new market trend data
router.post(
  "/",
  [
    authenticateToken,
    requireRole("admin", "manager"),
    body("commodity").notEmpty().isLength({ max: 100 }).trim(),
    body("date").isISO8601().toDate(),
    body("opening_price").isNumeric().isFloat({ min: 0 }),
    body("closing_price").isNumeric().isFloat({ min: 0 }),
    body("high_price").isNumeric().isFloat({ min: 0 }),
    body("low_price").isNumeric().isFloat({ min: 0 }),
    body("volume").optional().isNumeric().isFloat({ min: 0 }),
    body("trend_direction").isIn(["up", "down", "stable"]),
    body("percentage_change").isNumeric(),
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
      commodity,
      date,
      opening_price,
      closing_price,
      high_price,
      low_price,
      volume,
      trend_direction,
      percentage_change,
    } = req.body;

    // Validate price relationships
    if (high_price < Math.max(opening_price, closing_price)) {
      throw new AppError(
        "High price must be >= opening and closing prices",
        400,
      );
    }
    if (low_price > Math.min(opening_price, closing_price)) {
      throw new AppError(
        "Low price must be <= opening and closing prices",
        400,
      );
    }

    // Check if data already exists for this commodity and date
    const existingCheck = await db.query(
      "SELECT id FROM market_trends WHERE commodity = $1 AND date = $2",
      [commodity, date],
    );
    if (existingCheck.rows.length > 0) {
      throw new AppError(
        "Market data already exists for this commodity and date",
        400,
      );
    }

    const result = await db.query(
      `
      INSERT INTO market_trends (
        commodity, date, opening_price, closing_price, high_price,
        low_price, volume, trend_direction, percentage_change
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `,
      [
        commodity,
        date,
        opening_price,
        closing_price,
        high_price,
        low_price,
        volume,
        trend_direction,
        percentage_change,
      ],
    );

    res.status(201).json({
      success: true,
      message: "Market trend data created successfully",
      data: result.rows[0],
    });
  }),
);

// Get market analysis and insights
router.get(
  "/analysis/overview",
  authenticateToken,
  catchAsync(async (req, res) => {
    const timeframe = req.query.timeframe || "30d";
    let dateFilter = "";

    switch (timeframe) {
      case "7d":
        dateFilter = "AND mt.date >= NOW() - INTERVAL '7 days'";
        break;
      case "30d":
        dateFilter = "AND mt.date >= NOW() - INTERVAL '30 days'";
        break;
      case "90d":
        dateFilter = "AND mt.date >= NOW() - INTERVAL '90 days'";
        break;
      case "1y":
        dateFilter = "AND mt.date >= NOW() - INTERVAL '1 year'";
        break;
      default:
        dateFilter = "AND mt.date >= NOW() - INTERVAL '30 days'";
    }

    // Top performing commodities
    const topPerformersResult = await db.query(`
      SELECT 
        commodity,
        COUNT(*) as data_points,
        AVG(percentage_change) as avg_change,
        MAX(percentage_change) as max_change,
        MIN(percentage_change) as min_change,
        STDDEV(percentage_change) as volatility
      FROM market_trends mt
      WHERE 1=1 ${dateFilter}
      GROUP BY commodity
      HAVING COUNT(*) >= 5
      ORDER BY avg_change DESC
      LIMIT 10
    `);

    // Market volatility analysis
    const volatilityResult = await db.query(`
      SELECT 
        commodity,
        STDDEV(percentage_change) as volatility,
        COUNT(*) as data_points,
        AVG(ABS(percentage_change)) as avg_abs_change
      FROM market_trends mt
      WHERE 1=1 ${dateFilter}
      GROUP BY commodity
      HAVING COUNT(*) >= 5
      ORDER BY volatility DESC
      LIMIT 10
    `);

    // Recent trend directions
    const trendDirectionsResult = await db.query(`
      SELECT 
        trend_direction,
        COUNT(*) as count,
        AVG(percentage_change) as avg_change
      FROM market_trends mt
      WHERE 1=1 ${dateFilter}
      GROUP BY trend_direction
      ORDER BY count DESC
    `);

    // Price range analysis
    const priceRangeResult = await db.query(`
      SELECT 
        commodity,
        MIN(low_price) as min_price,
        MAX(high_price) as max_price,
        AVG(closing_price) as avg_price,
        (MAX(high_price) - MIN(low_price)) / AVG(closing_price) * 100 as price_range_percentage
      FROM market_trends mt
      WHERE 1=1 ${dateFilter}
      GROUP BY commodity
      HAVING COUNT(*) >= 5
      ORDER BY price_range_percentage DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        timeframe,
        top_performers: topPerformersResult.rows,
        volatility_analysis: volatilityResult.rows,
        trend_directions: trendDirectionsResult.rows,
        price_ranges: priceRangeResult.rows,
      },
    });
  }),
);

// Get commodity price history
router.get(
  "/commodity/:commodity/history",
  [authenticateToken, query("days").optional().isInt({ min: 1, max: 365 })],
  catchAsync(async (req, res) => {
    const { commodity } = req.params;
    const days = parseInt(req.query.days) || 30;

    const result = await db.query(
      `
      SELECT 
        date, opening_price, closing_price, high_price, low_price,
        volume, percentage_change, trend_direction
      FROM market_trends
      WHERE commodity = $1 AND date >= NOW() - INTERVAL '${days} days'
      ORDER BY date ASC
    `,
      [commodity],
    );

    // Calculate additional metrics
    const prices = result.rows.map((row) => row.closing_price);
    const avgPrice =
      prices.reduce((sum, price) => sum + parseFloat(price), 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    res.json({
      success: true,
      data: {
        commodity,
        period_days: days,
        price_history: result.rows,
        summary: {
          average_price: avgPrice,
          min_price: minPrice,
          max_price: maxPrice,
          price_range:
            (((maxPrice - minPrice) / avgPrice) * 100).toFixed(2) + "%",
          data_points: result.rows.length,
        },
      },
    });
  }),
);

// Get market predictions (ML integration placeholder)
router.get(
  "/predictions/:commodity",
  authenticateToken,
  catchAsync(async (req, res) => {
    const { commodity } = req.params;
    const horizon = parseInt(req.query.horizon) || 7; // days

    // Get latest ML predictions for this commodity
    const predictionsResult = await db.query(
      `
      SELECT 
        prediction_type,
        confidence_score,
        predicted_value,
        prediction_date,
        model_version
      FROM ml_predictions 
      WHERE commodity = $1 
      AND prediction_type IN ('price_forecast', 'volatility_forecast', 'trend_forecast')
      ORDER BY prediction_date DESC
      LIMIT 10
    `,
      [commodity],
    );

    // Get recent historical data for context
    const historicalResult = await db.query(
      `
      SELECT 
        date, closing_price, percentage_change, trend_direction
      FROM market_trends
      WHERE commodity = $1
      ORDER BY date DESC
      LIMIT 30
    `,
      [commodity],
    );

    res.json({
      success: true,
      data: {
        commodity,
        prediction_horizon_days: horizon,
        predictions: predictionsResult.rows,
        recent_history: historicalResult.rows,
      },
    });
  }),
);

// Update market trend data
router.put(
  "/:id",
  [
    authenticateToken,
    requireRole("admin", "manager"),
    body("opening_price").optional().isNumeric().isFloat({ min: 0 }),
    body("closing_price").optional().isNumeric().isFloat({ min: 0 }),
    body("high_price").optional().isNumeric().isFloat({ min: 0 }),
    body("low_price").optional().isNumeric().isFloat({ min: 0 }),
    body("volume").optional().isNumeric().isFloat({ min: 0 }),
    body("trend_direction").optional().isIn(["up", "down", "stable"]),
    body("percentage_change").optional().isNumeric(),
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
      opening_price,
      closing_price,
      high_price,
      low_price,
      volume,
      trend_direction,
      percentage_change,
    } = req.body;

    // Check if trend exists
    const trendCheck = await db.query(
      "SELECT id FROM market_trends WHERE id = $1",
      [id],
    );
    if (trendCheck.rows.length === 0) {
      throw new AppError("Market trend not found", 404);
    }

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (opening_price !== undefined) {
      updateFields.push(`opening_price = $${paramIndex++}`);
      values.push(opening_price);
    }
    if (closing_price !== undefined) {
      updateFields.push(`closing_price = $${paramIndex++}`);
      values.push(closing_price);
    }
    if (high_price !== undefined) {
      updateFields.push(`high_price = $${paramIndex++}`);
      values.push(high_price);
    }
    if (low_price !== undefined) {
      updateFields.push(`low_price = $${paramIndex++}`);
      values.push(low_price);
    }
    if (volume !== undefined) {
      updateFields.push(`volume = $${paramIndex++}`);
      values.push(volume);
    }
    if (trend_direction !== undefined) {
      updateFields.push(`trend_direction = $${paramIndex++}`);
      values.push(trend_direction);
    }
    if (percentage_change !== undefined) {
      updateFields.push(`percentage_change = $${paramIndex++}`);
      values.push(percentage_change);
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
      UPDATE market_trends 
      SET ${updateFields.join(", ")} 
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);

    res.json({
      success: true,
      message: "Market trend updated successfully",
      data: result.rows[0],
    });
  }),
);

// Delete market trend data
router.delete(
  "/:id",
  [authenticateToken, requireRole("admin")],
  catchAsync(async (req, res) => {
    const { id } = req.params;

    const result = await db.query(
      "DELETE FROM market_trends WHERE id = $1 RETURNING id",
      [id],
    );

    if (result.rows.length === 0) {
      throw new AppError("Market trend not found", 404);
    }

    res.json({
      success: true,
      message: "Market trend deleted successfully",
    });
  }),
);

module.exports = router;
