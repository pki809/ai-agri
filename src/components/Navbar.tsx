import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Sprout, 
  Cloud, 
  TestTube, 
  Bug, 
  TrendingUp,
  Leaf
} from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/crop-monitoring', label: 'Crop Monitoring', icon: Sprout },
    { path: '/weather', label: 'Weather', icon: Cloud },
    { path: '/soil-health', label: 'Soil Health', icon: TestTube },
    { path: '/pest-detection', label: 'Pest Detection', icon: Bug },
    { path: '/yield-prediction', label: 'Yield Prediction', icon: TrendingUp },
  ];

  return (
    <nav className="bg-green-600 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-2">
            <Leaf className="h-8 w-8 text-white" />
            <span className="text-white text-xl font-bold">AI Agriculture</span>
          </div>
          
          <div className="hidden md:flex space-x-6">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === path
                    ? 'bg-green-700 text-white'
                    : 'text-green-100 hover:bg-green-500 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;