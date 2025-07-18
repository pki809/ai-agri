import React, { useState } from 'react';
import { Camera, Upload, Eye, MapPin, Calendar } from 'lucide-react';

const CropMonitoring = () => {
  const [selectedField, setSelectedField] = useState('field-a');

  const fields = [
    { id: 'field-a', name: 'Field A - Wheat', area: '25 acres', status: 'Healthy' },
    { id: 'field-b', name: 'Field B - Corn', area: '30 acres', status: 'Needs Attention' },
    { id: 'field-c', name: 'Field C - Rice', area: '20 acres', status: 'Excellent' },
  ];

  const cropData = {
    'field-a': {
      growth_stage: 'Flowering',
      health_score: 85,
      ndvi: 0.72,
      last_inspection: '2024-01-15',
      issues: ['Minor nutrient deficiency in northeast corner'],
      recommendations: ['Apply nitrogen fertilizer', 'Monitor for pest activity']
    },
    'field-b': {
      growth_stage: 'Vegetative',
      health_score: 68,
      ndvi: 0.58,
      last_inspection: '2024-01-14',
      issues: ['Water stress detected', 'Uneven growth pattern'],
      recommendations: ['Increase irrigation frequency', 'Soil analysis recommended']
    },
    'field-c': {
      growth_stage: 'Maturity',
      health_score: 92,
      ndvi: 0.81,
      last_inspection: '2024-01-16',
      issues: [],
      recommendations: ['Prepare for harvest', 'Monitor weather conditions']
    }
  };

  const currentData = cropData[selectedField as keyof typeof cropData];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Crop Monitoring</h1>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            <Camera className="h-4 w-4" />
            <span>Take Photo</span>
          </button>
          <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Upload className="h-4 w-4" />
            <span>Upload Image</span>
          </button>
        </div>
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
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{field.name}</h4>
                  <p className="text-sm text-gray-500">{field.area}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  field.status === 'Excellent' ? 'bg-green-100 text-green-800' :
                  field.status === 'Healthy' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {field.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Field Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Field Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Growth Stage:</span>
              <span className="font-medium">{currentData.growth_stage}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Health Score:</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      currentData.health_score >= 80 ? 'bg-green-500' :
                      currentData.health_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${currentData.health_score}%` }}
                  ></div>
                </div>
                <span className="font-medium">{currentData.health_score}%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">NDVI Index:</span>
              <span className="font-medium">{currentData.ndvi}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Last Inspection:</span>
              <span className="font-medium">{currentData.last_inspection}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Satellite View</h3>
          <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Satellite imagery loading...</p>
            </div>
          </div>
        </div>
      </div>

      {/* Issues and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Issues</h3>
          {currentData.issues.length > 0 ? (
            <ul className="space-y-2">
              {currentData.issues.map((issue, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <span className="text-gray-700">{issue}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-green-600">No issues detected</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
          <ul className="space-y-2">
            {currentData.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <span className="text-gray-700">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CropMonitoring;