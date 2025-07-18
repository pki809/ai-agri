const express = require("express");
const { validationResult, body, query } = require("express-validator");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { catchAsync, AppError } = require("../middleware/errorHandler");
const db = require("../database/db");

const router = express.Router();

// Get all orders with filtering and pagination
router.get(
  "/",
  [
    authenticateToken,
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("status")
      .optional()
      .isIn(["pending", "confirmed", "shipped", "delivered", "cancelled"]),
    query("customer_id").optional().isUUID(),
    query("start_date").optional().isISO8601(),
    query("end_date").optional().isISO8601(),
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
    const { status, customer_id, start_date, end_date } = req.query;

    let whereClause = "WHERE 1=1";
    const queryParams = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND o.status = $${paramIndex++}`;
      queryParams.push(status);
    }

    if (customer_id) {
      whereClause += ` AND o.customer_id = $${paramIndex++}`;
      queryParams.push(customer_id);
    }

    if (start_date) {
      whereClause += ` AND o.created_at >= $${paramIndex++}`;
      queryParams.push(start_date);
    }

    if (end_date) {
      whereClause += ` AND o.created_at <= $${paramIndex++}`;
      queryParams.push(end_date);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM orders o ${whereClause}`;
    const countResult = await db.query(countQuery, queryParams);
    const totalOrders = parseInt(countResult.rows[0].count);

    // Get orders data
    const ordersQuery = `
      SELECT 
        o.id, o.order_number, o.status, o.total_amount, o.created_at, o.updated_at,
        c.name as customer_name, c.email as customer_email,
        COUNT(oi.id) as item_count,
        CASE 
          WHEN o.status = 'pending' AND o.created_at < NOW() - INTERVAL '24 hours' THEN 'overdue'
          WHEN o.status = 'confirmed' AND o.created_at < NOW() - INTERVAL '7 days' THEN 'delayed'
          ELSE 'normal'
        END as urgency_status
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id, o.order_number, o.status, o.total_amount, o.created_at, o.updated_at,
               c.name, c.email
      ORDER BY o.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    queryParams.push(limit, offset);
    const result = await db.query(ordersQuery, queryParams);

    res.json({
      success: true,
      data: {
        orders: result.rows,
        pagination: {
          page,
          limit,
          total: totalOrders,
          totalPages: Math.ceil(totalOrders / limit),
        },
      },
    });
  }),
);

// Get order by ID with full details
router.get(
  "/:id",
  authenticateToken,
  catchAsync(async (req, res) => {
    const { id } = req.params;

    // Get order details
    const orderResult = await db.query(
      `
      SELECT 
        o.*, 
        c.name as customer_name, c.email as customer_email,
        c.phone as customer_phone, c.address as customer_address,
        c.customer_type, c.company_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = $1
    `,
      [id],
    );

    if (orderResult.rows.length === 0) {
      throw new AppError("Order not found", 404);
    }

    // Get order items
    const itemsResult = await db.query(
      `
      SELECT 
        oi.id, oi.quantity, oi.unit_price, oi.subtotal,
        s.name as supply_name, s.unit, s.sku, s.category
      FROM order_items oi
      JOIN supplies s ON oi.supply_id = s.id
      WHERE oi.order_id = $1
      ORDER BY oi.created_at
    `,
      [id],
    );

    res.json({
      success: true,
      data: {
        order: orderResult.rows[0],
        items: itemsResult.rows,
      },
    });
  }),
);

// Create new order
router.post(
  "/",
  [
    authenticateToken,
    requireRole("admin", "manager"),
    body("customer_id").isUUID(),
    body("items").isArray({ min: 1 }),
    body("items.*.supply_id").isUUID(),
    body("items.*.quantity").isNumeric().isFloat({ min: 0.01 }),
    body("shipping_address").optional().isLength({ max: 500 }).trim(),
    body("notes").optional().isLength({ max: 1000 }).trim(),
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

    const { customer_id, items, shipping_address, notes } = req.body;

    // Verify customer exists
    const customerCheck = await db.query(
      "SELECT id, name FROM customers WHERE id = $1 AND is_active = true",
      [customer_id],
    );
    if (customerCheck.rows.length === 0) {
      throw new AppError("Customer not found or inactive", 400);
    }

    // Verify all supplies exist and calculate totals
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const supplyResult = await db.query(
        "SELECT id, name, cost_per_unit, current_stock FROM supplies WHERE id = $1",
        [item.supply_id],
      );

      if (supplyResult.rows.length === 0) {
        throw new AppError(`Supply with ID ${item.supply_id} not found`, 400);
      }

      const supply = supplyResult.rows[0];

      if (supply.current_stock < item.quantity) {
        throw new AppError(
          `Insufficient stock for ${supply.name}. Available: ${supply.current_stock}`,
          400,
        );
      }

      const unitPrice = parseFloat(supply.cost_per_unit);
      const quantity = parseFloat(item.quantity);
      const subtotal = unitPrice * quantity;

      orderItems.push({
        supply_id: item.supply_id,
        quantity,
        unit_price: unitPrice,
        subtotal,
      });

      totalAmount += subtotal;
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 4)
      .toUpperCase()}`;

    // Create order and items in transaction
    await db.query("BEGIN");

    try {
      // Create order
      const orderResult = await db.query(
        `
        INSERT INTO orders (
          order_number, customer_id, total_amount, shipping_address, notes, status
        ) 
        VALUES ($1, $2, $3, $4, $5, 'pending')
        RETURNING *
      `,
        [orderNumber, customer_id, totalAmount, shipping_address, notes],
      );

      const order = orderResult.rows[0];

      // Create order items and update stock
      for (const item of orderItems) {
        await db.query(
          `
          INSERT INTO order_items (
            order_id, supply_id, quantity, unit_price, subtotal
          ) VALUES ($1, $2, $3, $4, $5)
        `,
          [
            order.id,
            item.supply_id,
            item.quantity,
            item.unit_price,
            item.subtotal,
          ],
        );

        // Update supply stock
        await db.query(
          "UPDATE supplies SET current_stock = current_stock - $1, updated_at = NOW() WHERE id = $2",
          [item.quantity, item.supply_id],
        );

        // Record inventory transaction
        await db.query(
          `
          INSERT INTO inventory_transactions (
            supply_id, transaction_type, quantity, reason, user_id
          ) VALUES ($1, 'sold', $2, $3, $4)
        `,
          [item.supply_id, -item.quantity, `Order ${orderNumber}`, req.user.id],
        );
      }

      await db.query("COMMIT");

      res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: order,
      });
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  }),
);

