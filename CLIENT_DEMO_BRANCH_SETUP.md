# Client Demo Branch Setup Instructions

This guide will help you create a separate `client-demo` branch with only 2 pages (Dashboard and Supply Details) without authentication requirements.

## Step 1: Create the Demo Branch

```bash
# Create and switch to the demo branch
git checkout -b client-demo

# Copy the demo files over the main files
cp client/App-demo.tsx client/App.tsx
cp client/pages/Dashboard-demo.tsx client/pages/Dashboard.tsx
cp client/pages/SupplyDetails-demo.tsx client/pages/SupplyDetails.tsx

# Optional: Use demo package.json
cp client/package-demo.json client/package.json
```

## Step 2: Remove Authentication Dependencies

Remove authentication-related files and references:

```bash
# Remove authentication files (optional, they won't be used)
rm -f client/contexts/AuthContext.tsx
rm -f client/components/ProtectedRoute.tsx
rm -f client/pages/SignIn.tsx
rm -f client/pages/SignUp.tsx

# Remove API hooks (demo uses static data)
rm -f client/hooks/useApi.ts
```

## Step 3: Clean Up Unnecessary Files

Remove files that aren't needed for the demo:

```bash
# Remove other pages not used in demo
rm -f client/pages/MarketTrends.tsx
rm -f client/pages/RealTimeAlerts.tsx
rm -f client/pages/Account.tsx
rm -f client/pages/CustomerPatterns.tsx

# Remove demo configuration files
rm -f client/config/demo.ts
rm -f client/components/DemoNavigation.tsx

# Remove any external references
rm -rf client/components/ui/
find client -name "*.tsx" -exec sed -i 's/@\/components\/ui/./g' {} \;
```

## Step 4: Update Dependencies

Update package.json to remove unnecessary dependencies:

```bash
cd client
npm uninstall @tanstack/react-query
# Keep only essential dependencies for the demo
```

## Step 5: Commit the Demo Branch

```bash
# Add all demo files
git add .

# Commit with a clean message
git commit -m "feat: create client demo with dashboard and supply details

- Add simplified dashboard with key metrics and analytics
- Add supply details page with inventory management
- Remove authentication requirements for demo
- Include static demo data for presentation
- Clean UI optimized for client presentations"

# Push the demo branch
git push origin client-demo
```

## Demo Branch Features

### ✅ What's Included:

1. **Dashboard Page (`/`)**:

   - Key business metrics (Revenue, Orders, Customers)
   - Revenue trend charts with 7-day data
   - Top selling supplies table
   - Recent activities log
   - Real-time alerts sidebar

2. **Supply Details Page (`/supplies`)**:

   - Complete inventory overview table
   - Stock status indicators (Good/Medium/Low)
   - Pricing trends analytics
   - Demand forecasting charts
   - AI-powered recommendations
   - Critical stock alerts

3. **Shared Features**:
   - Professional AgriSupply Insights branding
   - Responsive design for all screen sizes
   - Clean navigation between 2 pages
   - Static demo data (no backend required)
   - Professional color scheme and typography

### ❌ What's Removed:

- Authentication (Sign-in/Sign-up pages)
- Protected routes
- JWT token management
- Backend API calls
- Other pages (Market Trends, Alerts, Account, etc.)
- External service dependencies
- Complex state management

## Running the Demo

```bash
# On the client-demo branch
cd client
npm install
npm run dev

# Demo will be available at http://localhost:5173
# Direct access to both pages without login:
# - Dashboard: http://localhost:5173/
# - Supply Details: http://localhost:5173/supplies
```

## Demo Data

The demo includes realistic static data:

- **Revenue**: $125,000 total with 45 orders
- **Customers**: 12 active customers
- **Inventory**: 5 supply items with different stock levels
- **Alerts**: 2 critical stock and market alerts
- **Analytics**: 6-month pricing trends and demand forecasts

## Branch Maintenance

### Switching Between Branches:

```bash
# Switch to full implementation
git checkout main

# Switch to demo version
git checkout client-demo

# Keep demo branch updated with core improvements
git checkout client-demo
git rebase main  # Apply only relevant changes
```

### Making Demo Updates:

```bash
# Work on client-demo branch
git checkout client-demo

# Make changes to demo files
# ... edit files ...

# Commit demo-specific changes
git add .
git commit -m "feat(demo): improve dashboard analytics display"
git push origin client-demo
```

## Deployment

### For Client Presentations:

1. **Use client-demo branch**
2. **Deploy to staging environment**
3. **No backend required** (static data)
4. **Direct page access** (no authentication)

### For Development:

1. **Use main branch**
2. **Full backend integration**
3. **Complete authentication system**
4. **All 8 pages functional**

This setup provides a clean, professional demo environment perfect for client presentations while maintaining the full implementation for development and production use.
