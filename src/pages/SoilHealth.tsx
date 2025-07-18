import React, { useState } from 'react';
import { TestTube, Droplets, Zap, Leaf, MapPin, Calendar } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const SoilHealth = () => {
  const [selectedField, setSelectedField] = useState('field-a');

  const fields = [
    { id: 'field-a', name: 'Field A', area: '25 acres' },
    { id: 'field-b', name: 'Field B', area: '30 acres' },
    { id: 'field-c', name: 'Field C', area: '20 acres' },
  ];

  const soilData = {
    'field-a': {
      ph: 6.8,
      moisture: 68,
      temperature: 22,
      nitrogen: 85,
      phosphorus: 72,
      potassium: 78,
      organic_matter: 3.2,
      last_test: '2024-01-10'
    },
    'field-b': {
      ph: 7.2,
      moisture: 45,
      temperature: 24,
      nitrogen: 62,
      phosphorus: 58,
      potassium: 65,
      organic_matter: 2.8,
      last_test: '2024-01-08'
    },
    'field-c': {
      ph: 6.5,
      moisture: 72,
      temperature: 21,
      nitrogen: 78,
      phosphorus: 82,
      potassium: 88,
      organic_matter: 3.8,
      last_test: '2024-01-12'
    }
  };

  const currentData = soilData[selectedField as keyof typeof soilData];

  const nutrientData = [
    { name: 'Nitrogen', value: currentData.nitrogen, fill: '#10b981' },
    { name: 'Phosphorus', value: currentData.phosphorus, fill: '#f59e0b' },
    { name: 'Potassium', value: currentData.potassium, fill: '#ef4444' },
  ];

  const historicalData = [
    { month: 'Jan', ph: 6.5, nitrogen: 75, phosphorus: 68, potassium: 72 },
    { month: 'Feb', ph: 6.6, nitrogen: 78, phosphorus: 70, potassium: 74 },
    { month: 'Mar', ph: 6.7, nitrogen: 82, phosphorus: 72, potassium: 76 },
    { month: 'Apr', ph: 6.8, nitrogen: 85, phosphorus: 72, potassium: 78 },
  ];

  const getHealthStatus = (value: number) => {
    if (value >= 80) return { status: 'Excellent', color: 'text-green-600 bg-green-100' };
    if (value >= 60) return { status: 'Good', color: 'text-blue-600 bg-blue-100' };
    if (value >= 40) return { status: 'Fair', color: 'text-yellow-600 bg-yellow-100' };
    return { status: 'Poor', color: 'text-red-600 bg-red-100' };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Soil Health Analysis</h1>
        <button className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
          <TestTube className="h-4 w-4" />
          <span>Schedule Test</span>
        </button>
      </div>

      {/* Field Selection */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Field</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {fields.map((field) => (
            <div
              key={field.id}
              onClick={() => setSelectedField(field.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                selectedField === field.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h4 className="font-medium text-gray-900">{field.name}</h4>
              <p className="text-sm text-gray-500">{field.area}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">pH Level</p>
              <p className="text-2xl font-bold text-gray-900">{currentData.ph}</p>
              <p className="text-xs text-gray-500">Optimal: 6.0-7.0</p>
            </div>
            <TestTube className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Moisture</p>
              <p className="text-2xl font-bold text-gray-900">{currentData.moisture}%</p>
              <p className="text-xs text-gray-500">Optimal: 60-80%</p>
            </div>
            <Droplets className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Temperature</p>
              <p className="text-2xl font-bold text-gray-900">{currentData.temperature}°C</p>
              <p className="text-xs text-gray-500">Current soil temp</p>
            </div>
            <Zap className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Organic Matter</p>
              <p className="text-2xl font-bold text-gray-900">{currentData.organic_matter}%</p>
              <p className="text-xs text-gray-500">Target: >3%</p>
            </div>
            <Leaf className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Nutrient Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Nutrient Levels</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={nutrientData}>
              <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
              <Tooltip />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-4 mt-4">
            {nutrientData.map((nutrient) => {
              const health = getHealthStatus(nutrient.value);
              return (
                <div key={nutrient.name} className="text-center">
                  <p className="text-sm font-medium text-gray-600">{nutrient.name}</p>
                  <p className="text-lg font-bold" style={{ color: nutrient.fill }}>{nutrient.value}%</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${health.color}`}>
                    {health.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Historical Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="nitrogen" fill="#10b981" />
              <Bar dataKey="phosphorus" fill="#f59e0b" />
              <Bar dataKey="potassium" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Soil Health Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Immediate Actions</h4>
            <ul className="space-y-2">
              <li className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <span className="text-gray-700">Apply nitrogen fertilizer to boost levels</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <span className="text-gray-700">Monitor soil moisture levels closely</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <span className="text-gray-700">pH levels are optimal - maintain current practices</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Long-term Improvements</h4>
            <ul className="space-y-2">
              <li className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <span className="text-gray-700">Implement crop rotation to improve soil structure</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <span className="text-gray-700">Add organic compost to increase organic matter</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                <span className="text-gray-700">Consider cover crops during off-season</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Last soil test: {currentData.last_test}</span>
            <span className="mx-2">•</span>
            <span>Next recommended test: {new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoilHealth;