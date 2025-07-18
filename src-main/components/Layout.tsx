import { Outlet, NavLink } from "react-router-dom";
import {
  BarChart3,
  Package,
  Users,
  TrendingUp,
  Bell,
  Settings,
  LogIn,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
    current: true,
    available: true,
  },
  {
    name: "Supply Details",
    href: "/supplies",
    icon: Package,
    current: false,
    available: true,
  },
  {
    name: "Customer Analytics",
    href: "/customers",
    icon: Users,
    current: false,
    available: false,
    week: "Week 2",
  },
  {
    name: "Market Trends",
    href: "/market-trends",
    icon: TrendingUp,
    current: false,
    available: false,
    week: "Week 2",
  },
  {
    name: "Real-time Alerts",
    href: "/alerts",
    icon: Bell,
    current: false,
    available: false,
    week: "Week 3",
  },
  {
    name: "Account Settings",
    href: "/account",
    icon: Settings,
    current: false,
    available: false,
    week: "Week 3",
  },
  {
    name: "Authentication",
    href: "/signin",
    icon: LogIn,
    current: false,
    available: false,
    week: "Week 4",
  },
];

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="flex flex-col w-64 bg-white shadow-sm">
        <div className="flex items-center h-16 px-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">
            🌾 AgriSupply Insights
          </h1>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    item.available
                      ? isActive
                        ? "bg-green-100 text-green-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      : "text-gray-400 cursor-not-allowed"
                  }`
                }
                onClick={(e) => {
                  if (!item.available) {
                    e.preventDefault();
                  }
                }}
              >
                <Icon
                  className={`mr-3 h-5 w-5 ${
                    item.available ? "text-current" : "text-gray-300"
                  }`}
                />
                {item.name}
                {!item.available && (
                  <span className="ml-auto text-xs text-gray-400">
                    {item.week}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Progress indicator */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-sm text-gray-600 mb-2">Development Progress</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: "25%" }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Week 1 - 25% Complete
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
