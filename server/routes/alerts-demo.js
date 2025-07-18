const express = require("express");
const router = express.Router();

const alertsData = {
  overview: {
    total_alerts: 8,
    unread_alerts: 2,
    critical_alerts: 1,
    high_alerts: 2,
    alerts_24h: 3,
    alerts_7d: 8,
  },
  recent_alerts: [
    {
      id: "1",
      title: "Low Stock Alert: Nitrogen Fertilizer",
      severity: "high",
      alert_type: "low_stock",
      created_at: "2024-01-26T08:30:00Z",
      is_read: false,
    },
    {
      id: "2",
      title: "Market Alert: Corn Price Increase",
      severity: "medium",
      alert_type: "market_change",
      created_at: "2024-01-25T14:20:00Z",
      is_read: false,
    },
  ],
};

const alertsList = [
  {
    id: "1",
    title: "Low Stock Alert: Nitrogen Fertilizer",
    message: "Nitrogen Fertilizer stock is running low (15 lbs remaining)",
    alert_type: "low_stock",
    severity: "high",
    is_read: false,
    metadata: { supply_id: "1", current_stock: 15, reorder_level: 100 },
    created_at: "2024-01-26T08:30:00Z",
    age_category: "recent",
  },
  {
    id: "2",
    title: "Market Alert: Corn Price Increase",
    message: "Corn prices have increased by 8% in the last 24 hours",
    alert_type: "market_change",
    severity: "medium",
    is_read: false,
    metadata: { commodity: "corn", percentage_change: 8 },
    created_at: "2024-01-25T14:20:00Z",
    age_category: "recent",
  },
  {
    id: "3",
    title: "Weather Alert",
    message: "Heavy rain forecasted for next week - consider indoor storage",
    alert_type: "weather",
    severity: "medium",
    is_read: true,
    metadata: { region: "midwest", event: "heavy_rain" },
    created_at: "2024-01-24T16:45:00Z",
    age_category: "old",
  },
];

// Get alerts overview/stats
router.get("/stats/overview", (req, res) => {
  res.json({
    success: true,
    data: alertsData,
  });
});

// Get all alerts
router.get("/", (req, res) => {
  res.json({
    success: true,
    data: {
      alerts: alertsList,
      pagination: {
        page: 1,
        limit: 20,
        total: alertsList.length,
        totalPages: 1,
      },
    },
  });
});

module.exports = router;
