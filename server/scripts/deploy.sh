#!/bin/bash

# AgriSupply Insights Backend Deployment Script
set -e

echo "🚀 Starting AgriSupply Insights Backend Deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "📝 Please update .env file with your actual configuration values"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Database setup
echo "🗄️  Setting up database..."
node scripts/migrate.js

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p uploads

# Run tests (if available)
if [ -f "package.json" ] && npm run test --dry-run > /dev/null 2>&1; then
    echo "🧪 Running tests..."
    npm test
fi

# Build (if needed)
if [ -f "package.json" ] && npm run build --dry-run > /dev/null 2>&1; then
    echo "🔨 Building application..."
    npm run build
fi

echo "✅ Backend deployment completed successfully!"
echo "🌟 Server can be started with: npm start"
echo "📊 Health check available at: http://localhost:$PORT/api/health"
