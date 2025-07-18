import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Bell, Menu, X } from "lucide-react";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7FCFA] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E8EB] px-4 sm:px-10 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-8">
            <h1 className="text-[#0D1C17] text-lg font-bold font-['Lexend']">
              AgriSupply Insights
            </h1>
            <nav className="hidden sm:flex items-center gap-6 lg:gap-9">
              <Link
                to="/"
                className="text-[#0D1C17] text-sm font-normal font-['Lexend'] hover:text-[#45A180]"
              >
                Dashboard
              </Link>
              <Link
                to="/supplies"
                className="text-[#0D1C17] text-sm font-normal font-['Lexend'] hover:text-[#45A180]"
              >
                Supplies
              </Link>
              <Link
                to="/inventory"
                className="text-[#0D1C17] text-sm font-normal font-['Lexend'] hover:text-[#45A180]"
              >
                Inventory
              </Link>
              <Link
                to="/market-trends"
                className="text-[#0D1C17] text-sm font-normal font-['Lexend'] hover:text-[#45A180]"
              >
                Market Trends
              </Link>
              <Link
                to="/reports"
                className="text-[#0D1C17] text-sm font-normal font-['Lexend'] hover:text-[#45A180]"
              >
                Reports
              </Link>
            </nav>
            <button
              className="sm:hidden p-2 -m-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-[#0D1C17]" />
              ) : (
                <Menu className="w-5 h-5 text-[#0D1C17]" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-4 sm:gap-8">
            <div className="flex items-center bg-[#E5F5F0] rounded-xl overflow-hidden min-w-[160px] max-w-[256px]">
              <div className="pl-4 flex items-center">
                <Search className="w-5 h-5 sm:w-6 sm:h-6 text-[#45A180]" />
              </div>
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent px-2 py-2 text-[#45A180] placeholder-[#45A180] text-base font-['Lexend'] outline-none flex-1"
              />
            </div>
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/ccbb3417884ae43e228f3c29547a9c6e00cce21d?width=80"
              alt="Profile"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
            />
          </div>
        </div>
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden border-t border-[#E5E8EB] bg-white px-4 py-3">
            <nav className="flex flex-col space-y-3">
              <Link
                to="/"
                className="text-[#0D1C17] text-sm font-normal font-['Lexend'] hover:text-[#45A180] py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/supplies"
                className="text-[#0D1C17] text-sm font-normal font-['Lexend'] hover:text-[#45A180] py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Supplies
              </Link>
              <Link
                to="/inventory"
                className="text-[#0D1C17] text-sm font-normal font-['Lexend'] hover:text-[#45A180] py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Inventory
              </Link>
              <Link
                to="/market-trends"
                className="text-[#0D1C17] text-sm font-normal font-['Lexend'] hover:text-[#45A180] py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Market Trends
              </Link>
              <Link
                to="/reports"
                className="text-[#0D1C17] text-sm font-normal font-['Lexend'] hover:text-[#45A180] py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Reports
              </Link>
            </nav>
          </div>
        )}
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-80 bg-[#F7FCFA] border-r border-[#E5E8EB] p-6 overflow-y-auto hidden lg:block flex-shrink-0">
          {/* Quick Actions */}
          <section className="mb-8">
            <h2 className="text-[#0D1C17] text-[22px] font-bold font-['Lexend'] leading-7 mb-3 pt-5 pb-3">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <button className="w-full h-10 px-4 bg-[#009963] rounded-[20px] flex items-center justify-center transition-colors hover:bg-[#008055]">
                <span className="text-[#F7FCFA] text-sm font-bold font-['Lexend'] leading-[21px]">
                  New Purchase Order
                </span>
              </button>
              <button className="w-full h-10 px-4 bg-[#E5F5F0] rounded-[20px] flex items-center justify-center transition-colors hover:bg-[#CCE8DE]">
                <span className="text-[#0D1C17] text-sm font-bold font-['Lexend'] leading-[21px]">
                  View Inventory
                </span>
              </button>
              <button className="w-full h-10 px-4 bg-[#E5F5F0] rounded-[20px] flex items-center justify-center transition-colors hover:bg-[#CCE8DE]">
                <span className="text-[#0D1C17] text-sm font-bold font-['Lexend'] leading-[21px]">
                  Market Analysis
                </span>
              </button>
            </div>
          </section>

          {/* Alerts */}
          <section>
            <h2 className="text-[#0D1C17] text-[22px] font-bold font-['Lexend'] leading-7 mb-3 pt-5 pb-3">
              Alerts
            </h2>
            <div className="space-y-0">
              <div className="flex items-center gap-4 p-2 bg-[#F7FCFA] min-h-[72px]">
                <div className="w-12 h-12 rounded-lg bg-[#E5F5F0] flex items-center justify-center">
                  <Bell className="w-6 h-6 text-[#0D1C17]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[#0D1C17] text-base font-medium font-['Lexend'] leading-6">
                    Inventory Alert
                  </h3>
                  <p className="text-[#45A180] text-sm font-normal font-['Lexend'] leading-[21px]">
                    Low stock on fertilizer
                  </p>
                </div>
                <span className="text-[#45A180] text-sm font-normal font-['Lexend'] leading-[21px]">
                  2h ago
                </span>
              </div>
              <div className="flex items-center gap-4 p-2 bg-[#F7FCFA] min-h-[72px]">
                <div className="w-12 h-12 rounded-lg bg-[#E5F5F0] flex items-center justify-center">
                  <Bell className="w-6 h-6 text-[#0D1C17]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[#0D1C17] text-base font-medium font-['Lexend'] leading-6">
                    Market Alert
                  </h3>
                  <p className="text-[#45A180] text-sm font-normal font-['Lexend'] leading-[21px]">
                    Price increase on seeds
                  </p>
                </div>
                <span className="text-[#45A180] text-sm font-normal font-['Lexend'] leading-[21px]">
                  4h ago
                </span>
              </div>
            </div>
          </section>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 px-5 sm:px-6 py-5">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header Section */}
            <div className="px-4 py-4">
              <h2 className="text-[#0D1C17] text-[32px] font-bold font-['Lexend'] leading-10 mb-3">
                Dashboard Overview
              </h2>
              <p className="text-[#45A180] text-sm font-normal font-['Lexend'] leading-[21px]">
                AI-driven insights for optimal supply purchasing
              </p>
            </div>

            {/* Key Metrics */}
            <section>
              <h3 className="text-[#0D1C17] text-[22px] font-bold font-['Lexend'] leading-7 mb-3 px-4 pt-5 pb-3">
                Key Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4">
                <div className="bg-[#E5F5F0] rounded-xl p-6">
                  <h4 className="text-[#0D1C17] text-base font-medium font-['Lexend'] leading-6 mb-2">
                    Total Supply Spend
                  </h4>
                  <p className="text-[#0D1C17] text-2xl font-bold font-['Lexend'] leading-[30px] mb-2">
                    $250,000
                  </p>
                  <span className="text-[#08872E] text-base font-medium font-['Lexend'] leading-6">
                    +10%
                  </span>
                </div>
                <div className="bg-[#E5F5F0] rounded-xl p-6">
                  <h4 className="text-[#0D1C17] text-base font-medium font-['Lexend'] leading-6 mb-2">
                    Average Order Value
                  </h4>
                  <p className="text-[#0D1C17] text-2xl font-bold font-['Lexend'] leading-[30px] mb-2">
                    $5,000
                  </p>
                  <span className="text-[#E82E08] text-base font-medium font-['Lexend'] leading-6">
                    -5%
                  </span>
                </div>
                <div className="bg-[#E5F5F0] rounded-xl p-6">
                  <h4 className="text-[#0D1C17] text-base font-medium font-['Lexend'] leading-6 mb-2">
                    On-Time Delivery Rate
                  </h4>
                  <p className="text-[#0D1C17] text-2xl font-bold font-['Lexend'] leading-[30px] mb-2">
                    95%
                  </p>
                  <span className="text-[#08872E] text-base font-medium font-['Lexend'] leading-6">
                    +2%
                  </span>
                </div>
              </div>
            </section>

            {/* Purchase Recommendations */}
            <section>
              <h3 className="text-[#0D1C17] text-[22px] font-bold font-['Lexend'] leading-7 mb-3 px-4 pt-5 pb-3">
                Purchase Recommendations
              </h3>
              <div className="px-4">
                <div className="bg-[#F7FCFA] border border-[#CCE8DE] rounded-xl overflow-hidden">
                  {/* Table Header */}
                  <div className="hidden sm:grid grid-cols-5 gap-4 p-4 bg-[#F7FCFA]">
                    <span className="text-[#0D1C17] text-sm font-medium font-['Lexend'] leading-[21px]">
                      Product
                    </span>
                    <span className="text-[#0D1C17] text-sm font-medium font-['Lexend'] leading-[21px]">
                      Supplier
                    </span>
                    <span className="text-[#0D1C17] text-sm font-medium font-['Lexend'] leading-[21px]">
                      Recommended Quantity
                    </span>
                    <span className="text-[#0D1C17] text-sm font-medium font-['Lexend'] leading-[21px]">
                      Reason
                    </span>
                    <span className="text-[#45A180] text-sm font-medium font-['Lexend'] leading-[21px]">
                      Action
                    </span>
                  </div>

                  {/* Table Rows */}
                  <div className="border-t border-[#E5E8EB] sm:hidden">
                    {/* Mobile Card Layout */}
                    <div className="p-4 border-b border-[#E5E8EB]">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-[#0D1C17] text-sm font-bold font-['Lexend']">
                            Nitrogen Fertilizer
                          </span>
                          <span className="text-[#45A180] text-sm font-bold font-['Lexend']">
                            View Details
                          </span>
                        </div>
                        <div className="text-[#45A180] text-sm font-normal font-['Lexend']">
                          AgriChem Solutions • 5000 lbs
                        </div>
                        <div className="text-[#45A180] text-xs font-normal font-['Lexend']">
                          High demand, low inventory
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border-b border-[#E5E8EB]">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-[#0D1C17] text-sm font-bold font-['Lexend']">
                            Corn Seeds
                          </span>
                          <span className="text-[#45A180] text-sm font-bold font-['Lexend']">
                            View Details
                          </span>
                        </div>
                        <div className="text-[#45A180] text-sm font-normal font-['Lexend']">
                          SeedCo Genetics • 2000 bags
                        </div>
                        <div className="text-[#45A180] text-xs font-normal font-['Lexend']">
                          Seasonal price advantage
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-[#0D1C17] text-sm font-bold font-['Lexend']">
                            Pesticide X
                          </span>
                          <span className="text-[#45A180] text-sm font-bold font-['Lexend']">
                            View Details
                          </span>
                        </div>
                        <div className="text-[#45A180] text-sm font-normal font-['Lexend']">
                          CropGuard Inc. • 100 gallons
                        </div>
                        <div className="text-[#45A180] text-xs font-normal font-['Lexend']">
                          Upcoming pest forecast
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Desktop Table Layout */}
                  <div className="border-t border-[#E5E8EB] hidden sm:block">
                    <div className="grid grid-cols-5 gap-4 p-4 min-h-[72px] items-center border-b border-[#E5E8EB]">
                      <span className="text-[#0D1C17] text-sm font-normal font-['Lexend'] leading-[21px]">
                        Nitrogen Fertilizer
                      </span>
                      <span className="text-[#45A180] text-sm font-normal font-['Lexend'] leading-[21px]">
                        AgriChem Solutions
                      </span>
                      <span className="text-[#45A180] text-sm font-normal font-['Lexend'] leading-[21px]">
                        5000 lbs
                      </span>
                      <span className="text-[#45A180] text-sm font-normal font-['Lexend'] leading-[21px]">
                        High demand, low inventory
                      </span>
                      <a
                        href="#"
                        className="text-[#45A180] text-sm font-bold font-['Lexend'] leading-[21px] cursor-pointer"
                      >
                        <p>View Details</p>
                      </a>
                    </div>
                    <div className="grid grid-cols-5 gap-4 p-4 min-h-[72px] items-center border-b border-[#E5E8EB]">
                      <span className="text-[#0D1C17] text-sm font-normal font-['Lexend'] leading-[21px]">
                        Corn Seeds
                      </span>
                      <span className="text-[#45A180] text-sm font-normal font-['Lexend'] leading-[21px]">
                        SeedCo Genetics
                      </span>
                      <span className="text-[#45A180] text-sm font-normal font-['Lexend'] leading-[21px]">
                        2000 bags
                      </span>
                      <span className="text-[#45A180] text-sm font-normal font-['Lexend'] leading-[21px]">
                        Seasonal price advantage
                      </span>
                      <a
                        href="#"
                        className="text-[#45A180] text-sm font-bold font-['Lexend'] leading-[21px] cursor-pointer"
                      >
                        View Details
                      </a>
                    </div>
                    <div className="grid grid-cols-5 gap-4 p-4 min-h-[72px] items-center">
                      <span className="text-[#0D1C17] text-sm font-normal font-['Lexend'] leading-[21px]">
                        Pesticide X
                      </span>
                      <span className="text-[#45A180] text-sm font-normal font-['Lexend'] leading-[21px]">
                        CropGuard Inc.
                      </span>
                      <span className="text-[#45A180] text-sm font-normal font-['Lexend'] leading-[21px]">
                        100 gallons
                      </span>
                      <span className="text-[#45A180] text-sm font-normal font-['Lexend'] leading-[21px]">
                        Upcoming pest forecast
                      </span>
                      <a
                        href="#"
                        className="text-[#45A180] text-sm font-bold font-['Lexend'] leading-[21px] cursor-pointer"
                      >
                        View Details
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Market Trends */}
            <section>
              <h3 className="text-[#0D1C17] text-[22px] font-bold font-['Lexend'] leading-7 mb-6 px-4 pt-5 pb-3">
                Market Trends
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4">
                {/* Crop Yield Forecast */}
                <div className="border border-[#CCE8DE] rounded-xl p-6">
                  <h4 className="text-[#0D1C17] text-base font-medium font-['Lexend'] leading-6 mb-2">
                    Crop Yield Forecast
                  </h4>
                  <p className="text-[#0D1C17] text-[32px] font-bold font-['Lexend'] leading-10 mb-2">
                    +5%
                  </p>
                  <div className="flex items-center gap-1 mb-4">
                    <span className="text-[#45A180] text-base font-normal font-['Lexend'] leading-6">
                      vs. Last Year
                    </span>
                    <span className="text-[#08872E] text-base font-medium font-['Lexend'] leading-6">
                      +5%
                    </span>
                  </div>
                  {/* Chart SVG */}
                  <div className="mb-8">
                    <svg
                      className="w-full h-[148px]"
                      viewBox="0 0 380 148"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g clipPath="url(#clip0_1_1195)">
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M2.38494 86.6527C16.8168 86.6527 16.8168 16.6946 31.2488 16.6946C45.6807 16.6946 45.6807 32.5941 60.1127 32.5941C74.5445 32.5941 74.5445 73.9331 88.9764 73.9331C103.408 73.9331 103.408 26.2343 117.841 26.2343C132.273 26.2343 132.273 80.2929 146.704 80.2929C161.136 80.2929 161.136 48.4937 175.568 48.4937C190 48.4937 190 35.7741 204.432 35.7741C218.864 35.7741 218.864 96.1925 233.296 96.1925C247.727 96.1925 247.727 118.452 262.159 118.452C276.591 118.452 276.592 0.794979 291.024 0.794979C305.456 0.794979 305.456 64.3933 319.888 64.3933C334.319 64.3933 334.319 102.552 348.751 102.552C363.183 102.552 363.183 19.8745 377.615 19.8745V118.452H262.159H2.38494V86.6527Z"
                          fill="url(#paint0_linear_1_1195)"
                        />
                        <path
                          d="M2.38494 86.6527C16.8168 86.6527 16.8168 16.6946 31.2488 16.6946C45.6807 16.6946 45.6807 32.5941 60.1127 32.5941C74.5446 32.5941 74.5445 73.9331 88.9764 73.9331C103.408 73.9331 103.408 26.2343 117.841 26.2343C132.273 26.2343 132.273 80.2929 146.704 80.2929C161.136 80.2929 161.136 48.4937 175.568 48.4937C190 48.4937 190 35.7741 204.432 35.7741C218.864 35.7741 218.864 96.1925 233.296 96.1925C247.727 96.1925 247.727 118.452 262.159 118.452C276.592 118.452 276.592 0.794979 291.024 0.794979C305.456 0.794979 305.456 64.3933 319.888 64.3933C334.319 64.3933 334.319 102.552 348.751 102.552C363.183 102.552 363.183 19.8745 377.615 19.8745"
                          stroke="#45A180"
                          strokeWidth="3"
                        />
                      </g>
                      <defs>
                        <linearGradient
                          id="paint0_linear_1_1195"
                          x1="-190"
                          y1="0"
                          x2="-190"
                          y2="148"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop stopColor="#E6F5F0" />
                          <stop
                            offset="0.5"
                            stopColor="#E6F5F0"
                            stopOpacity="0"
                          />
                        </linearGradient>
                        <clipPath id="clip0_1_1195">
                          <rect width="380" height="148" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                  </div>
                  <div className="flex justify-between text-[13px] font-bold text-[#45A180] font-['Lexend'] leading-5">
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                    <span>Jun</span>
                    <span>Jul</span>
                  </div>
                </div>

                {/* Supply Price Index */}
                <div className="border border-[#CCE8DE] rounded-xl p-6">
                  <h4 className="text-[#0D1C17] text-base font-medium font-['Lexend'] leading-6 mb-2">
                    Supply Price Index
                  </h4>
                  <p className="text-[#0D1C17] text-[32px] font-bold font-['Lexend'] leading-10 mb-2">
                    -2%
                  </p>
                  <div className="flex items-center gap-1 mb-4">
                    <span className="text-[#45A180] text-base font-normal font-['Lexend'] leading-6">
                      vs. Last Month
                    </span>
                    <span className="text-[#E82E08] text-base font-medium font-['Lexend'] leading-6">
                      -2%
                    </span>
                  </div>
                  {/* Bar Chart */}
                  <div className="flex items-end gap-6 h-[137px] px-3 mb-6">
                    {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"].map(
                      (month, index) => (
                        <div
                          key={month}
                          className="flex flex-col items-center gap-6 flex-1"
                        >
                          <div className="bg-[#E5F5F0] border-t-2 border-[#757575] w-full h-[137px]"></div>
                        </div>
                      ),
                    )}
                  </div>
                  <div className="flex justify-between text-[13px] font-bold text-[#45A180] font-['Lexend'] leading-5">
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                    <span>Jun</span>
                    <span>Jul</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
