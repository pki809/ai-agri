# AgriSupply Insights - Development Guide

A comprehensive agricultural supply chain management platform built with modern web technologies.

## Overview

AgriSupply Insights is a full-stack SaaS application designed for agricultural cooperatives to manage inventory, track market trends, analyze customer patterns, and receive real-time alerts for business optimization.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express.js + PostgreSQL
- **Real-time**: Socket.io for live updates
- **Authentication**: JWT-based secure authentication
- **UI**: Radix UI components + Custom design system

## Project Structure

```
client/                   # React frontend application
├── pages/               # Application pages (Dashboard, Supply Details, etc.)
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth, etc.)
├── hooks/              # Custom React hooks
└── lib/                # Utility functions

server/                  # Express backend API
├── routes/             # API route handlers
├── middleware/         # Custom middleware (auth, error handling)
├── database/           # Database connection and schema
├── utils/              # Backend utilities
└── socket/             # WebSocket handlers

shared/                  # Shared types and interfaces
└── api.ts              # Common API interfaces
```

## Key Features

### Dashboard & Analytics

- Real-time metrics and KPIs
- Interactive charts and visualizations
- Purchase recommendations
- Market trend analysis

### Inventory Management

- Smart stock tracking with automated alerts
- Supplier relationship management
- Reorder level monitoring
- Stock history and transactions

### Customer Intelligence

- Purchase pattern analysis
- Customer segmentation
- Predictive analytics integration
- Personalized recommendations

### Real-time System

- Live inventory updates
- Market price alerts
- System notifications
- Multi-user collaboration

## Development Commands

```bash
npm run dev           # Start development servers (frontend + backend)
npm run dev:frontend  # Start only frontend development server
npm run dev:backend   # Start only backend development server
npm run build         # Production build
npm run migrate       # Run database migrations
npm test             # Run test suites
```

## Environment Setup

1. Copy environment files:

```bash
cp server/.env.example server/.env
```

2. Configure database and API keys in `.env`

3. Initialize database:

```bash
npm run migrate
```

4. Start development:

```bash
npm run dev
```

## API Development

### Adding New Endpoints

1. Create route handler in `server/routes/`:

```typescript
import express from "express";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.get("/endpoint", authenticateToken, async (req, res) => {
  // Implementation here
});

export default router;
```

2. Register in `server/server.js`:

```typescript
app.use("/api/endpoint", endpointRoutes);
```

### Frontend Integration

```typescript
// Use in React components
const response = await fetch("/api/endpoint", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
const data = await response.json();
```

## Authentication Flow

1. User signs in via `/api/auth/signin`
2. JWT tokens (access + refresh) returned
3. Protected routes require valid access token
4. Frontend handles token refresh automatically

## Real-time Features

WebSocket events for live updates:

- `inventory_update` - Stock level changes
- `new_alert` - System alerts
- `market_trend_update` - Price changes
- `order_status_update` - Order updates

## Database Schema

Core entities:

- **users** - User accounts and roles
- **supplies** - Inventory items
- **customers** - Customer information
- **orders** - Purchase orders
- **market_trends** - Commodity pricing
- **alerts** - System notifications

## Deployment

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
docker-compose up -d
```

### Environment Variables

Configure production values in `server/.env`:

- Database connection details
- JWT secrets
- External API keys
- Email service configuration

## Security Features

- JWT-based authentication with refresh tokens
- Role-based access control
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS protection
- SQL injection prevention

## Performance Optimization

- Database connection pooling
- Redis caching (optional)
- Gzip compression
- Static asset optimization
- Lazy loading for large datasets

## ML Integration

The platform is designed to integrate with machine learning models:

- Data export endpoints for training
- Prediction storage API
- Real-time ML result processing
- Model performance tracking

## Contributing

1. Follow existing code style and patterns
2. Write tests for new features
3. Update documentation for API changes
4. Use TypeScript throughout
5. Ensure responsive design for all UI changes

## Support

For development questions and support:

- Check API documentation in `/API_DOCUMENTATION.md`
- Review existing code patterns
- Test thoroughly before deployment
