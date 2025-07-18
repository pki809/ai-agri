const jwt = require("jsonwebtoken");
const db = require("../database/db");

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication token required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userResult = await db.query(
      "SELECT id, email, role, full_name FROM users WHERE id = $1 AND is_active = true",
      [decoded.userId],
    );

    if (userResult.rows.length === 0) {
      return next(new Error("User not found or inactive"));
    }

    socket.user = userResult.rows[0];
    next();
  } catch (error) {
    next(new Error("Invalid authentication token"));
  }
};

// Main socket handler
const handleConnection = (io) => {
  // Apply authentication middleware
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    console.log(`User ${socket.user.full_name} connected:`, socket.id);

    // Join user to their personal room for notifications
    socket.join(`user_${socket.user.id}`);

    // Join user to role-based rooms
    socket.join(`role_${socket.user.role}`);

    // Send welcome message with user info
    socket.emit("connected", {
      userId: socket.user.id,
      userName: socket.user.full_name,
      role: socket.user.role,
      message: "Connected to AgriSupply Insights real-time service",
    });

    // Handle real-time alerts subscription
    socket.on("subscribe_alerts", () => {
      console.log(`User ${socket.user.id} subscribed to alerts`);
      socket.join("alerts_subscribers");
      socket.emit("alerts_subscribed", { status: "subscribed" });
    });

    socket.on("unsubscribe_alerts", () => {
      console.log(`User ${socket.user.id} unsubscribed from alerts`);
      socket.leave("alerts_subscribers");
      socket.emit("alerts_unsubscribed", { status: "unsubscribed" });
    });

    // Handle inventory monitoring subscription
    socket.on("subscribe_inventory", () => {
      console.log(`User ${socket.user.id} subscribed to inventory updates`);
      socket.join("inventory_subscribers");
      socket.emit("inventory_subscribed", { status: "subscribed" });
    });

    socket.on("unsubscribe_inventory", () => {
      socket.leave("inventory_subscribers");
      socket.emit("inventory_unsubscribed", { status: "unsubscribed" });
    });

    // Handle market trends subscription
    socket.on("subscribe_market_trends", () => {
      console.log(`User ${socket.user.id} subscribed to market trends`);
      socket.join("market_trends_subscribers");
      socket.emit("market_trends_subscribed", { status: "subscribed" });
    });

    socket.on("unsubscribe_market_trends", () => {
      socket.leave("market_trends_subscribers");
      socket.emit("market_trends_unsubscribed", { status: "unsubscribed" });
    });

    // Handle order status updates subscription
    socket.on("subscribe_orders", () => {
      console.log(`User ${socket.user.id} subscribed to order updates`);
      socket.join("orders_subscribers");
      socket.emit("orders_subscribed", { status: "subscribed" });
    });

    socket.on("unsubscribe_orders", () => {
      socket.leave("orders_subscribers");
      socket.emit("orders_unsubscribed", { status: "unsubscribed" });
    });

    // Handle ML predictions subscription
    socket.on("subscribe_ml_predictions", () => {
      if (["admin", "manager"].includes(socket.user.role)) {
        console.log(`User ${socket.user.id} subscribed to ML predictions`);
        socket.join("ml_predictions_subscribers");
        socket.emit("ml_predictions_subscribed", { status: "subscribed" });
      } else {
        socket.emit("permission_denied", {
          message: "Insufficient permissions for ML predictions",
        });
      }
    });

    socket.on("unsubscribe_ml_predictions", () => {
      socket.leave("ml_predictions_subscribers");
      socket.emit("ml_predictions_unsubscribed", { status: "unsubscribed" });
    });

    // Handle real-time chat/messaging (if needed)
    socket.on("join_support_room", () => {
      socket.join("support_room");
      socket.emit("support_room_joined", { status: "joined" });
    });

    socket.on("leave_support_room", () => {
      socket.leave("support_room");
      socket.emit("support_room_left", { status: "left" });
    });

    socket.on("support_message", (data) => {
      if (socket.rooms.has("support_room")) {
        const message = {
          id: Date.now(),
          userId: socket.user.id,
          userName: socket.user.full_name,
          message: data.message,
          timestamp: new Date().toISOString(),
        };
        io.to("support_room").emit("support_message", message);
      }
    });

    // Handle real-time dashboard requests
    socket.on("request_dashboard_update", async () => {
      try {
        // Get quick dashboard metrics
        const metricsResult = await db.query(
          `
          SELECT 
            (SELECT COUNT(*) FROM orders WHERE created_at >= NOW() - INTERVAL '24 hours') as orders_24h,
            (SELECT COUNT(*) FROM alerts WHERE is_read = false AND (user_id = $1 OR user_id IS NULL)) as unread_alerts,
            (SELECT COUNT(*) FROM supplies WHERE current_stock <= reorder_level) as low_stock_items,
            (SELECT SUM(total_amount) FROM orders WHERE created_at >= NOW() - INTERVAL '24 hours') as revenue_24h
        `,
          [socket.user.id],
        );

        socket.emit("dashboard_update", {
          timestamp: new Date().toISOString(),
          metrics: metricsResult.rows[0],
        });
      } catch (error) {
        socket.emit("error", { message: "Failed to fetch dashboard update" });
      }
    });

    // Handle stock level requests
    socket.on("request_stock_levels", async () => {
      try {
        const stockResult = await db.query(`
          SELECT 
            id, name, current_stock, reorder_level, unit,
            CASE 
              WHEN current_stock <= reorder_level THEN 'low'
              WHEN current_stock <= (reorder_level * 2) THEN 'medium'
              ELSE 'good'
            END as stock_status
          FROM supplies
          ORDER BY 
            CASE 
              WHEN current_stock <= reorder_level THEN 1
              WHEN current_stock <= (reorder_level * 2) THEN 2
              ELSE 3
            END,
            current_stock ASC
          LIMIT 20
        `);

        socket.emit("stock_levels_update", {
          timestamp: new Date().toISOString(),
          supplies: stockResult.rows,
        });
      } catch (error) {
        socket.emit("error", { message: "Failed to fetch stock levels" });
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User ${socket.user.full_name} disconnected:`, socket.id);
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  });
};

// Helper functions for emitting events from API routes
const emitToUser = (io, userId, event, data) => {
  io.to(`user_${userId}`).emit(event, data);
};

const emitToRole = (io, role, event, data) => {
  io.to(`role_${role}`).emit(event, data);
};

const emitToSubscribers = (io, channel, event, data) => {
  io.to(`${channel}_subscribers`).emit(event, data);
};

const emitGlobally = (io, event, data) => {
  io.emit(event, data);
};

// Broadcast new alert to relevant users
const broadcastAlert = (io, alert) => {
  if (alert.user_id) {
    // Send to specific user
    emitToUser(io, alert.user_id, "new_alert", alert);
  } else {
    // Broadcast to all subscribers
    emitToSubscribers(io, "alerts", "new_alert", alert);
  }
};

// Broadcast inventory update
const broadcastInventoryUpdate = (io, supply, previousStock) => {
  const updateData = {
    supply_id: supply.id,
    supply_name: supply.name,
    previous_stock: previousStock,
    current_stock: supply.current_stock,
    reorder_level: supply.reorder_level,
    stock_status:
      supply.current_stock <= supply.reorder_level
        ? "low"
        : supply.current_stock <= supply.reorder_level * 2
          ? "medium"
          : "good",
    timestamp: new Date().toISOString(),
  };

  emitToSubscribers(io, "inventory", "inventory_update", updateData);

  // If stock is low, also send alert
  if (supply.current_stock <= supply.reorder_level) {
    const alert = {
      title: `Low Stock: ${supply.name}`,
      message: `${supply.name} is now at ${supply.current_stock} ${supply.unit}`,
      severity: "medium",
      type: "stock_alert",
    };
    emitToSubscribers(io, "alerts", "stock_alert", alert);
  }
};

// Broadcast order status update
const broadcastOrderUpdate = (io, order, previousStatus) => {
  const updateData = {
    order_id: order.id,
    order_number: order.order_number,
    previous_status: previousStatus,
    current_status: order.status,
    customer_id: order.customer_id,
    timestamp: new Date().toISOString(),
  };

  emitToSubscribers(io, "orders", "order_status_update", updateData);
};

// Broadcast market trend update
const broadcastMarketTrend = (io, trend) => {
  const trendData = {
    commodity: trend.commodity,
    closing_price: trend.closing_price,
    percentage_change: trend.percentage_change,
    trend_direction: trend.trend_direction,
    timestamp: new Date().toISOString(),
  };

  emitToSubscribers(io, "market_trends", "market_trend_update", trendData);

  // If significant change, also send alert
  if (Math.abs(trend.percentage_change) >= 5) {
    const alert = {
      title: `Market Alert: ${trend.commodity}`,
      message: `${trend.commodity} ${trend.percentage_change > 0 ? "increased" : "decreased"} by ${Math.abs(trend.percentage_change).toFixed(2)}%`,
      severity: Math.abs(trend.percentage_change) >= 10 ? "high" : "medium",
      type: "market_alert",
    };
    emitToSubscribers(io, "alerts", "market_alert", alert);
  }
};

// Broadcast ML prediction
const broadcastMLPrediction = (io, prediction) => {
  const predictionData = {
    prediction_type: prediction.prediction_type,
    confidence_score: prediction.confidence_score,
    predicted_value: prediction.predicted_value,
    customer_id: prediction.customer_id,
    commodity: prediction.commodity,
    timestamp: new Date().toISOString(),
  };

  emitToSubscribers(io, "ml_predictions", "new_prediction", predictionData);
};

module.exports = {
  handleConnection,
  emitToUser,
  emitToRole,
  emitToSubscribers,
  emitGlobally,
  broadcastAlert,
  broadcastInventoryUpdate,
  broadcastOrderUpdate,
  broadcastMarketTrend,
  broadcastMLPrediction,
};
