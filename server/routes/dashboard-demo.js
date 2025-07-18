const express = require("express");
const router = express.Router();

// Demo dashboard data
const dashboardData = {
  metrics: {
    total_orders: 45,
    total_revenue: 125000,
    active_customers: 12,
    low_stock_items: 3,
    unread_alerts: 2,
    avg_order_value: 2778,
  },
  revenue_trend: [
    { date: "2024-01-20", revenue: 8500, order_count: 3 },
    { date: "2024-01-21", revenue: 12000, order_count: 4 },
    { date: "2024-01-22", revenue: 6500, order_count: 2 },
    { date: "2024-01-23", revenue: 15000, order_count: 5 },
    { date: "2024-01-24", revenue: 18500, order_count: 7 },
    { date: "2024-01-25", revenue: 22000, order_count: 8 },
    { date: "2024-01-26", revenue: 25000, order_count: 9 },
  ],
  top_supplies: [
    {
      id: "1",
      name: "Nitrogen Fertilizer",
      category: "fertilizers",
      total_sold: 2500,
      total_revenue: 45000,
    },
    {
      id: "2",
      name: "Corn Seeds",
      category: "seeds",
      total_sold: 500,
      total_revenue: 38000,
    },
    {
      id: "3",
      name: "Pesticide Pro",
      category: "pesticides",
      total_sold: 150,
      total_revenue: 22000,
    },
  ],
  recent_activities: [
    {
      id: "1",
      order_number: "ORD-2024-001",
      status: "completed",
      total_amount: 8500,
      created_at: "2024-01-26T10:30:00Z",
      customer_name: "Green Valley Farms",
    },
    {
      id: "2",
      order_number: "ORD-2024-002",
      status: "pending",
      total_amount: 12000,
      created_at: "2024-01-26T09:15:00Z",
      customer_name: "Sunrise Agriculture",
    },
    {
      id: "3",
      order_number: "ORD-2024-003",
      status: "completed",
      total_amount: 6500,
      created_at: "2024-01-25T16:20:00Z",
      customer_name: "Prairie Harvest Co",
    },
  ],
};

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

// Dashboard overview endpoint
router.get("/overview", (req, res) => {
  res.json({
    success: true,
    data: dashboardData,
  });
});

// Inventory overview endpoint
router.get("/inventory", (req, res) => {
  res.json({
    success: true,
    data: {
      overview: {
        total_supplies: 45,
        low_stock_count: 3,
        out_of_stock_count: 1,
        total_inventory_value: 285000,
      },
      by_category: [
        {
          category: "fertilizers",
          item_count: 15,
          category_value: 125000,
          low_stock_items: 2,
        },
        {
          category: "seeds",
          item_count: 20,
          category_value: 95000,
          low_stock_items: 1,
        },
        {
          category: "pesticides",
          item_count: 10,
          category_value: 65000,
          low_stock_items: 0,
        },
      ],
      critical_stock: [
        {
          id: "1",
          name: "Nitrogen Fertilizer",
          category: "fertilizers",
          current_stock: 15,
          reorder_level: 100,
          unit: "lbs",
          supplier_name: "AgriChem Solutions",
          stock_percentage: 15,
        },
      ],
      recent_movements: [
        {
          transaction_type: "sold",
          quantity: -50,
          reason: "Customer order",
          created_at: "2024-01-26T14:30:00Z",
          supply_name: "Corn Seeds",
          unit: "bags",
          user_name: "Demo User",
        },
      ],
    },
  });
});

module.exports = router;
