const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Import test routes
const authRoutes = require("./routes/auth-test");
const placeholderRoutes = require("./routes/placeholder");
const dashboardRoutes = require("./routes/dashboard-demo");
const alertsRoutes = require("./routes/alerts-demo");

const app = express();

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: "1.0.0",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/placeholder", placeholderRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/alerts", alertsRoutes);

// Root route handler
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AgriSupply Insights API Server",
    version: "1.0.0",
    endpoints: [
      "GET /api/health - Health check",
      "POST /api/auth/signin - User login", 
      "POST /api/auth/signup - User registration",
      "GET /api/dashboard/overview - Dashboard data",
      "GET /api/alerts/stats/overview - Alerts overview"
    ]
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Initialize server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌟 Environment: ${process.env.NODE_ENV}`);
  console.log(`⚠️  Running in minimal test mode without database`);
  console.log(`🔧 Available endpoints:`);
  console.log(`   - GET  /api/health`);
  console.log(`   - POST /api/auth/signin`);
  console.log(`   - POST /api/auth/signup`);
  console.log(`   - GET  /api/auth/verify`);
  console.log(`   - POST /api/auth/logout`);
  console.log(`   - GET  /api/dashboard/overview`);
  console.log(`   - GET  /api/alerts/stats/overview`);
});

module.exports = app;
