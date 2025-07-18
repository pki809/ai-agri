const fs = require("fs");
const path = require("path");
const db = require("../database/db");

async function runMigrations() {
  try {
    console.log("🚀 Starting database migration...");

    // Read the schema file
    const schemaPath = path.join(__dirname, "../database/schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    // Execute the schema
    await db.query(schema);

    console.log("✅ Database migration completed successfully!");
    console.log("📊 All tables, indexes, and triggers have been created.");

    // Test the connection and show table count
    const result = await db.query(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    console.log(`📋 Created ${result.rows[0].table_count} tables`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.error("📝 Error details:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n⚡ Migration interrupted by user");
  await db.close();
  process.exit(1);
});

process.on("SIGTERM", async () => {
  console.log("\n⚡ Migration terminated");
  await db.close();
  process.exit(1);
});

runMigrations();
