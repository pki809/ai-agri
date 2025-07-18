# AgriSupply Insights API Documentation

## Base URL

```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

## Authentication

All API endpoints (except auth endpoints) require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow this format:

```json
{
  "success": true|false,
  "message": "Optional message",
  "data": {}, // Response data
  "errors": [] // Validation errors (if any)
}
```

## Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## Authentication Endpoints

### POST /auth/signup

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "company": "Farm Co-op"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "user"
    },
    "access_token": "jwt-token",
    "refresh_token": "refresh-token"
  }
}
```

### POST /auth/signin

User login.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### POST /auth/refresh

Refresh JWT token using refresh token.

**Request Body:**

```json
{
  "refresh_token": "your-refresh-token"
}
```

### POST /auth/logout

Logout user (invalidates tokens).

**Headers:** `Authorization: Bearer <token>`

---

## User Management

### GET /users/profile

Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "user",
    "phone": "+1234567890",
    "company": "Farm Co-op",
    "preferences": {},
    "created_at": "2023-01-01T00:00:00Z"
  }
}
```

### PUT /users/profile

Update user profile.

**Request Body:**

```json
{
  "full_name": "John Smith",
  "phone": "+1987654321",
  "company": "New Farm Co-op",
  "preferences": {
    "theme": "dark",
    "notifications": true
  }
}
```

---

## Supply Management

### GET /supplies

Get all supplies with filtering and pagination.

**Query Parameters:**

- `page` (integer, default: 1)
- `limit` (integer, default: 20, max: 100)
- `category` (string: seeds|fertilizers|pesticides|equipment|tools|other)
- `low_stock` (boolean)
- `search` (string)

**Response:**

```json
{
  "success": true,
  "data": {
    "supplies": [
      {
        "id": "uuid",
        "name": "Corn Seeds",
        "description": "High yield corn variety",
        "category": "seeds",
        "sku": "CORN-001",
        "unit": "kg",
        "current_stock": 100,
        "reorder_level": 20,
        "cost_per_unit": 5.5,
        "supplier_name": "Seed Corp",
        "stock_status": "good"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

### POST /supplies

Create new supply item.

**Request Body:**

```json
{
  "name": "Wheat Seeds",
  "description": "Premium wheat variety",
  "category": "seeds",
  "sku": "WHEAT-001",
  "unit": "kg",
  "current_stock": 500,
  "reorder_level": 50,
  "cost_per_unit": 4.25,
  "supplier_id": "supplier-uuid"
}
```

### PUT /supplies/:id

Update supply item.

### POST /supplies/:id/adjust-stock

Adjust stock levels with reason tracking.

**Request Body:**

```json
{
  "adjustment": -25,
  "reason": "Sold to Farm A",
  "adjustment_type": "sold"
}
```

---

## Customer Management

### GET /customers

Get all customers with filtering.

**Query Parameters:**

- `page`, `limit` (pagination)
- `search` (string)
- `type` (individual|business)
- `active` (boolean)

### GET /customers/:id

Get customer details with analytics.

**Response:**

```json
{
  "success": true,
  "data": {
    "customer": {
      "id": "uuid",
      "name": "Farm A",
      "email": "contact@farma.com",
      "customer_type": "business"
    },
    "analytics": {
      "total_orders": 25,
      "total_spent": 15000,
      "avg_order_value": 600,
      "last_order_date": "2023-06-15T10:30:00Z"
    },
    "top_supplies": [...],
    "recent_orders": [...]
  }
}
```

### GET /customers/analytics/purchase-patterns

Get customer segmentation and purchase analytics.

---

## Order Management

### GET /orders

Get orders with filtering.

**Query Parameters:**

- `status` (pending|confirmed|shipped|delivered|cancelled)
- `customer_id` (UUID)
- `start_date`, `end_date` (ISO date strings)

### POST /orders

Create new order.

**Request Body:**

```json
{
  "customer_id": "customer-uuid",
  "items": [
    {
      "supply_id": "supply-uuid",
      "quantity": 10
    }
  ],
  "shipping_address": "123 Farm Road",
  "notes": "Urgent delivery needed"
}
```

### PUT /orders/:id/status

Update order status.

**Request Body:**

```json
{
  "status": "shipped",
  "notes": "Shipped via FarmEx Express"
}
```

---

## Market Trends

### GET /market-trends

Get market trend data.

**Query Parameters:**

- `commodity` (string)
- `timeframe` (1d|7d|30d|90d|1y)
- `trend_direction` (up|down|stable)

### GET /market-trends/analysis/overview

Get market analysis and insights.

### GET /market-trends/commodity/:commodity/history

Get price history for specific commodity.

---

## Alerts

### GET /alerts

Get user alerts.

**Query Parameters:**

- `severity` (low|medium|high|critical)
- `is_read` (boolean)
- `alert_type` (string)

### POST /alerts

Create new alert (admin/manager only).

### PUT /alerts/:id/read

Mark alert as read.

### PUT /alerts/bulk/read

Mark multiple alerts as read.

**Request Body:**

```json
{
  "alert_ids": ["uuid1", "uuid2", "uuid3"]
}
```

---

## Dashboard

### GET /dashboard/overview

Get dashboard metrics and overview.

**Query Parameters:**

- `timeframe` (7d|30d|90d)

**Response:**

```json
{
  "success": true,
  "data": {
    "timeframe": "30d",
    "metrics": {
      "total_orders": 150,
      "total_revenue": 75000,
      "active_customers": 45,
      "low_stock_items": 8,
      "unread_alerts": 3,
      "avg_order_value": 500
    },
    "revenue_trend": [...],
    "top_supplies": [...],
    "order_status_distribution": [...],
    "recent_activities": [...]
  }
}
```

### GET /dashboard/inventory

Get inventory overview and analytics.

### GET /dashboard/sales

Get sales analytics.

### GET /dashboard/insights

Get AI insights and recommendations.

---

## ML Integration

### GET /ml/predictions

Get ML predictions with filtering.

**Query Parameters:**

- `prediction_type` (churn_risk|purchase_prediction|demand_forecast|price_forecast|inventory_optimization)
- `customer_id` (UUID)
- `commodity` (string)
- `min_confidence` (float 0-1)

### POST /ml/predictions

Store new ML prediction (requires ML API key).

**Headers:** `X-API-Key: your-ml-api-key`

**Request Body:**

```json
{
  "prediction_type": "demand_forecast",
  "confidence_score": 0.85,
  "predicted_value": {
    "demand": 150,
    "timeframe": "7d"
  },
  "model_version": "v1.2.0",
  "customer_id": "customer-uuid",
  "supply_id": "supply-uuid",
  "commodity": "corn",
  "input_features": {
    "historical_demand": [100, 120, 110],
    "seasonal_factor": 1.2,
    "market_conditions": "favorable"
  }
}
```

### POST /ml/predictions/batch

Store multiple predictions in a single request.

### GET /ml/training-data/:dataset

Export training data for ML models.

**Datasets:**

- `customer-behavior`
- `sales-patterns`
- `inventory-usage`
- `market-trends`

**Query Parameters:**

- `start_date`, `end_date` (ISO dates)
- `limit` (max 10000)

---

## Real-time WebSocket Events

### Client → Server Events

- `subscribe_alerts` - Subscribe to alert notifications
- `subscribe_inventory` - Subscribe to inventory updates
- `subscribe_market_trends` - Subscribe to market data
- `subscribe_orders` - Subscribe to order updates
- `request_dashboard_update` - Request latest dashboard data

### Server → Client Events

- `new_alert` - New alert notification
- `inventory_update` - Stock level changed
- `market_trend_update` - Market data updated
- `order_status_update` - Order status changed
- `dashboard_update` - Dashboard metrics updated

**Example WebSocket Usage:**

```javascript
import io from "socket.io-client";

const socket = io("http://localhost:5000", {
  auth: {
    token: "your-jwt-token",
  },
});

// Subscribe to alerts
socket.emit("subscribe_alerts");

// Listen for new alerts
socket.on("new_alert", (alert) => {
  console.log("New alert:", alert);
});

// Request dashboard update
socket.emit("request_dashboard_update");
socket.on("dashboard_update", (data) => {
  console.log("Dashboard updated:", data);
});
```

---

## Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per minute per IP
- **ML endpoints**: Separate limits based on API key tier

## Pagination

All list endpoints support pagination:

```json
{
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

## Date Formats

All dates use ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`

## File Uploads

Maximum file size: 10MB
Supported formats: Images (JPG, PNG, GIF), Documents (PDF, DOC, XLS)

Upload endpoint: `POST /uploads`
Uploaded files available at: `/uploads/filename`
