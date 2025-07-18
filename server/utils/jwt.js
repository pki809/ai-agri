const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const db = require("../database/db");

// Generate JWT access token
const generateAccessToken = (userId, email, role) => {
  const payload = {
    userId,
    email,
    role,
    type: "access",
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
    issuer: "agrisupply-insights",
    audience: "agrisupply-users",
  });
};

// Generate JWT refresh token
const generateRefreshToken = (userId) => {
  const payload = {
    userId,
    type: "refresh",
    tokenId: uuidv4(),
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "30d",
    issuer: "agrisupply-insights",
    audience: "agrisupply-users",
  });
};

// Generate both access and refresh tokens
const generateTokenPair = async (userId, email, role) => {
  const accessToken = generateAccessToken(userId, email, role);
  const refreshToken = generateRefreshToken(userId);

  // Store refresh token in database
  const expiresAt = new Date();
  expiresAt.setTime(
    expiresAt.getTime() +
      (parseInt(process.env.JWT_REFRESH_EXPIRE?.replace("d", "")) || 30) *
        24 *
        60 *
        60 *
        1000,
  );

  await db.query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at) 
     VALUES ($1, $2, $3)`,
    [userId, refreshToken, expiresAt],
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: process.env.JWT_EXPIRE || "7d",
  };
};

// Verify refresh token and generate new access token
const refreshAccessToken = async (refreshToken) => {
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    if (decoded.type !== "refresh") {
      throw new Error("Invalid token type");
    }

    // Check if refresh token exists in database and is valid
    const tokenResult = await db.query(
      `SELECT rt.*, u.email, u.role 
       FROM refresh_tokens rt 
       JOIN users u ON rt.user_id = u.id 
       WHERE rt.token = $1 AND rt.expires_at > NOW()`,
      [refreshToken],
    );

    if (tokenResult.rows.length === 0) {
      throw new Error("Refresh token not found or expired");
    }

    const tokenData = tokenResult.rows[0];

    // Generate new access token
    const newAccessToken = generateAccessToken(
      tokenData.user_id,
      tokenData.email,
      tokenData.role,
    );

    return {
      accessToken: newAccessToken,
      expiresIn: process.env.JWT_EXPIRE || "7d",
    };
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
};

// Revoke refresh token (logout)
const revokeRefreshToken = async (refreshToken) => {
  try {
    await db.query("DELETE FROM refresh_tokens WHERE token = $1", [
      refreshToken,
    ]);
    return true;
  } catch (error) {
    console.error("Error revoking refresh token:", error);
    return false;
  }
};

// Revoke all refresh tokens for a user (logout from all devices)
const revokeAllRefreshTokens = async (userId) => {
  try {
    const result = await db.query(
      "DELETE FROM refresh_tokens WHERE user_id = $1",
      [userId],
    );
    return result.rowCount;
  } catch (error) {
    console.error("Error revoking all refresh tokens:", error);
    return 0;
  }
};

// Clean up expired refresh tokens (should be run periodically)
const cleanupExpiredTokens = async () => {
  try {
    const result = await db.query(
      "DELETE FROM refresh_tokens WHERE expires_at < NOW()",
    );
    console.log(`🧹 Cleaned up ${result.rowCount} expired refresh tokens`);
    return result.rowCount;
  } catch (error) {
    console.error("Error cleaning up expired tokens:", error);
    return 0;
  }
};

// Extract token from Authorization header
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
};

// Validate token format
const isValidTokenFormat = (token) => {
  if (!token || typeof token !== "string") return false;

  // JWT tokens have 3 parts separated by dots
  const parts = token.split(".");
  return parts.length === 3;
};

// Decode token without verification (for debugging)
const decodeToken = (token) => {
  try {
    return jwt.decode(token, { complete: true });
  } catch (error) {
    return null;
  }
};

// Get token expiry time
const getTokenExpiry = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (decoded && decoded.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch (error) {
    return null;
  }
};

// Check if token is expired
const isTokenExpired = (token) => {
  const expiry = getTokenExpiry(token);
  if (!expiry) return true;
  return expiry < new Date();
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  refreshAccessToken,
  revokeRefreshToken,
  revokeAllRefreshTokens,
  cleanupExpiredTokens,
  extractTokenFromHeader,
  isValidTokenFormat,
  decodeToken,
  getTokenExpiry,
  isTokenExpired,
};
