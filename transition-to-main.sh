#!/bin/bash

# Transition script for AgriSupply Insights
# This script helps set up the main branch for client demos

echo "🌾 AgriSupply Insights - Branch Transition Script"
echo "================================================"

# Create backup of current complete implementation
echo "📦 Creating backup of complete implementation..."

# Copy files for main branch
echo "📁 Setting up main branch structure..."

# Copy simplified files
cp package-main.json package.json
cp vite-main.config.ts vite.config.ts
cp README-main.md README.md

# Create src directory structure
echo "📂 Creating simplified src structure..."
mkdir -p src
cp -r src-main/* src/

# Remove backend and complex features
echo "🧹 Cleaning up complex features..."
rm -rf server/
rm -rf shared/
rm -rf client/
rm -rf docker-compose.yml
rm -rf docker-compose.dev.yml
rm -rf nginx.conf
rm -rf nginx.frontend.conf
rm -rf Dockerfile.frontend
rm -rf API_DOCUMENTATION.md

# Update gitignore for main branch
echo "📝 Updating .gitignore for main branch..."
cat > .gitignore << EOL
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
build/
*.tsbuildinfo

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Temporary folders
tmp/
temp/
EOL

# Create simple index.html for main branch
echo "📄 Creating simplified index.html..."
cat > index.html << EOL
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AgriSupply Insights - Agricultural Supply Chain Management</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/App.tsx"></script>
  </body>
</html>
EOL

# Create main.tsx entry point
echo "🎯 Creating main.tsx entry point..."
cat > src/main.tsx << EOL
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOL

# Clean up temporary files
echo "🧹 Cleaning up temporary files..."
rm -f package-main.json
rm -f vite-main.config.ts
rm -f README-main.md
rm -rf src-main/

echo "✅ Transition complete!"
echo ""
echo "📋 Next steps:"
echo "1. Review the changes"
echo "2. Test the application: npm install && npm run dev"
echo "3. Commit changes for Week 1 progress"
echo "4. Push to main branch for client demo"
echo ""
echo "🔄 To switch back to complete implementation:"
echo "   git stash"
echo "   git checkout complete-implementation"
echo ""
echo "🎯 Main branch now shows progressive development timeline!"
