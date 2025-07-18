import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Menu, X } from "lucide-react";

export default function SupplyDetails() {
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
                to="/orders"
                className="text-[#0D1C17] text-sm font-normal font-['Lexend'] hover:text-[#45A180]"
              >
                Orders
              </Link>
              <Link
                to="/analytics"
                className="text-[#0D1C17] text-sm font-normal font-['Lexend'] hover:text-[#45A180]"
              >
                Analytics
              </Link>
              <Link
                to="/settings"
                className="text-[#0D1C17] text-sm font-normal font-['Lexend'] hover:text-[#45A180]"
              >
                Settings
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
              src="https://api.builder.io/api/v1/image/assets/TEMP/ac63d6656f0d5680e82b0e05c278c86945f01652?width=80"
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
                to="/orders"
                className="text-[#0D1C17] text-sm font-normal font-['Lexend'] hover:text-[#45A180] py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Orders
              </Link>
              <Link
                to="/analytics"
                className="text-[#0D1C17] text-sm font-normal font-['Lexend'] hover:text-[#45A180] py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Analytics
              </Link>
              <Link
                to="/settings"
                className="text-[#0D1C17] text-sm font-normal font-['Lexend'] hover:text-[#45A180] py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Settings
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 px-5 sm:px-20 lg:px-40 py-5">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header Section */}
          <div className="px-4 py-4">
            <h2 className="text-[#0D1C17] text-[32px] font-bold font-['Lexend'] leading-10 mb-3">
              Supply Details
            </h2>
            <p className="text-[#45A180] text-sm font-normal font-['Lexend'] leading-[21px]">
              Detailed insights for each supply item, including inventory,
              pricing, and AI-driven forecasts.
            </p>
          </div>

          {/* Supply Overview */}
          <section>
            <h3 className="text-[#0D1C17] text-lg font-bold font-['Lexend'] leading-[23px] mb-2 px-4 pt-4 pb-2">
              Supply Overview
            </h3>
            <div className="px-4 py-3">
              <div className="bg-[#F7FCFA] border border-[#CCE8DE] rounded-xl overflow-hidden">
                {/* Table Header */}
                <div className="hidden sm:grid grid-cols-6 gap-4 p-4 bg-[#F7FCFA]">
                  <span className="text-[#0D1C17] text-sm font-medium font-['Lexend'] leading-[21px]">
                    Supply Name
                  </span>
                  <span className="text-[#0D1C17] text-sm font-medium font-['Lexend'] leading-[21px]">
                    Category
                  </span>
                  <span className="text-[#0D1C17] text-sm font-medium font-['Lexend'] leading-[21px]">
                    Current Inventory
                  </span>
                  <span className="text-[#0D1C17] text-sm font-medium font-['Lexend'] leading-[21px]">
                    Unit Price
                  </span>
                  <span className="text-[#0D1C17] text-sm font-medium font-['Lexend'] leading-[21px]">
                    Supplier
                  </span>
                  <span className="text-[#0D1C17] text-sm font-medium font-['Lexend'] leading-[21px]">
                    Last Updated
                  </span>
                </div>

                {/* Table Row */}
                <div className="border-t border-[#E5E8EB]">
                  {/* Mobile Card Layout */}
                  <div className="sm:hidden p-4">
                    <div className="space-y-2">
                      <div className="text-[#0D1C17] text-sm font-bold font-['Lexend']">
                        Nitrogen Fertilizer
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-[#0D1C17] font-medium font-['Lexend']">
                            Category:
                          </span>
                          <span className="text-[#45A180] font-['Lexend']">
                            {" "}
                            Fertilizers
                          </span>
                        </div>
                        <div>
                          <span className="text-[#0D1C17] font-medium font-['Lexend']">
                            Stock:
                          </span>
                          <span className="text-[#45A180] font-['Lexend']">
                            {" "}
                            5000 lbs
                          </span>
                        </div>
                        <div>
                          <span className="text-[#0D1C17] font-medium font-['Lexend']">
                            Price:
                          </span>
                          <span className="text-[#45A180] font-['Lexend']">
                            {" "}
                            $0.50/lb
                          </span>
                        </div>
                        <div>
                          <span className="text-[#0D1C17] font-medium font-['Lexend']">
                            Supplier:
                          </span>
                          <span className="text-[#45A180] font-['Lexend']">
                            {" "}
                            AgriChem Inc.
                          </span>
                        </div>
                      </div>
                      <div className="text-[#45A180] text-xs font-['Lexend']">
                        Updated: 2024-07-26
                      </div>
                    </div>
                  </div>
                  {/* Desktop Table Layout */}
                  <div className="hidden sm:grid grid-cols-6 gap-4 p-4 min-h-[72px] items-center">
                    <span className="text-[#0D1C17] text-sm font-normal font-['Lexend'] leading-[21px]">
                      Nitrogen Fertilizer
                    </span>
                    <span className="text-[#45A180] text-sm font-normal font-['Lexend'] leading-[21px]">
                      Fertilizers
                    </span>
                    <span className="text-[#45A180] text-sm font-normal font-['Lexend'] leading-[21px]">
                      5000 lbs
                    </span>
                    <span className="text-[#45A180] text-sm font-normal font-['Lexend'] leading-[21px]">
                      $0.50/lb
                    </span>
                    <span className="text-[#45A180] text-sm font-normal font-['Lexend'] leading-[21px]">
                      AgriChem Inc.
                    </span>
                    <span className="text-[#45A180] text-sm font-normal font-['Lexend'] leading-[21px]">
                      2024-07-26
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing Trends */}
          <section>
            <h3 className="text-[#0D1C17] text-lg font-bold font-['Lexend'] leading-[23px] mb-2 px-4 pt-4 pb-2">
              Pricing Trends
            </h3>
            <div className="px-4 py-6">
              <div className="border border-[#CCE8DE] rounded-xl p-6">
                <h4 className="text-[#0D1C17] text-base font-medium font-['Lexend'] leading-6 mb-2">
                  Price per Pound Over Time
                </h4>
                <p className="text-[#0D1C17] text-[32px] font-bold font-['Lexend'] leading-10 mb-2">
                  $0.50
                </p>
                <div className="flex items-center gap-1 mb-8">
                  <span className="text-[#45A180] text-base font-normal font-['Lexend'] leading-6">
                    Last 12 Months
                  </span>
                  <span className="text-[#08872E] text-base font-medium font-['Lexend'] leading-6">
                    +5%
                  </span>
                </div>
                {/* Chart SVG */}
                <div className="mb-8">
                  <svg
                    className="w-full h-[148px]"
                    viewBox="0 0 878 148"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g clipPath="url(#clip0_1_1346)">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M5.51046 200.213C38.8557 200.213 38.8557 38.5732 72.2012 38.5732C105.546 38.5732 105.546 75.3096 138.892 75.3096C172.237 75.3096 172.237 170.824 205.582 170.824C238.928 170.824 238.928 60.6151 272.274 60.6151C305.619 60.6151 305.619 185.519 338.963 185.519C372.309 185.519 372.309 112.046 405.654 112.046C439 112.046 439 82.6569 472.346 82.6569C505.691 82.6569 505.691 222.255 539.037 222.255C572.381 222.255 572.381 273.686 605.726 273.686C639.072 273.686 639.072 1.83682 672.418 1.83682C705.763 1.83682 705.763 148.782 739.109 148.782C772.453 148.782 772.453 236.95 805.798 236.95C839.144 236.95 839.144 45.9205 872.49 45.9205V273.686H605.726H5.51046V200.213Z"
                        fill="url(#paint0_linear_1_1346)"
                      />
                      <path
                        d="M5.51046 200.213C38.8557 200.213 38.8557 38.5732 72.2012 38.5732C105.546 38.5732 105.546 75.3096 138.892 75.3096C172.237 75.3096 172.237 170.824 205.582 170.824C238.928 170.824 238.928 60.6151 272.274 60.6151C305.619 60.6151 305.619 185.519 338.963 185.519C372.309 185.519 372.309 112.046 405.654 112.046C439 112.046 439 82.6569 472.346 82.6569C505.691 82.6569 505.691 222.255 539.037 222.255C572.381 222.255 572.381 273.686 605.726 273.686C639.072 273.686 639.072 1.83682 672.418 1.83682C705.763 1.83682 705.763 148.782 739.109 148.782C772.453 148.782 772.453 236.95 805.798 236.95C839.144 236.95 839.144 45.9205 872.49 45.9205"
                        stroke="#45A180"
                        strokeWidth="3"
                      />
                    </g>
                    <defs>
                      <linearGradient
                        id="paint0_linear_1_1346"
                        x1="-439"
                        y1="0"
                        x2="-439"
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
                      <clipPath id="clip0_1_1346">
                        <rect width="878" height="148" fill="white" />
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
            </div>
          </section>

          {/* Demand Forecast */}
          <section>
            <h3 className="text-[#0D1C17] text-lg font-bold font-['Lexend'] leading-[23px] mb-2 px-4 pt-4 pb-2">
              Demand Forecast
            </h3>
            <div className="px-4 py-6">
              <div className="border border-[#CCE8DE] rounded-xl p-6">
                <h4 className="text-[#0D1C17] text-base font-medium font-['Lexend'] leading-6 mb-2">
                  Projected Demand for Next 6 Months
                </h4>
                <p className="text-[#0D1C17] text-[32px] font-bold font-['Lexend'] leading-10 mb-2">
                  6000 lbs
                </p>
                <div className="flex items-center gap-1 mb-4">
                  <span className="text-[#45A180] text-base font-normal font-['Lexend'] leading-6">
                    Next 6 Months
                  </span>
                  <span className="text-[#08872E] text-base font-medium font-['Lexend'] leading-6">
                    +10%
                  </span>
                </div>
                {/* Bar Chart */}
                <div className="flex items-end gap-6 h-[137px] px-3 mb-6">
                  {["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"].map(
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
                  <span>Aug</span>
                  <span>Sep</span>
                  <span>Oct</span>
                  <span>Nov</span>
                  <span>Dec</span>
                  <span>Jan</span>
                </div>
              </div>
            </div>
          </section>

          {/* AI Insights */}
          <section>
            <h3 className="text-[#0D1C17] text-lg font-bold font-['Lexend'] leading-[23px] mb-2 px-4 pt-4 pb-2">
              AI Insights
            </h3>
            <div className="px-4 py-1 pb-3">
              <p className="text-[#0D1C17] text-base font-normal font-['Lexend'] leading-6">
                Based on current market trends and consumer demand, the optimal
                time to purchase Nitrogen Fertilizer is in late August to early
                September. Prices are expected to be slightly lower due to
                seasonal factors, and demand is projected to increase in the
                following months. Consider purchasing around 6000 lbs to meet
                anticipated needs.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
