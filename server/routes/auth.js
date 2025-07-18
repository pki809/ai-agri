const express = require("express");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const db = require("../database/db");
const {
  generateTokenPair,
  refreshAccessToken,
  revokeRefreshToken,
} = require("../utils/jwt");
const { AppError, catchAsync } = require("../middleware/errorHandler");
const { actionRateLimit } = require("../middleware/auth");

const router = express.Router();

// Validation rules
const signUpValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),
  body("name")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters long"),
  body("phone")
    .optional()
    .isMobilePhone()
    .withMessage("Please provide a valid phone number"),
  body("farmName")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("Farm name must be at least 2 characters long"),
  body("farmSize")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Farm size must be a positive number"),
  body("primaryCrops")
    .optional()
    .isArray()
    .withMessage("Primary crops must be an array"),
];

const signInValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Sign up endpoint
router.post(
  "/signup",
  actionRateLimit("signup", 5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  signUpValidation,
  catchAsync(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Please check your input data",
        details: errors.array(),
      });
    }

    const {
      email,
      password,
      name,
      phone,
      farmName,
      farmSize,
      primaryCrops,
      role = "farmer",
    } = req.body;

    // Check if user already exists
    const existingUser = await db.query(
      "SELECT id FROM users WHERE email = $1",
      [email],
    );

    if (existingUser.rows.length > 0) {
      throw new AppError(
        "User with this email already exists",
        409,
        "USER_EXISTS",
      );
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Start transaction
    const client = await db.getClient();
    try {
      await client.query("BEGIN");

      // Create user
      const userResult = await client.query(
        `INSERT INTO users (
          email, password_hash, name, phone, role, farm_name, 
          farm_size, primary_crops, email_verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING id, email, name, role, farm_name`,
        [
          email,
          passwordHash,
          name,
          phone || null,
          role,
          farmName || null,
          farmSize || null,
          primaryCrops || null,
          false, // Email verification required
        ],
      );

      const user = userResult.rows[0];

      // Create customer record if user is a farmer
      if (role === "farmer") {
        await client.query(
          `INSERT INTO customers (user_id, customer_type, business_name) 
           VALUES ($1, $2, $3)`,
          [user.id, "individual", farmName || null],
        );
      }

      await client.query("COMMIT");

      // Generate tokens
      const tokens = await generateTokenPair(user.id, user.email, user.role);

      // Log successful registration
      await db.query(
        `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, user_agent) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user.id, "register", "users", user.id, req.ip, req.get("User-Agent")],
      );

      res.status(201).json({
        message: "Account created successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          farmName: user.farm_name,
        },
        tokens,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }),
);

// Sign in endpoint
router.post(
  "/signin",
  actionRateLimit("signin", 5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  signInValidation,
  catchAsync(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Please check your input data",
        details: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Find user
    const userResult = await db.query(
      `SELECT id, email, password_hash, name, role, account_active, 
              farm_name, farm_size, primary_crops 
       FROM users WHERE email = $1`,
      [email],
    );

    if (userResult.rows.length === 0) {
      throw new AppError(
        "Invalid email or password",
        401,
        "INVALID_CREDENTIALS",
      );
    }

    const user = userResult.rows[0];

    // Check if account is active
    if (!user.account_active) {
      throw new AppError(
        "Account has been deactivated. Please contact support.",
        401,
        "ACCOUNT_DEACTIVATED",
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError(
        "Invalid email or password",
        401,
        "INVALID_CREDENTIALS",
      );
    }

    // Generate tokens
    const tokens = await generateTokenPair(user.id, user.email, user.role);

    // Update last login
    await db.query("UPDATE users SET last_login = NOW() WHERE id = $1", [
      user.id,
    ]);

    // Log successful login
    await db.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, user_agent) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, "login", "users", user.id, req.ip, req.get("User-Agent")],
    );

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        farmName: user.farm_name,
        farmSize: user.farm_size,
        primaryCrops: user.primary_crops,
      },
      tokens,
    });
  }),
);

// Refresh token endpoint
router.post(
  "/refresh",
  catchAsync(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError(
        "Refresh token is required",
        400,
        "MISSING_REFRESH_TOKEN",
      );
    }

    try {
      const tokens = await refreshAccessToken(refreshToken);

      res.json({
        message: "Token refreshed successfully",
        ...tokens,
      });
    } catch (error) {
      throw new AppError(
        "Invalid or expired refresh token",
        401,
        "INVALID_REFRESH_TOKEN",
      );
    }
  }),
);

// Logout endpoint
router.post(
  "/logout",
  catchAsync(async (req, res) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    res.json({
      message: "Logged out successfully",
    });
  }),
);

// Logout from all devices
router.post(
  "/logout-all",
  catchAsync(async (req, res) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      throw new AppError(
        "Access token is required",
        401,
        "MISSING_ACCESS_TOKEN",
      );
    }

    // Decode token to get user ID (without verification since we're logging out)
    const jwt = require("jsonwebtoken");
    const decoded = jwt.decode(token);

    if (!decoded || !decoded.userId) {
      throw new AppError("Invalid token", 401, "INVALID_TOKEN");
    }

    // Revoke all refresh tokens for this user
    const { revokeAllRefreshTokens } = require("../utils/jwt");
    const revokedCount = await revokeAllRefreshTokens(decoded.userId);

    res.json({
      message: "Logged out from all devices successfully",
      revokedTokens: revokedCount,
    });
  }),
);

// Password reset request
router.post(
  "/forgot-password",
  actionRateLimit("forgot-password", 3, 15 * 60 * 1000), // 3 attempts per 15 minutes
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { email } = req.body;

    const userResult = await db.query(
      "SELECT id, name FROM users WHERE email = $1 AND account_active = true",
      [email],
    );

    // Always return success to prevent email enumeration
    res.json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });

    // Only proceed if user exists
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];

      // Generate reset token (in a real app, you'd send an email here)
      const resetToken = require("crypto").randomBytes(32).toString("hex");
      const resetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store reset token (you'd need to add these columns to your users table)
      await db.query(
        `UPDATE users SET 
         password_reset_token = $1, 
         password_reset_expires = $2 
         WHERE id = $3`,
        [resetToken, resetExpires, user.id],
      );

      // TODO: Send email with reset link
      console.log(`Password reset token for ${email}: ${resetToken}`);
    }
  }),
);

// Verify account status
router.get(
  "/verify",
  catchAsync(async (req, res) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        authenticated: false,
        message: "No token provided",
      });
    }

    try {
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const userResult = await db.query(
        "SELECT id, email, name, role, account_active FROM users WHERE id = $1",
        [decoded.userId],
      );

      if (userResult.rows.length === 0 || !userResult.rows[0].account_active) {
        return res.status(401).json({
          authenticated: false,
          message: "Invalid or inactive user",
        });
      }

      const user = userResult.rows[0];

      res.json({
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      res.status(401).json({
        authenticated: false,
        message: "Invalid or expired token",
      });
    }
  }),
);

module.exports = router;
