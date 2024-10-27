import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Settings, Activity, Cpu, Network, ThermometerSun, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

const socket = io('http://localhost:3001');

interface MetricData {
  timestamp: number;
  cpuUsage: number;
  memoryUsage: number;
  temperature: number;
  interfaceUtilization: number;
}

function App() {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [config, setConfig] = useState({
    host: '192.168.1.1',
    username: 'admin',
    authKey: 'authpassword',
    privKey: 'privpassword',
    authProtocol: 'SHA',
    privProtocol: 'AES'
  });
  const [isConfiguring, setIsConfiguring] = useState(true);

  useEffect(() => {
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('metrics', (data: MetricData) => {
      setMetrics(prev => [...prev.slice(-30), data]);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('metrics');
    };
  }, []);

  const handleStartMonitoring = () => {
    socket.emit('startMonitoring', config);
    setIsConfiguring(false);
  };

  if (isConfiguring) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-6">
            <Settings className="w-6 h-6 text-indigo-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">Switch Configuration</h1>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Switch IP Address</label>
              <input
                type="text"
                value={config.host}
                onChange={e => setConfig(prev => ({ ...prev, host: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                value={config.username}
                onChange={e => setConfig(prev => ({ ...prev, username: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Auth Key</label>
              <input
                type="password"
                value={config.authKey}
                onChange={e => setConfig(prev => ({ ...prev, authKey: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Priv Key</label>
              <input
                type="password"
                value={config.privKey}
                onChange={e => setConfig(prev => ({ ...prev, privKey: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <button
              onClick={handleStartMonitoring}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Start Monitoring
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Activity className="w-6 h-6 text-indigo-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Cisco Switch Monitor</h1>
            </div>
            <div className="flex items-center">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CPU Usage Chart */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-4">
                <Cpu className="w-5 h-5 text-indigo-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">CPU Usage</h2>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp"
                      tickFormatter={(timestamp) => format(timestamp, 'HH:mm:ss')}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(timestamp) => format(timestamp, 'HH:mm:ss')}
                      formatter={(value) => [`${value}%`, 'CPU Usage']}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="cpuUsage" stroke="#4f46e5" name="CPU %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Memory Usage Chart */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-4">
                <Activity className="w-5 h-5 text-indigo-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Memory Usage</h2>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp"
                      tickFormatter={(timestamp) => format(timestamp, 'HH:mm:ss')}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(timestamp) => format(timestamp, 'HH:mm:ss')}
                      formatter={(value) => [`${value}%`, 'Memory Usage']}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="memoryUsage" stroke="#2563eb" name="Memory %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Temperature Chart */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-4">
                <ThermometerSun className="w-5 h-5 text-indigo-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Temperature</h2>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp"
                      tickFormatter={(timestamp) => format(timestamp, 'HH:mm:ss')}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(timestamp) => format(timestamp, 'HH:mm:ss')}
                      formatter={(value) => [`${value}°C`, 'Temperature']}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="temperature" stroke="#dc2626" name="Temperature °C" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Interface Utilization Chart */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-4">
                <Network className="w-5 h-5 text-indigo-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Interface Utilization</h2>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp"
                      tickFormatter={(timestamp) => format(timestamp, 'HH:mm:ss')}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(timestamp) => format(timestamp, 'HH:mm:ss')}
                      formatter={(value) => [`${value}%`, 'Utilization']}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="interfaceUtilization" stroke="#059669" name="Interface %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;