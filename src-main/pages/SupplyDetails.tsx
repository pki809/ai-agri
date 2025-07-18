import { useState } from "react";
import {
  Search,
  Filter,
  Plus,
  Package,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

// Sample data for supplies
const supplies = [
  {
    id: 1,
    name: "Corn Seeds - Premium",
    category: "Seeds",
    sku: "CORN-001",
    currentStock: 245,
    reorderLevel: 50,
    unit: "kg",
    price: 4.5,
    supplier: "AgriSeeds Co.",
    status: "good",
  },
  {
    id: 2,
    name: "NPK Fertilizer 15-15-15",
    category: "Fertilizers",
    sku: "FERT-015",
    currentStock: 18,
    reorderLevel: 25,
    unit: "bags",
    price: 25.0,
    supplier: "FertilizerMax",
    status: "low",
  },
  {
    id: 3,
    name: "Wheat Seeds - Winter Variety",
    category: "Seeds",
    sku: "WHEAT-W01",
    currentStock: 180,
    reorderLevel: 40,
    unit: "kg",
    price: 3.8,
    supplier: "AgriSeeds Co.",
    status: "good",
  },
  {
    id: 4,
    name: "Irrigation Pipes 4-inch",
    category: "Equipment",
    sku: "PIPE-004",
    currentStock: 75,
    reorderLevel: 20,
    unit: "meters",
    price: 12.0,
    supplier: "FarmEquip Ltd.",
    status: "good",
  },
  {
    id: 5,
    name: "Pesticide Spray - Organic",
    category: "Pesticides",
    sku: "PEST-ORG1",
    currentStock: 5,
    reorderLevel: 15,
    unit: "liters",
    price: 35.0,
    supplier: "EcoFarm Solutions",
    status: "critical",
  },
  {
    id: 6,
    name: "Hand Tools Set",
    category: "Tools",
    sku: "TOOL-SET1",
    currentStock: 42,
    reorderLevel: 10,
    unit: "sets",
    price: 85.0,
    supplier: "ToolMaster",
    status: "good",
  },
];

const categories = [
  "All",
  "Seeds",
  "Fertilizers",
  "Equipment",
  "Pesticides",
  "Tools",
];

export default function SupplyDetails() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("name");

  const filteredSupplies = supplies
    .filter((supply) => {
      const matchesSearch =
        supply.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supply.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || supply.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "stock":
          return b.currentStock - a.currentStock;
        case "status":
          const statusOrder = { critical: 0, low: 1, good: 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "low":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === "critical" || status === "low") {
      return <AlertTriangle className="w-4 h-4" />;
    }
    return <Package className="w-4 h-4" />;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Supply Details</h1>
            <p className="text-gray-600 mt-2">
              Manage your inventory and track stock levels across all
              categories.
            </p>
          </div>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Plus className="w-4 h-4" />
            Add Supply
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">
                {supplies.length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Low Stock Items
              </p>
              <p className="text-2xl font-bold text-yellow-600">
                {supplies.filter((s) => s.status === "low").length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Critical Items
              </p>
              <p className="text-2xl font-bold text-red-600">
                {supplies.filter((s) => s.status === "critical").length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search supplies by name or SKU..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Sort by Name</option>
              <option value="stock">Sort by Stock</option>
              <option value="status">Sort by Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Supply Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSupplies.map((supply) => (
                <tr key={supply.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {supply.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      {supply.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {supply.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {supply.currentStock} {supply.unit}
                    </div>
                    <div className="text-xs text-gray-500">
                      Reorder: {supply.reorderLevel} {supply.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(supply.status)}`}
                    >
                      {getStatusIcon(supply.status)}
                      {supply.status.charAt(0).toUpperCase() +
                        supply.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${supply.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {supply.supplier}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-green-600 hover:text-green-900 transition-colors">
                        Edit
                      </button>
                      <button className="text-blue-600 hover:text-blue-900 transition-colors">
                        Reorder
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSupplies.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No supplies found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search terms or filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
