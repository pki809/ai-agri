const jwt = require("jsonwebtoken");
const db = require("../database/db");

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: "Access denied",
        message: "No token provided",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists and is active
    const userResult = await db.query(
      "SELECT id, email, name, role, account_active FROM users WHERE id = $1",
      [decoded.userId],
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: "Authentication failed",
        message: "User not found",
      });
    }

    const user = userResult.rows[0];

    if (!user.account_active) {
      return res.status(401).json({
        error: "Account disabled",
        message: "Your account has been deactivated",
      });
    }

    // Add user info to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({
        error: "Invalid token",
        message: "Token is malformed or invalid",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(403).json({
        error: "Token expired",
        message: "Please log in again",
      });
    }

    console.error("Authentication error:", error);
    return res.status(500).json({
      error: "Authentication error",
      message: "Internal server error during authentication",
    });
  }
};

// Authorization middleware - check user roles
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        message: "You must be logged in to access this resource",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        message: `Access denied. Required roles: ${allowedRoles.join(", ")}`,
      });
    }

    next();
  };
};

// Check if user owns resource or is admin
const requireOwnershipOrAdmin = (resourceUserIdField = "user_id") => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
          message: "You must be logged in to access this resource",
        });
      }

      // Admins can access anything
      if (req.user.role === "admin") {
        return next();
      }

      // Extract resource ID from params
      const resourceId = req.params.id;
      if (!resourceId) {
        return res.status(400).json({
          error: "Bad request",
          message: "Resource ID is required",
        });
      }

      // For user resources, check if the user owns the resource
      if (resourceUserIdField === "user_id") {
        if (resourceId !== req.user.id) {
          return res.status(403).json({
            error: "Access denied",
            message: "You can only access your own resources",
          });
        }
      } else {
        // For other resources, check ownership in database
        const tableName = getTableNameFromRoute(req.route.path);
        const query = `SELECT ${resourceUserIdField} FROM ${tableName} WHERE id = $1`;
        const result = await db.query(query, [resourceId]);

        if (result.rows.length === 0) {
          return res.status(404).json({
            error: "Resource not found",
            message: "The requested resource does not exist",
          });
        }

        const resourceUserId = result.rows[0][resourceUserIdField];
        if (resourceUserId !== req.user.id) {
          return res.status(403).json({
            error: "Access denied",
            message: "You don't have permission to access this resource",
          });
        }
      }

      next();
    } catch (error) {
      console.error("Authorization error:", error);
      return res.status(500).json({
        error: "Authorization error",
        message: "Internal server error during authorization",
      });
    }
  };
};

// Helper function to determine table name from route
const getTableNameFromRoute = (routePath) => {
  const routeToTable = {
    "/customers": "customers",
    "/orders": "orders",
    "/alerts": "alerts",
    "/supplies": "supplies",
    "/notifications": "notifications",
  };

  for (const [route, table] of Object.entries(routeToTable)) {
    if (routePath.includes(route)) {
      return table;
    }
  }

  return null;
};

// Rate limiting for specific actions
const actionRateLimit = (
  action,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000,
) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = `${req.ip}_${action}`;
    const now = Date.now();
    const userAttempts = attempts.get(key) || {
      count: 0,
      resetTime: now + windowMs,
    };

    if (now > userAttempts.resetTime) {
      userAttempts.count = 0;
      userAttempts.resetTime = now + windowMs;
    }

    if (userAttempts.count >= maxAttempts) {
      return res.status(429).json({
        error: "Rate limit exceeded",
        message: `Too many ${action} attempts. Please try again later.`,
        retryAfter: Math.ceil((userAttempts.resetTime - now) / 1000),
      });
    }

    userAttempts.count++;
    attempts.set(key, userAttempts);

    // Cleanup old entries
    if (attempts.size > 10000) {
      const cutoff = now - windowMs;
      for (const [k, v] of attempts.entries()) {
        if (v.resetTime < cutoff) {
          attempts.delete(k);
        }
      }
    }

    next();
  };
};

// API key authentication (for external services and ML integration)
const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      return res.status(401).json({
        error: "API key required",
        message: "X-API-Key header is required",
      });
    }

    // Check API key in database
    const result = await db.query(
      `SELECT ak.*, u.id as user_id, u.name, u.role 
       FROM api_keys ak 
       JOIN users u ON ak.user_id = u.id 
       WHERE ak.api_key = $1 AND ak.active = true AND (ak.expires_at IS NULL OR ak.expires_at > NOW())`,
      [apiKey],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid API key",
        message: "API key is invalid or expired",
      });
    }

    const apiKeyData = result.rows[0];

    // Check rate limiting
    const currentHour = new Date().getHours();
    const usageResult = await db.query(
      `SELECT COUNT(*) as usage_count 
       FROM audit_logs 
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '1 hour'`,
      [apiKeyData.user_id],
    );

    const currentUsage = parseInt(usageResult.rows[0].usage_count);
    if (currentUsage >= apiKeyData.rate_limit) {
      return res.status(429).json({
        error: "Rate limit exceeded",
        message: `API key has exceeded rate limit of ${apiKeyData.rate_limit} requests per hour`,
      });
    }

    // Add user and API key info to request
    req.user = {
      id: apiKeyData.user_id,
      name: apiKeyData.name,
      role: apiKeyData.role,
      apiKey: apiKeyData.key_name,
      permissions: apiKeyData.permissions,
    };

    next();
  } catch (error) {
    console.error("API key authentication error:", error);
    return res.status(500).json({
      error: "Authentication error",
      message: "Internal server error during API key authentication",
    });
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireOwnershipOrAdmin,
  actionRateLimit,
  authenticateApiKey,
};
