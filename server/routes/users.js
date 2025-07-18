const express = require("express");
const bcryptjs = require("bcryptjs");
const { validationResult, body } = require("express-validator");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { catchAsync, AppError } = require("../middleware/errorHandler");
const db = require("../database/db");

const router = express.Router();

// Get current user profile
router.get(
  "/profile",
  authenticateToken,
  catchAsync(async (req, res) => {
    const result = await db.query(
      "SELECT id, email, full_name, role, phone, company, preferences, created_at, updated_at FROM users WHERE id = $1",
      [req.user.id],
    );

    if (result.rows.length === 0) {
      throw new AppError("User not found", 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  }),
);

// Update user profile
router.put(
  "/profile",
  [
    authenticateToken,
    body("full_name").optional().isLength({ min: 2, max: 100 }).trim(),
    body("phone")
      .optional()
      .matches(/^\+?[\d\s\-\(\)]+$/)
      .withMessage("Invalid phone number format"),
    body("company").optional().isLength({ max: 100 }).trim(),
    body("preferences").optional().isObject(),
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

    const { full_name, phone, company, preferences } = req.body;
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (full_name !== undefined) {
      updateFields.push(`full_name = $${paramIndex++}`);
      values.push(full_name);
    }
    if (phone !== undefined) {
      updateFields.push(`phone = $${paramIndex++}`);
      values.push(phone);
    }
    if (company !== undefined) {
      updateFields.push(`company = $${paramIndex++}`);
      values.push(company);
    }
    if (preferences !== undefined) {
      updateFields.push(`preferences = $${paramIndex++}`);
      values.push(JSON.stringify(preferences));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(req.user.id);

    const query = `
    UPDATE users 
    SET ${updateFields.join(", ")} 
    WHERE id = $${paramIndex}
    RETURNING id, email, full_name, role, phone, company, preferences, updated_at
  `;

    const result = await db.query(query, values);

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: result.rows[0],
    });
  }),
);

// Change password
router.put(
  "/password",
  [
    authenticateToken,
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters long"),
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

    const { currentPassword, newPassword } = req.body;

    // Get current password hash
    const userResult = await db.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [req.user.id],
    );
    if (userResult.rows.length === 0) {
      throw new AppError("User not found", 404);
    }

    // Verify current password
    const isCurrentPasswordValid = await bcryptjs.compare(
      currentPassword,
      userResult.rows[0].password_hash,
    );
    if (!isCurrentPasswordValid) {
      throw new AppError("Current password is incorrect", 400);
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcryptjs.hash(newPassword, saltRounds);

    // Update password
    await db.query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
      [newPasswordHash, req.user.id],
    );

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  }),
);

