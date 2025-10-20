import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { apiService } from '../services/api';
import { formatDateTime, formatRelativeTime, getThreatLevelColor } from '../utils/formatters';
import { ArrowLeft, User, Clock, Activity, AlertTriangle, TrendingUp, Eye } from 'lucide-react';

const UserTimeline = () => {
  const { userId } = useParams();
  const [timelineData, setTimelineData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('24');

  useEffect(() => {
    fetchTimelineData();
  }, [userId, timeRange]);

  const fetchTimelineData = async () => {
    try {
      setLoading(true);
      const data = await apiService.getUserTimeline(userId, parseInt(timeRange));
      setTimelineData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-darker p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-64 bg-slate-700 rounded"></div>
                <div className="h-32 bg-slate-700 rounded"></div>
              </div>
              <div className="space-y-4">
                <div className="h-48 bg-slate-700 rounded"></div>
                <div className="h-32 bg-slate-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cyber-darker p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-threat-critical mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Error Loading Timeline</h2>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={fetchTimelineData}
              className="px-4 py-2 bg-cyber-accent text-white rounded-lg hover:bg-cyber-accent/80 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mock data for demonstration
  const mockTimelineData = {
    user_id: userId,
    total_events: 1247,
    total_alerts: 8,
    events: [
      { timestamp: '2024-01-20T10:00:00Z', event_type: 'login_success', src_ip: '192.168.1.100' },
      { timestamp: '2024-01-20T10:15:00Z', event_type: 'file_access', file_name: 'confidential.pdf' },
      { timestamp: '2024-01-20T10:30:00Z', event_type: 'file_transfer', bytes_transferred: 5242880 },
      { timestamp: '2024-01-20T11:00:00Z', event_type: 'login_success', src_ip: '192.168.1.100' },
      { timestamp: '2024-01-20T11:15:00Z', event_type: 'file_access', file_name: 'sensitive.xlsx' },
    ],
    alerts: [
      { id: 1, timestamp: '2024-01-20T10:15:00Z', threat_level: 'high', description: 'Unusual file access pattern' },
      { id: 2, timestamp: '2024-01-20T10:30:00Z', threat_level: 'critical', description: 'Large file transfer detected' },
    ],
    hourly_stats: [
      { hour: '00:00', events: 12, alerts: 0 },
      { hour: '01:00', events: 8, alerts: 0 },
      { hour: '02:00', events: 5, alerts: 0 },
      { hour: '03:00', events: 3, alerts: 0 },
      { hour: '04:00', events: 7, alerts: 0 },
      { hour: '05:00', events: 15, alerts: 0 },
      { hour: '06:00', events: 23, alerts: 0 },
      { hour: '07:00', events: 45, alerts: 1 },
      { hour: '08:00', events: 78, alerts: 0 },
      { hour: '09:00', events: 92, alerts: 0 },
      { hour: '10:00', events: 156, alerts: 2 },
      { hour: '11:00', events: 134, alerts: 1 },
      { hour: '12:00', events: 98, alerts: 0 },
      { hour: '13:00', events: 87, alerts: 0 },
      { hour: '14:00', events: 112, alerts: 1 },
      { hour: '15:00', events: 145, alerts: 0 },
      { hour: '16:00', events: 167, alerts: 2 },
      { hour: '17:00', events: 134, alerts: 0 },
      { hour: '18:00', events: 89, alerts: 0 },
      { hour: '19:00', events: 56, alerts: 0 },
      { hour: '20:00', events: 34, alerts: 0 },
      { hour: '21:00', events: 23, alerts: 0 },
      { hour: '22:00', events: 18, alerts: 0 },
      { hour: '23:00', events: 12, alerts: 0 },
    ],
  };

  const data = timelineData || mockTimelineData;

  return (
    <div className="min-h-screen bg-cyber-darker p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-4 mb-4">
            <Link
              to="/dashboard"
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyber-accent to-cyber-glow rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{data.user_id}</h1>
                <p className="text-gray-400">User Activity Timeline</p>
              </div>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">Time Range:</span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-1 bg-slate-700/50 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyber-accent"
            >
              <option value="1">Last Hour</option>
              <option value="6">Last 6 Hours</option>
              <option value="24">Last 24 Hours</option>
              <option value="168">Last Week</option>
            </select>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-cyber-accent/20 rounded-lg">
                <Activity className="w-5 h-5 text-cyber-accent" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Events</p>
                <p className="text-2xl font-bold text-white">{data.total_events.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-threat-high/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-threat-high" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Alerts</p>
                <p className="text-2xl font-bold text-white">{data.total_alerts}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-threat-critical/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-threat-critical" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Risk Score</p>
                <p className="text-2xl font-bold text-white">85%</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-threat-medium/20 rounded-lg">
                <Clock className="w-5 h-5 text-threat-medium" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Last Activity</p>
                <p className="text-sm font-semibold text-white">
                  {formatRelativeTime(data.events[data.events.length - 1]?.timestamp)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Charts and Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Activity Chart */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Activity Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.hourly_stats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="hour" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="events"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="alerts"
                    stroke="#dc2626"
                    strokeWidth={2}
                    dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Recent Events */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Recent Events</h3>
              <div className="space-y-3">
                {data.events.slice(-10).map((event, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-cyber-accent rounded-full"></div>
                      <div>
                        <p className="text-sm text-white">{event.event_type.replace('_', ' ')}</p>
                        <p className="text-xs text-gray-400">
                          {formatDateTime(event.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {event.src_ip && (
                        <p className="text-xs text-gray-400">{event.src_ip}</p>
                      )}
                      {event.file_name && (
                        <p className="text-xs text-gray-400">{event.file_name}</p>
                      )}
                      {event.bytes_transferred && (
                        <p className="text-xs text-gray-400">
                          {(event.bytes_transferred / 1024 / 1024).toFixed(1)} MB
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Alerts and Activity Summary */}
          <div className="space-y-6">
            {/* Recent Alerts */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Recent Alerts</h3>
              <div className="space-y-3">
                {data.alerts.map((alert) => {
                  const threatColors = getThreatLevelColor(alert.threat_level);
                  return (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg border ${threatColors.bg} ${threatColors.border}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${threatColors.text}`}>
                          {alert.threat_level.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatRelativeTime(alert.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-white">{alert.description}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Activity Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Activity Summary</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Login Events</span>
                    <span className="text-white">45%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-cyber-accent h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">File Access</span>
                    <span className="text-white">30%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-threat-high h-2 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Data Transfer</span>
                    <span className="text-white">25%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-threat-critical h-2 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserTimeline;
