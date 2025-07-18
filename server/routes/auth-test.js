const express = require("express");
const router = express.Router();

// Demo user data
const demoUser = {
  id: "demo-user-123",
  email: "demo@agrisupply.com",
  name: "Demo User",
  role: "farmer",
  farmName: "Demo Farm",
};

// Simple test endpoint
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Auth route is working!",
    timestamp: new Date().toISOString(),
  });
});

// Demo signin endpoint
router.post("/signin", (req, res) => {
  const { email, password } = req.body;

  // Accept any email/password for demo
  if (email && password) {
    res.json({
      success: true,
      message: "Login successful",
      user: demoUser,
      tokens: {
        accessToken: "demo-access-token-123",
        refreshToken: "demo-refresh-token-123",
      },
    });
  } else {
    res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }
});

// Demo signup endpoint
router.post("/signup", (req, res) => {
  const { email, password, name } = req.body;

  if (email && password && name) {
    res.json({
      success: true,
      message: "Signup successful",
      user: {
        ...demoUser,
        email: email,
        name: name,
      },
      tokens: {
        accessToken: "demo-access-token-123",
        refreshToken: "demo-refresh-token-123",
      },
    });
  } else {
    res.status(400).json({
      success: false,
      message: "Email, password, and name are required",
    });
  }
});

// Demo verify endpoint
router.get("/verify", (req, res) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    res.json({
      authenticated: true,
      user: demoUser,
    });
  } else {
    res.status(401).json({
      authenticated: false,
      message: "Invalid or missing token",
    });
  }
});

// Demo logout endpoint
router.post("/logout", (req, res) => {
  res.json({
    success: true,
    message: "Logout successful",
  });
});

module.exports = router;
