import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import CropMonitoring from './pages/CropMonitoring';
import WeatherAnalysis from './pages/WeatherAnalysis';
import SoilHealth from './pages/SoilHealth';
import PestDetection from './pages/PestDetection';
import YieldPrediction from './pages/YieldPrediction';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/crop-monitoring" element={<CropMonitoring />} />
            <Route path="/weather" element={<WeatherAnalysis />} />
            <Route path="/soil-health" element={<SoilHealth />} />
            <Route path="/pest-detection" element={<PestDetection />} />
            <Route path="/yield-prediction" element={<YieldPrediction />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;