// Update order status
router.put(
  "/:id/status",
  [
    authenticateToken,
    requireRole("admin", "manager"),
    body("status").isIn([
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ]),
    body("notes").optional().isLength({ max: 500 }).trim(),
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
    const { status, notes } = req.body;

    // Get current order
    const orderCheck = await db.query(
      "SELECT id, status, customer_id FROM orders WHERE id = $1",
      [id],
    );
    if (orderCheck.rows.length === 0) {
      throw new AppError("Order not found", 404);
    }

    const currentStatus = orderCheck.rows[0].status;

    // Validate status transition
    const validTransitions = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: [],
      cancelled: [],
    };

    if (!validTransitions[currentStatus].includes(status)) {
      throw new AppError(
        `Cannot change status from ${currentStatus} to ${status}`,
        400,
      );
    }

    // If cancelling, restore inventory
    if (status === "cancelled" && currentStatus !== "cancelled") {
      await db.query("BEGIN");

      try {
        // Restore stock for cancelled order
        const itemsResult = await db.query(
          "SELECT supply_id, quantity FROM order_items WHERE order_id = $1",
          [id],
        );

        for (const item of itemsResult.rows) {
          await db.query(
            "UPDATE supplies SET current_stock = current_stock + $1, updated_at = NOW() WHERE id = $2",
            [item.quantity, item.supply_id],
          );

          // Record inventory transaction
          await db.query(
            `
            INSERT INTO inventory_transactions (
              supply_id, transaction_type, quantity, reason, user_id
            ) VALUES ($1, 'manual', $2, $3, $4)
          `,
            [
              item.supply_id,
              item.quantity,
              `Order cancellation - restocked`,
              req.user.id,
            ],
          );
        }

        // Update order status
        const updateResult = await db.query(
          `
          UPDATE orders 
          SET status = $1, notes = COALESCE($2, notes), updated_at = NOW()
          WHERE id = $3
          RETURNING *
        `,
          [status, notes, id],
        );

        await db.query("COMMIT");

        res.json({
          success: true,
          message: "Order status updated successfully",
          data: updateResult.rows[0],
        });
      } catch (error) {
        await db.query("ROLLBACK");
        throw error;
      }
    } else {
      // Normal status update
      const result = await db.query(
        `
        UPDATE orders 
        SET status = $1, notes = COALESCE($2, notes), updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `,
        [status, notes, id],
      );

      res.json({
        success: true,
        message: "Order status updated successfully",
        data: result.rows[0],
      });
    }
  }),
);

