const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

console.log("🚀 Setting up AgriSupply Insights Development Environment...");

// Check if .env exists
const envPath = path.join(__dirname, "..", ".env");
const envExamplePath = path.join(__dirname, "..", ".env.example");

if (!fs.existsSync(envPath)) {
  console.log("⚠️  .env file not found. Creating from .env.example...");
  fs.copyFileSync(envExamplePath, envPath);
  console.log(
    "📝 Please update .env file with your actual configuration values",
  );
  console.log("🔑 Make sure to set proper JWT_SECRET and database credentials");
}

// Create uploads directory
const uploadsPath = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsPath)) {
  console.log("📁 Creating uploads directory...");
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Install dependencies
console.log("📦 Installing dependencies...");
const npmInstall = spawn("npm", ["install"], {
  stdio: "inherit",
  shell: true,
  cwd: path.join(__dirname, ".."),
});

npmInstall.on("close", (code) => {
  if (code !== 0) {
    console.error("❌ Failed to install dependencies");
    process.exit(1);
  }

  console.log("✅ Development environment setup completed!");
  console.log("\n📋 Next steps:");
  console.log("1. Update .env file with your configuration");
  console.log("2. Ensure PostgreSQL is running");
  console.log("3. Run 'npm run migrate' to set up the database");
  console.log("4. Run 'npm run dev' to start the development server");
  console.log("\n🌟 Happy coding!");
});
