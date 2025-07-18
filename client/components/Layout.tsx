import { ReactNode } from "react";
import { Search, Bell, User, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  return (
    <div className="min-h-screen bg-[#F7FCFA]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E8EB] px-10 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-bold text-[#0D1C17] font-['Lexend']">
                AgriSupply Insights
              </h1>
            </div>
            <nav className="flex items-center gap-9">
              <Link
                to="/"
                className={`text-sm font-normal text-[#0D1C17] font-['Lexend'] ${isActive("/") ? "font-medium" : ""}`}
              >
                Dashboard
              </Link>
              <Link
                to="/supplies"
                className={`text-sm font-normal text-[#0D1C17] font-['Lexend'] ${isActive("/supplies") ? "font-medium" : ""}`}
              >
                Supplies
              </Link>
              <Link
                to="/customers"
                className={`text-sm font-normal text-[#0D1C17] font-['Lexend'] ${isActive("/customers") ? "font-medium" : ""}`}
              >
                Customers
              </Link>
              <Link
                to="/market-trends"
                className={`text-sm font-normal text-[#0D1C17] font-['Lexend'] ${isActive("/market-trends") ? "font-medium" : ""}`}
              >
                Market Trends
              </Link>
              <Link
                to="/alerts"
                className={`text-sm font-normal text-[#0D1C17] font-['Lexend'] ${isActive("/alerts") ? "font-medium" : ""}`}
              >
                Alerts
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex items-center bg-[#E5F5F0] rounded-xl overflow-hidden min-w-40 max-w-64">
              <div className="px-4 py-2 flex items-center">
                <Search className="w-6 h-6 text-[#45A180]" />
              </div>
              <div className="px-4 py-2 flex-1">
                <span className="text-[#45A180] text-base font-normal font-['Lexend']">
                  Search
                </span>
              </div>
            </div>
            <div className="relative group">
              <div className="w-10 h-10 rounded-full bg-[#E5F5F0] flex items-center justify-center cursor-pointer hover:bg-[#45A180] transition-colors">
                <User className="w-5 h-5 text-[#45A180] group-hover:text-white" />
              </div>

              {/* User Dropdown Menu */}
              <div className="absolute right-0 top-12 w-64 bg-white rounded-xl border border-[#CCE8DE] shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-4 border-b border-[#E5E8EB]">
                  <p className="font-medium text-[#0D1C17] font-['Lexend']">
                    {user?.name || "User"}
                  </p>
                  <p className="text-sm text-[#45A180] font-['Lexend']">
                    {user?.email || "user@example.com"}
                  </p>
                  {user?.farmName && (
                    <p className="text-xs text-[#45A180] font-['Lexend'] mt-1">
                      {user.farmName}
                    </p>
                  )}
                </div>
                <div className="p-2">
                  <Link
                    to="/account"
                    className="w-full flex items-center px-3 py-2 text-sm text-[#0D1C17] font-['Lexend'] hover:bg-[#F7FCFA] rounded-lg transition-colors"
                  >
                    <User className="w-4 h-4 mr-2 text-[#45A180]" />
                    Account Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-3 py-2 text-sm text-[#0D1C17] font-['Lexend'] hover:bg-[#F7FCFA] rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-2 text-[#45A180]" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex">{children}</main>
    </div>
  );
}