// Get order statistics
router.get(
  "/stats/overview",
  authenticateToken,
  catchAsync(async (req, res) => {
    const timeframe = req.query.timeframe || "30d";
    let dateFilter = "";

    switch (timeframe) {
      case "7d":
        dateFilter = "AND o.created_at >= NOW() - INTERVAL '7 days'";
        break;
      case "30d":
        dateFilter = "AND o.created_at >= NOW() - INTERVAL '30 days'";
        break;
      case "90d":
        dateFilter = "AND o.created_at >= NOW() - INTERVAL '90 days'";
        break;
      case "1y":
        dateFilter = "AND o.created_at >= NOW() - INTERVAL '1 year'";
        break;
      default:
        dateFilter = "AND o.created_at >= NOW() - INTERVAL '30 days'";
    }

    // Overall statistics
    const overallResult = await db.query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as avg_order_value,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
      FROM orders o
      WHERE 1=1 ${dateFilter}
    `);

    // Orders by status
    const statusResult = await db.query(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(total_amount) as revenue
      FROM orders o
      WHERE 1=1 ${dateFilter}
      GROUP BY status
      ORDER BY count DESC
    `);

    // Top customers
    const customersResult = await db.query(`
      SELECT 
        c.id, c.name,
        COUNT(o.id) as order_count,
        SUM(o.total_amount) as total_spent
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE 1=1 ${dateFilter}
      GROUP BY c.id, c.name
      ORDER BY total_spent DESC
      LIMIT 10
    `);

    // Daily order trends
    const trendsResult = await db.query(`
      SELECT 
        DATE(o.created_at) as date,
        COUNT(*) as order_count,
        SUM(o.total_amount) as daily_revenue
      FROM orders o
      WHERE 1=1 ${dateFilter}
      GROUP BY DATE(o.created_at)
      ORDER BY date ASC
    `);

    res.json({
      success: true,
      data: {
        timeframe,
        overview: overallResult.rows[0],
        by_status: statusResult.rows,
        top_customers: customersResult.rows,
        daily_trends: trendsResult.rows,
      },
    });
  }),
);

// Delete order (admin only, if no items shipped)
router.delete(
  "/:id",
  [authenticateToken, requireRole("admin")],
  catchAsync(async (req, res) => {
    const { id } = req.params;

    // Check order status
    const orderCheck = await db.query(
      "SELECT id, status FROM orders WHERE id = $1",
      [id],
    );
    if (orderCheck.rows.length === 0) {
      throw new AppError("Order not found", 404);
    }

    if (["shipped", "delivered"].includes(orderCheck.rows[0].status)) {
      throw new AppError("Cannot delete shipped or delivered orders", 400);
    }

    await db.query("BEGIN");

    try {
      // Restore stock if order was confirmed
      if (orderCheck.rows[0].status === "confirmed") {
        const itemsResult = await db.query(
          "SELECT supply_id, quantity FROM order_items WHERE order_id = $1",
          [id],
        );

        for (const item of itemsResult.rows) {
          await db.query(
            "UPDATE supplies SET current_stock = current_stock + $1, updated_at = NOW() WHERE id = $2",
            [item.quantity, item.supply_id],
          );
        }
      }

      // Delete order items first
      await db.query("DELETE FROM order_items WHERE order_id = $1", [id]);

      // Delete order
      await db.query("DELETE FROM orders WHERE id = $1", [id]);

      await db.query("COMMIT");

      res.json({
        success: true,
        message: "Order deleted successfully",
      });
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  }),
);

module.exports = router;
