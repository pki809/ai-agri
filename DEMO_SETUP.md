# Demo Setup Instructions

This document explains how to set up the AgriSupply Insights application for demo presentations with only the Dashboard and Supply Details pages.

## Demo Mode Configuration

### For Main Branch Demo (Week 1 Presentation)

To enable demo mode with only Dashboard and Supply Details pages:

1. **Create Environment File**:

   ```bash
   # In the client directory, create or update .env file
   echo "REACT_APP_DEMO_MODE=true" > client/.env
   ```

2. **Start the Application**:

   ```bash
   # Start the backend server
   cd server
   npm install
   npm start

   # Start the frontend (in a new terminal)
   cd client
   npm install
   npm start
   ```

3. **Demo Features**:
   - **Available Pages**: Dashboard (`/`) and Supply Details (`/supplies`)
   - **Hidden Pages**: Market Trends, Alerts, Purchase Patterns, Account
   - **Static Data**: Uses pre-configured demo data instead of live API calls
   - **Demo Indicator**: Shows "DEMO MODE" badge in navigation

### For Complete Implementation

To show the full application with all 8 pages and live backend data:

1. **Disable Demo Mode**:

   ```bash
   # Remove or comment out the demo mode setting
   # REACT_APP_DEMO_MODE=true
   echo "REACT_APP_DEMO_MODE=false" > client/.env
   # or delete the .env file entirely
   ```

2. **Ensure Backend is Running**:

   ```bash
   cd server
   npm start
   ```

3. **Full Features**:
   - **All 8 Pages Available**: Dashboard, Market Trends, Alerts, Account, Purchase Patterns, Supply Details, Sign-in, Sign-up
   - **Live Backend Integration**: Real API calls to PostgreSQL database
   - **JWT Authentication**: Complete user authentication system
   - **Real-time Data**: Dynamic data from backend endpoints

## Architecture Overview

### Two-Branch Strategy Implementation

**Complete Implementation** (Current State):

- All 8 pages fully functional
- Real backend API integration
- PostgreSQL database connectivity
- JWT authentication system
- Dynamic data throughout the application

**Main Branch Demo** (Configurable via Environment):

- Dashboard and Supply Details only
- Static demo data for presentation
- Clean, professional UI for client demos
- Simplified navigation

## Demo Data

The demo mode includes realistic static data:

- **Dashboard Metrics**: Revenue, orders, customers, stock alerts
- **Revenue Trends**: 7-day revenue chart with sample data
- **Supply Inventory**: 3 sample supply items with different stock levels
- **Recent Activities**: Sample order transactions
- **Alerts**: Sample inventory and market alerts

## Environment Variables

```bash
# Demo Configuration
REACT_APP_DEMO_MODE=true          # Enable/disable demo mode

# Backend Configuration (for full implementation)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agrisupply_insights
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

## Switching Between Modes

### Quick Mode Switch Commands:

**Enable Demo Mode**:

```bash
echo "REACT_APP_DEMO_MODE=true" > client/.env && cd client && npm start
```

**Disable Demo Mode**:

```bash
echo "REACT_APP_DEMO_MODE=false" > client/.env && cd client && npm start
```

## Production Deployment

For production deployment, ensure:

1. Set `REACT_APP_DEMO_MODE=false` or remove the variable entirely
2. Configure proper backend environment variables
3. Set up PostgreSQL database with schema
4. Configure JWT secrets for security
5. Set up SSL certificates for HTTPS

## Demo Presentation Tips

1. **Start with Demo Mode** for initial client presentation
2. **Show Dashboard** - Key metrics and business insights
3. **Navigate to Supply Details** - Inventory management features
4. **Highlight AI-driven insights** and market trend integration
5. **Switch to Full Implementation** to show complete feature set
6. **Demonstrate Authentication** with sign-in/sign-up flows
7. **Show Real-time Alerts** and market data integration

This setup allows for seamless switching between demo presentation mode and full functionality demonstration.