// Get notification preferences
router.get(
  "/notifications",
  authenticateToken,
  catchAsync(async (req, res) => {
    const result = await db.query(
      "SELECT email_alerts, sms_alerts, push_notifications, alert_frequency FROM users WHERE id = $1",
      [req.user.id],
    );

    if (result.rows.length === 0) {
      throw new AppError("User not found", 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  }),
);

// Update notification preferences
router.put(
  "/notifications",
  [
    authenticateToken,
    body("email_alerts").optional().isBoolean(),
    body("sms_alerts").optional().isBoolean(),
    body("push_notifications").optional().isBoolean(),
    body("alert_frequency")
      .optional()
      .isIn(["immediate", "hourly", "daily", "weekly"]),
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

    const { email_alerts, sms_alerts, push_notifications, alert_frequency } =
      req.body;
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (email_alerts !== undefined) {
      updateFields.push(`email_alerts = $${paramIndex++}`);
      values.push(email_alerts);
    }
    if (sms_alerts !== undefined) {
      updateFields.push(`sms_alerts = $${paramIndex++}`);
      values.push(sms_alerts);
    }
    if (push_notifications !== undefined) {
      updateFields.push(`push_notifications = $${paramIndex++}`);
      values.push(push_notifications);
    }
    if (alert_frequency !== undefined) {
      updateFields.push(`alert_frequency = $${paramIndex++}`);
      values.push(alert_frequency);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(req.user.id);

    const query = `
    UPDATE users 
    SET ${updateFields.join(", ")} 
    WHERE id = $${paramIndex}
    RETURNING email_alerts, sms_alerts, push_notifications, alert_frequency
  `;

    const result = await db.query(query, values);

    res.json({
      success: true,
      message: "Notification preferences updated successfully",
      data: result.rows[0],
    });
  }),
);

// Get all users (admin only)
router.get(
  "/",
  [authenticateToken, requireRole("admin")],
  catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const countResult = await db.query("SELECT COUNT(*) FROM users");
    const totalUsers = parseInt(countResult.rows[0].count);

    const result = await db.query(
      `
    SELECT id, email, full_name, role, phone, company, is_active, created_at, updated_at,
           last_login_at
    FROM users 
    ORDER BY created_at DESC 
    LIMIT $1 OFFSET $2
  `,
      [limit, offset],
    );

    res.json({
      success: true,
      data: {
        users: result.rows,
        pagination: {
          page,
          limit,
          total: totalUsers,
          totalPages: Math.ceil(totalUsers / limit),
        },
      },
    });
  }),
);

// Get user by ID (admin only)
router.get(
  "/:id",
  [authenticateToken, requireRole("admin")],
  catchAsync(async (req, res) => {
    const { id } = req.params;

    const result = await db.query(
      `
    SELECT id, email, full_name, role, phone, company, preferences,
           email_alerts, sms_alerts, push_notifications, alert_frequency,
           is_active, created_at, updated_at, last_login_at
    FROM users 
    WHERE id = $1
  `,
      [id],
    );

    if (result.rows.length === 0) {
      throw new AppError("User not found", 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  }),
);

// Update user (admin only)
router.put(
  "/:id",
  [
    authenticateToken,
    requireRole("admin"),
    body("email").optional().isEmail().normalizeEmail(),
    body("full_name").optional().isLength({ min: 2, max: 100 }).trim(),
    body("role").optional().isIn(["admin", "user", "manager"]),
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
    const { email, full_name, role, is_active } = req.body;

    // Check if user exists
    const userCheck = await db.query("SELECT id FROM users WHERE id = $1", [
      id,
    ]);
    if (userCheck.rows.length === 0) {
      throw new AppError("User not found", 404);
    }

    // Check if email is already taken by another user
    if (email) {
      const emailCheck = await db.query(
        "SELECT id FROM users WHERE email = $1 AND id != $2",
        [email, id],
      );
      if (emailCheck.rows.length > 0) {
        throw new AppError("Email already registered", 400);
      }
    }

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (email !== undefined) {
      updateFields.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (full_name !== undefined) {
      updateFields.push(`full_name = $${paramIndex++}`);
      values.push(full_name);
    }
    if (role !== undefined) {
      updateFields.push(`role = $${paramIndex++}`);
      values.push(role);
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
    UPDATE users 
    SET ${updateFields.join(", ")} 
    WHERE id = $${paramIndex}
    RETURNING id, email, full_name, role, is_active, updated_at
  `;

    const result = await db.query(query, values);

    res.json({
      success: true,
      message: "User updated successfully",
      data: result.rows[0],
    });
  }),
);

// Delete user (admin only) - soft delete
router.delete(
  "/:id",
  [authenticateToken, requireRole("admin")],
  catchAsync(async (req, res) => {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user.id.toString()) {
      throw new AppError("Cannot delete your own account", 400);
    }

    const result = await db.query(
      "UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id",
      [id],
    );

    if (result.rows.length === 0) {
      throw new AppError("User not found", 404);
    }

    res.json({
      success: true,
      message: "User deactivated successfully",
    });
  }),
);

module.exports = router;
