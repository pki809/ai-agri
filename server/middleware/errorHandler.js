const fs = require("fs");
const path = require("path");

// Custom error class for application-specific errors
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Log errors to file in production
const logError = (error, req) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    error: {
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode,
      code: error.code,
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      userId: req.user?.id,
    },
  };

  // Only log to file in production
  if (process.env.NODE_ENV === "production") {
    const logDir = path.join(__dirname, "../logs");
    const logFile = path.join(logDir, "error.log");

    // Ensure logs directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    fs.appendFileSync(logFile, JSON.stringify(logEntry) + "\n");
  }

  // Always log to console in development
  if (process.env.NODE_ENV === "development") {
    console.error("🚨 Error Details:", logEntry);
  }
};

// Handle specific database errors
const handleDatabaseError = (error) => {
  if (error.code === "23505") {
    // Unique constraint violation
    const match = error.detail?.match(/Key \((.+?)\)=\((.+?)\)/);
    const field = match ? match[1] : "field";
    const value = match ? match[2] : "value";
    return new AppError(
      `${field} '${value}' already exists. Please use a different ${field}.`,
      409,
      "DUPLICATE_ENTRY",
    );
  }

  if (error.code === "23503") {
    // Foreign key constraint violation
    return new AppError(
      "Referenced resource does not exist or has been deleted.",
      400,
      "INVALID_REFERENCE",
    );
  }

  if (error.code === "23502") {
    // Not null constraint violation
    const field = error.column;
    return new AppError(
      `${field} is required and cannot be empty.`,
      400,
      "MISSING_REQUIRED_FIELD",
    );
  }

  if (error.code === "22001") {
    // String data too long
    return new AppError(
      "Data provided is too long for the field.",
      400,
      "DATA_TOO_LONG",
    );
  }

  if (error.code === "08003" || error.code === "08006") {
    // Connection errors
    return new AppError(
      "Database connection error. Please try again later.",
      503,
      "DATABASE_CONNECTION_ERROR",
    );
  }

  // Generic database error
  return new AppError(
    "A database error occurred. Please try again later.",
    500,
    "DATABASE_ERROR",
  );
};

// Handle JWT errors
const handleJWTError = (error) => {
  if (error.name === "JsonWebTokenError") {
    return new AppError(
      "Invalid token. Please log in again.",
      401,
      "INVALID_TOKEN",
    );
  }

  if (error.name === "TokenExpiredError") {
    return new AppError(
      "Your session has expired. Please log in again.",
      401,
      "TOKEN_EXPIRED",
    );
  }

  if (error.name === "NotBeforeError") {
    return new AppError("Token not active yet.", 401, "TOKEN_NOT_ACTIVE");
  }

  return new AppError("Authentication error.", 401, "AUTH_ERROR");
};

// Handle validation errors
const handleValidationError = (error) => {
  if (error.array && typeof error.array === "function") {
    // Express-validator errors
    const errors = error.array();
    const message = errors.map((err) => `${err.param}: ${err.msg}`).join(", ");
    return new AppError(
      `Validation failed: ${message}`,
      400,
      "VALIDATION_ERROR",
    );
  }

  return new AppError("Validation error occurred.", 400, "VALIDATION_ERROR");
};

// Handle file upload errors
const handleMulterError = (error) => {
  if (error.code === "LIMIT_FILE_SIZE") {
    return new AppError(
      "File size too large. Maximum allowed size is 5MB.",
      400,
      "FILE_TOO_LARGE",
    );
  }

  if (error.code === "LIMIT_FILE_COUNT") {
    return new AppError("Too many files uploaded.", 400, "TOO_MANY_FILES");
  }

  if (error.code === "LIMIT_UNEXPECTED_FILE") {
    return new AppError("Unexpected file field.", 400, "UNEXPECTED_FILE");
  }

  return new AppError("File upload error.", 400, "UPLOAD_ERROR");
};

// Send error response in development
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
    code: err.code,
  });
};

// Send error response in production
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      code: err.code,
    });
  } else {
    // Programming or unknown error: don't leak error details
    console.error("ERROR 💥", err);

    res.status(500).json({
      status: "error",
      message: "Something went wrong!",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
};

// Main error handling middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // Log the error
  logError(err, req);

  let error = { ...err };
  error.message = err.message;

  // Handle specific error types
  if (err.code && err.code.startsWith("23")) {
    error = handleDatabaseError(err);
  } else if (err.name && err.name.includes("JWT")) {
    error = handleJWTError(err);
  } else if (
    err.name === "ValidationError" ||
    (err.array && typeof err.array === "function")
  ) {
    error = handleValidationError(err);
  } else if (err.code && err.code.startsWith("LIMIT_")) {
    error = handleMulterError(err);
  } else if (err.type === "entity.parse.failed") {
    error = new AppError("Invalid JSON in request body.", 400, "INVALID_JSON");
  } else if (err.type === "entity.too.large") {
    error = new AppError("Request entity too large.", 413, "PAYLOAD_TOO_LARGE");
  }

  // Send error response
  if (process.env.NODE_ENV === "development") {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

// Async error handler wrapper
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// 404 handler for unmatched routes
const notFound = (req, res, next) => {
  const err = new AppError(
    `Can't find ${req.originalUrl} on this server!`,
    404,
    "NOT_FOUND",
  );
  next(err);
};

// Unhandled promise rejection handler
process.on("unhandledRejection", (err, promise) => {
  console.log("🚨 UNHANDLED PROMISE REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

// Uncaught exception handler
process.on("uncaughtException", (err) => {
  console.log("🚨 UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

module.exports = {
  AppError,
  errorHandler,
  catchAsync,
  notFound,
};
