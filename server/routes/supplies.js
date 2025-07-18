const express = require("express");
const { validationResult, body, query } = require("express-validator");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { catchAsync, AppError } = require("../middleware/errorHandler");
const db = require("../database/db");

const router = express.Router();

// Get all supplies with filtering and pagination
router.get(
  "/",
  [
    authenticateToken,
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("category")
      .optional()
      .isIn([
        "seeds",
        "fertilizers",
        "pesticides",
        "equipment",
        "tools",
        "other",
      ]),
    query("low_stock").optional().isBoolean(),
    query("search").optional().isLength({ max: 100 }),
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
    const { category, low_stock, search } = req.query;

    let whereClause = "WHERE 1=1";
    const queryParams = [];
    let paramIndex = 1;

    if (category) {
      whereClause += ` AND s.category = $${paramIndex++}`;
      queryParams.push(category);
    }

    if (low_stock === "true") {
      whereClause += ` AND s.current_stock <= s.reorder_level`;
    }

    if (search) {
      whereClause += ` AND (s.name ILIKE $${paramIndex++} OR s.description ILIKE $${paramIndex - 1})`;
      queryParams.push(`%${search}%`);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM supplies s 
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, queryParams);
    const totalSupplies = parseInt(countResult.rows[0].count);

    // Get supplies data
    const suppliesQuery = `
      SELECT 
        s.id, s.name, s.description, s.category, s.sku, s.unit,
        s.current_stock, s.reorder_level, s.cost_per_unit,
        s.created_at, s.updated_at,
        sup.name as supplier_name,
        CASE 
          WHEN s.current_stock <= s.reorder_level THEN 'low'
          WHEN s.current_stock <= (s.reorder_level * 2) THEN 'medium'
          ELSE 'good'
        END as stock_status
      FROM supplies s
      LEFT JOIN suppliers sup ON s.supplier_id = sup.id
      ${whereClause}
      ORDER BY s.updated_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    queryParams.push(limit, offset);
    const result = await db.query(suppliesQuery, queryParams);

    res.json({
      success: true,
      data: {
        supplies: result.rows,
        pagination: {
          page,
          limit,
          total: totalSupplies,
          totalPages: Math.ceil(totalSupplies / limit),
        },
      },
    });
  }),
);

// Get supply by ID
router.get(
  "/:id",
  authenticateToken,
  catchAsync(async (req, res) => {
    const { id } = req.params;

    const result = await db.query(
      `
      SELECT 
        s.*, 
        sup.name as supplier_name, sup.contact_email, sup.contact_phone,
        CASE 
          WHEN s.current_stock <= s.reorder_level THEN 'low'
          WHEN s.current_stock <= (s.reorder_level * 2) THEN 'medium'
          ELSE 'good'
        END as stock_status
      FROM supplies s
      LEFT JOIN suppliers sup ON s.supplier_id = sup.id
      WHERE s.id = $1
    `,
      [id],
    );

    if (result.rows.length === 0) {
      throw new AppError("Supply not found", 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  }),
);

// Create new supply
router.post(
  "/",
  [
    authenticateToken,
    requireRole("admin", "manager"),
    body("name").notEmpty().isLength({ max: 100 }).trim(),
    body("description").optional().isLength({ max: 500 }).trim(),
    body("category").isIn([
      "seeds",
      "fertilizers",
      "pesticides",
      "equipment",
      "tools",
      "other",
    ]),
    body("sku").notEmpty().isLength({ max: 50 }).trim(),
    body("unit").notEmpty().isLength({ max: 20 }).trim(),
    body("current_stock").isNumeric().isFloat({ min: 0 }),
    body("reorder_level").isNumeric().isFloat({ min: 0 }),
    body("cost_per_unit").isNumeric().isFloat({ min: 0 }),
    body("supplier_id").optional().isUUID(),
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
      name,
      description,
      category,
      sku,
      unit,
      current_stock,
      reorder_level,
      cost_per_unit,
      supplier_id,
    } = req.body;

    // Check if SKU already exists
    const skuCheck = await db.query("SELECT id FROM supplies WHERE sku = $1", [
      sku,
    ]);
    if (skuCheck.rows.length > 0) {
      throw new AppError("SKU already exists", 400);
    }

    // Verify supplier exists if provided
    if (supplier_id) {
      const supplierCheck = await db.query(
        "SELECT id FROM suppliers WHERE id = $1",
        [supplier_id],
      );
      if (supplierCheck.rows.length === 0) {
        throw new AppError("Supplier not found", 400);
      }
    }

    const result = await db.query(
      `
      INSERT INTO supplies (
        name, description, category, sku, unit, current_stock, 
        reorder_level, cost_per_unit, supplier_id
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `,
      [
        name,
        description,
        category,
        sku,
        unit,
        current_stock,
        reorder_level,
        cost_per_unit,
        supplier_id,
      ],
    );

    res.status(201).json({
      success: true,
      message: "Supply created successfully",
      data: result.rows[0],
    });
  }),
);

// Update supply
router.put(
  "/:id",
  [
    authenticateToken,
    requireRole("admin", "manager"),
    body("name").optional().isLength({ max: 100 }).trim(),
    body("description").optional().isLength({ max: 500 }).trim(),
    body("category")
      .optional()
      .isIn([
        "seeds",
        "fertilizers",
        "pesticides",
        "equipment",
        "tools",
        "other",
      ]),
    body("unit").optional().isLength({ max: 20 }).trim(),
    body("current_stock").optional().isNumeric().isFloat({ min: 0 }),
    body("reorder_level").optional().isNumeric().isFloat({ min: 0 }),
    body("cost_per_unit").optional().isNumeric().isFloat({ min: 0 }),
    body("supplier_id").optional().isUUID(),
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
      description,
      category,
      unit,
      current_stock,
      reorder_level,
      cost_per_unit,
      supplier_id,
    } = req.body;

    // Check if supply exists
    const supplyCheck = await db.query(
      "SELECT id FROM supplies WHERE id = $1",
      [id],
    );
    if (supplyCheck.rows.length === 0) {
      throw new AppError("Supply not found", 404);
    }

    // Verify supplier exists if provided
    if (supplier_id) {
      const supplierCheck = await db.query(
        "SELECT id FROM suppliers WHERE id = $1",
        [supplier_id],
      );
      if (supplierCheck.rows.length === 0) {
        throw new AppError("Supplier not found", 400);
      }
    }

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (category !== undefined) {
      updateFields.push(`category = $${paramIndex++}`);
      values.push(category);
    }
    if (unit !== undefined) {
      updateFields.push(`unit = $${paramIndex++}`);
      values.push(unit);
    }
    if (current_stock !== undefined) {
      updateFields.push(`current_stock = $${paramIndex++}`);
      values.push(current_stock);
    }
    if (reorder_level !== undefined) {
      updateFields.push(`reorder_level = $${paramIndex++}`);
      values.push(reorder_level);
    }
    if (cost_per_unit !== undefined) {
      updateFields.push(`cost_per_unit = $${paramIndex++}`);
      values.push(cost_per_unit);
    }
    if (supplier_id !== undefined) {
      updateFields.push(`supplier_id = $${paramIndex++}`);
      values.push(supplier_id);
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
      UPDATE supplies 
      SET ${updateFields.join(", ")} 
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);

    res.json({
      success: true,
      message: "Supply updated successfully",
      data: result.rows[0],
    });
  }),
);

// Delete supply
router.delete(
  "/:id",
  [authenticateToken, requireRole("admin")],
  catchAsync(async (req, res) => {
    const { id } = req.params;

    // Check if supply exists and has any order items
    const supplyCheck = await db.query(
      `
      SELECT s.id, COUNT(oi.id) as order_count
      FROM supplies s
      LEFT JOIN order_items oi ON s.id = oi.supply_id
      WHERE s.id = $1
      GROUP BY s.id
    `,
      [id],
    );

    if (supplyCheck.rows.length === 0) {
      throw new AppError("Supply not found", 404);
    }

    if (parseInt(supplyCheck.rows[0].order_count) > 0) {
      throw new AppError(
        "Cannot delete supply with existing order history",
        400,
      );
    }

    await db.query("DELETE FROM supplies WHERE id = $1", [id]);

    res.json({
      success: true,
      message: "Supply deleted successfully",
    });
  }),
);

// Adjust stock levels
router.post(
  "/:id/adjust-stock",
  [
    authenticateToken,
    requireRole("admin", "manager"),
    body("adjustment").notEmpty().isNumeric(),
    body("reason").notEmpty().isLength({ max: 200 }).trim(),
    body("adjustment_type").isIn([
      "manual",
      "received",
      "sold",
      "damaged",
      "lost",
    ]),
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
    const { adjustment, reason, adjustment_type } = req.body;

    // Get current stock
    const supplyResult = await db.query(
      "SELECT current_stock FROM supplies WHERE id = $1",
      [id],
    );
    if (supplyResult.rows.length === 0) {
      throw new AppError("Supply not found", 404);
    }

    const currentStock = parseFloat(supplyResult.rows[0].current_stock);
    const adjustmentAmount = parseFloat(adjustment);
    const newStock = currentStock + adjustmentAmount;

    if (newStock < 0) {
      throw new AppError("Adjustment would result in negative stock", 400);
    }

    // Update stock and record transaction
    await db.query("BEGIN");

    try {
      // Update supply stock
      await db.query(
        "UPDATE supplies SET current_stock = $1, updated_at = NOW() WHERE id = $2",
        [newStock, id],
      );

      // Record inventory transaction
      await db.query(
        `
        INSERT INTO inventory_transactions (
          supply_id, transaction_type, quantity, reason, user_id
        ) VALUES ($1, $2, $3, $4, $5)
      `,
        [id, adjustment_type, adjustmentAmount, reason, req.user.id],
      );

      await db.query("COMMIT");

      res.json({
        success: true,
        message: "Stock adjusted successfully",
        data: {
          previous_stock: currentStock,
          adjustment: adjustmentAmount,
          new_stock: newStock,
        },
      });
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  }),
);

// Get stock history for a supply
router.get(
  "/:id/history",
  authenticateToken,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Verify supply exists
    const supplyCheck = await db.query(
      "SELECT id FROM supplies WHERE id = $1",
      [id],
    );
    if (supplyCheck.rows.length === 0) {
      throw new AppError("Supply not found", 404);
    }

    const result = await db.query(
      `
      SELECT 
        it.id, it.transaction_type, it.quantity, it.reason, it.created_at,
        u.full_name as user_name
      FROM inventory_transactions it
      LEFT JOIN users u ON it.user_id = u.id
      WHERE it.supply_id = $1
      ORDER BY it.created_at DESC
      LIMIT $2 OFFSET $3
    `,
      [id, limit, offset],
    );

    const countResult = await db.query(
      "SELECT COUNT(*) FROM inventory_transactions WHERE supply_id = $1",
      [id],
    );
    const totalTransactions = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        transactions: result.rows,
        pagination: {
          page,
          limit,
          total: totalTransactions,
          totalPages: Math.ceil(totalTransactions / limit),
        },
      },
    });
  }),
);

// Get low stock alerts
router.get(
  "/alerts/low-stock",
  authenticateToken,
  catchAsync(async (req, res) => {
    const result = await db.query(
      `
      SELECT 
        s.id, s.name, s.category, s.current_stock, s.reorder_level,
        s.unit, sup.name as supplier_name,
        ROUND(((s.reorder_level - s.current_stock) / s.reorder_level * 100)::numeric, 2) as urgency_percent
      FROM supplies s
      LEFT JOIN suppliers sup ON s.supplier_id = sup.id
      WHERE s.current_stock <= s.reorder_level
      ORDER BY urgency_percent DESC, s.current_stock ASC
    `,
    );

    res.json({
      success: true,
      data: result.rows,
    });
  }),
);

module.exports = router;
