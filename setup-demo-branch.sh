#!/bin/bash

# AgriSupply Insights - Demo Branch Setup Script
# This script creates a clean client-demo branch with only Dashboard and Supply Details

echo "🚀 Setting up AgriSupply Insights Client Demo Branch..."

# Create and switch to demo branch
echo "📝 Creating client-demo branch..."
git checkout -b client-demo

# Copy demo files over main files
echo "📄 Setting up demo files..."
cp client/App-demo.tsx client/App.tsx
cp client/pages/Dashboard-demo.tsx client/pages/Dashboard.tsx
cp client/pages/SupplyDetails-demo.tsx client/pages/SupplyDetails.tsx

# Remove authentication and unnecessary files
echo "🧹 Cleaning up unnecessary files..."

# Remove auth-related files
rm -f client/contexts/AuthContext.tsx
rm -f client/components/ProtectedRoute.tsx
rm -f client/pages/SignIn.tsx
rm -f client/pages/SignUp.tsx
rm -f client/hooks/useApi.ts

# Remove other pages not used in demo
rm -f client/pages/MarketTrends.tsx
rm -f client/pages/RealTimeAlerts.tsx
rm -f client/pages/Account.tsx
rm -f client/pages/CustomerPatterns.tsx

# Remove demo config files (not needed in demo branch)
rm -f client/config/demo.ts
rm -f client/components/DemoNavigation.tsx

# Remove demo setup files
rm -f client/App-demo.tsx
rm -f client/pages/Dashboard-demo.tsx
rm -f client/pages/SupplyDetails-demo.tsx
rm -f client/package-demo.json

# Update App.tsx imports to remove auth references
echo "🔧 Updating imports..."
sed -i 's/import { AuthProvider } from "\.\/contexts\/AuthContext";//g' client/App.tsx
sed -i 's/import ProtectedRoute from "\.\/components\/ProtectedRoute";//g' client/App.tsx

# Create a clean README for the demo branch
cat > README-DEMO.md << EOF
# AgriSupply Insights - Client Demo

This is the client demonstration version of AgriSupply Insights featuring:

## 📊 Dashboard Page
- Key business metrics and KPIs
- Revenue trends and analytics
- Top selling supplies overview
- Recent activities tracking

## 📦 Supply Details Page  
- Complete inventory management
- Stock level monitoring
- Pricing trends analysis
- AI-powered recommendations

## 🎯 Demo Features
- ✅ No authentication required
- ✅ Static demo data included
- ✅ Professional presentation ready
- ✅ Responsive design
- ✅ Clean navigation

## 🚀 Quick Start

\`\`\`bash
cd client
npm install
npm run dev
\`\`\`

Navigate to:
- Dashboard: http://localhost:5173/
- Supply Details: http://localhost:5173/supplies

Perfect for client presentations and demonstrations!
EOF

# Stage all changes
echo "📦 Staging changes..."
git add .

# Commit with a professional message
echo "💾 Committing demo branch..."
git commit -m "feat: create client demo branch with dashboard and supply details

✨ Features:
- Dashboard with key metrics, revenue trends, and analytics
- Supply Details with inventory management and AI insights
- Professional UI optimized for client presentations
- Static demo data for reliable demonstrations
- No authentication requirements for easy access

🎯 Perfect for client presentations and product demos
📊 Includes realistic business data and insights
🚀 Ready to deploy for stakeholder demonstrations"

echo ""
echo "✅ Demo branch setup complete!"
echo ""
echo "🎉 Your client-demo branch is ready with:"
echo "   📊 Dashboard Page (/) - Business metrics and analytics"
echo "   📦 Supply Details (/supplies) - Inventory management"
echo ""
echo "📝 Next steps:"
echo "   1. Push the branch: git push origin client-demo"
echo "   2. Run the demo: cd client && npm install && npm run dev"
echo "   3. Present to clients: http://localhost:5173"
echo ""
echo "🔄 To switch back to full version: git checkout main"
