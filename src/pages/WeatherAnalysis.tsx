import React from 'react';
import { Cloud, Sun, CloudRain, Wind, Thermometer, Droplets } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const WeatherAnalysis = () => {
  const weeklyForecast = [
    { day: 'Today', temp: 26, humidity: 72, precipitation: 0, condition: 'sunny' },
    { day: 'Tomorrow', temp: 24, humidity: 78, precipitation: 20, condition: 'cloudy' },
    { day: 'Wed', temp: 22, humidity: 85, precipitation: 60, condition: 'rainy' },
    { day: 'Thu', temp: 25, humidity: 70, precipitation: 10, condition: 'partly-cloudy' },
    { day: 'Fri', temp: 28, humidity: 65, precipitation: 0, condition: 'sunny' },
    { day: 'Sat', temp: 27, humidity: 68, precipitation: 5, condition: 'sunny' },
    { day: 'Sun', temp: 26, humidity: 72, precipitation: 15, condition: 'partly-cloudy' },
  ];

  const hourlyData = [
    { time: '00:00', temp: 22, humidity: 80 },
    { time: '03:00', temp: 20, humidity: 85 },
    { time: '06:00', temp: 23, humidity: 78 },
    { time: '09:00', temp: 26, humidity: 70 },
    { time: '12:00', temp: 29, humidity: 65 },
    { time: '15:00', temp: 31, humidity: 60 },
    { time: '18:00', temp: 28, humidity: 68 },
    { time: '21:00', temp: 25, humidity: 75 },
  ];

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny':
        return <Sun className="h-8 w-8 text-yellow-500" />;
      case 'cloudy':
        return <Cloud className="h-8 w-8 text-gray-500" />;
      case 'rainy':
        return <CloudRain className="h-8 w-8 text-blue-500" />;
      case 'partly-cloudy':
        return <Cloud className="h-8 w-8 text-gray-400" />;
      default:
        return <Sun className="h-8 w-8 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Weather Analysis</h1>
        <div className="text-sm text-gray-500">
          Location: Farm Location • Updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Current Weather */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-8 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Current Weather</h2>
            <div className="flex items-center space-x-4">
              <div className="text-4xl font-bold">26°C</div>
              <div>
                <p className="text-blue-100">Partly Cloudy</p>
                <p className="text-blue-100">Feels like 28°C</p>
              </div>
            </div>
          </div>
          <Sun className="h-16 w-16 text-yellow-300" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="flex items-center space-x-2">
            <Wind className="h-5 w-5" />
            <div>
              <p className="text-sm text-blue-100">Wind</p>
              <p className="font-semibold">12 km/h</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Droplets className="h-5 w-5" />
            <div>
              <p className="text-sm text-blue-100">Humidity</p>
              <p className="font-semibold">72%</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <CloudRain className="h-5 w-5" />
            <div>
              <p className="text-sm text-blue-100">Precipitation</p>
              <p className="font-semibold">0%</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Thermometer className="h-5 w-5" />
            <div>
              <p className="text-sm text-blue-100">UV Index</p>
              <p className="font-semibold">6 (High)</p>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Forecast */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">7-Day Forecast</h3>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weeklyForecast.map((day, index) => (
            <div key={index} className="text-center p-4 rounded-lg bg-gray-50">
              <p className="font-medium text-gray-900 mb-2">{day.day}</p>
              <div className="flex justify-center mb-2">
                {getWeatherIcon(day.condition)}
              </div>
              <p className="text-lg font-bold text-gray-900">{day.temp}°C</p>
              <p className="text-sm text-gray-600">{day.humidity}% humidity</p>
              <p className="text-sm text-blue-600">{day.precipitation}% rain</p>
            </div>
          ))}
        </div>
      </div>

      {/* Hourly Forecast */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">24-Hour Forecast</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="temp" stroke="#ef4444" fill="#fef2f2" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Weather Alerts */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weather Alerts & Recommendations</h3>
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
            <div className="flex items-center">
              <CloudRain className="h-5 w-5 text-yellow-600 mr-2" />
              <h4 className="font-medium text-yellow-800">Rain Expected Tomorrow</h4>
            </div>
            <p className="text-yellow-700 mt-1">60% chance of precipitation. Consider postponing field operations.</p>
          </div>
          
          <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
            <div className="flex items-center">
              <Thermometer className="h-5 w-5 text-blue-600 mr-2" />
              <h4 className="font-medium text-blue-800">Optimal Growing Conditions</h4>
            </div>
            <p className="text-blue-700 mt-1">Temperature and humidity levels are ideal for crop growth this week.</p>
          </div>
          
          <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-lg">
            <div className="flex items-center">
              <Sun className="h-5 w-5 text-green-600 mr-2" />
              <h4 className="font-medium text-green-800">Good Harvesting Weather</h4>
            </div>
            <p className="text-green-700 mt-1">Clear skies expected for the weekend - perfect for harvesting activities.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherAnalysis;