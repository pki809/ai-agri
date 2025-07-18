import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import SupplyDetails from "./pages/SupplyDetails";
import Layout from "./components/Layout";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/supplies" element={<SupplyDetails />} />

            {/* Placeholder routes for future weeks */}
            <Route
              path="/customers"
              element={<ComingSoon page="Customer Analytics" week="Week 2" />}
            />
            <Route
              path="/market-trends"
              element={<ComingSoon page="Market Trends" week="Week 2" />}
            />
            <Route
              path="/alerts"
              element={<ComingSoon page="Real-time Alerts" week="Week 3" />}
            />
            <Route
              path="/account"
              element={<ComingSoon page="Account Settings" week="Week 3" />}
            />
            <Route
              path="/signin"
              element={<ComingSoon page="Authentication" week="Week 4" />}
            />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

// Coming Soon component for future features
function ComingSoon({ page, week }: { page: string; week: string }) {
  return (
    <div className="flex items-center justify-center min-h-[600px]">
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
          <svg
            className="w-12 h-12 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{page}</h3>
        <p className="text-gray-600 mb-4">Coming in {week}</p>
        <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
          In Development
        </div>
      </div>
    </div>
  );
}

export default App;
