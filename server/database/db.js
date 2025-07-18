const { Pool } = require("pg");

// Create PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "agrisupply_insights",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    await client.query("SELECT NOW()");
    client.release();
    console.log("✅ Database connection successful");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    throw error;
  }
};

// Execute query with error handling
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    if (process.env.NODE_ENV === "development") {
      console.log("Query executed:", {
        text: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
    }

    return result;
  } catch (error) {
    console.error("Database query error:", {
      text: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
      error: error.message,
    });
    throw error;
  }
};

// Get a client from the pool (for transactions)
const getClient = async () => {
  try {
    const client = await pool.connect();
    return client;
  } catch (error) {
    console.error("Error getting database client:", error);
    throw error;
  }
};

// Close all connections
const close = async () => {
  try {
    await pool.end();
    console.log("✅ Database pool closed");
  } catch (error) {
    console.error("❌ Error closing database pool:", error);
    throw error;
  }
};

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
  close,
};
