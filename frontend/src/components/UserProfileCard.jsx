import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { formatRelativeTime, getRiskScoreColor, getRiskScoreLabel } from '../utils/formatters';
import { User, Shield, Activity, AlertTriangle, TrendingUp, Eye, Clock } from 'lucide-react';

const UserProfileCard = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for demonstration
    const mockUsers = [
      {
        id: 'user_001',
        username: 'john.doe',
        role: 'Senior Developer',
        department: 'Engineering',
        risk_score: 0.15,
        last_activity: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        total_events: 1247,
        total_alerts: 3,
        is_flagged: false,
      },
      {
        id: 'user_002',
        username: 'jane.smith',
        role: 'Data Analyst',
        department: 'Analytics',
        risk_score: 0.65,
        last_activity: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        total_events: 892,
        total_alerts: 12,
        is_flagged: true,
      },
      {
        id: 'user_003',
        username: 'mike.wilson',
        role: 'System Admin',
        department: 'IT',
        risk_score: 0.85,
        last_activity: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        total_events: 2156,
        total_alerts: 8,
        is_flagged: true,
      },
    ];

    setUsers(mockUsers);
    setSelectedUser(mockUsers[1]); // Default to jane.smith (high risk)
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-700 rounded w-1/2 mb-4"></div>
          <div className="h-20 bg-slate-700 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-slate-700 rounded"></div>
            <div className="h-3 bg-slate-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  const getRiskColor = (score) => {
    if (score >= 0.8) return 'text-threat-critical';
    if (score >= 0.6) return 'text-threat-high';
    if (score >= 0.4) return 'text-threat-medium';
    return 'text-threat-low';
  };

  const getRiskBgColor = (score) => {
    if (score >= 0.8) return 'bg-threat-critical/20 border-threat-critical';
    if (score >= 0.6) return 'bg-threat-high/20 border-threat-high';
    if (score >= 0.4) return 'bg-threat-medium/20 border-threat-medium';
    return 'bg-threat-low/20 border-threat-low';
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-cyber-accent/20 rounded-lg">
            <User className="w-5 h-5 text-cyber-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">User Profile</h3>
            <p className="text-sm text-gray-400">Risk assessment & activity</p>
          </div>
        </div>
        <Link
          to="/users"
          className="text-cyber-accent hover:text-cyber-glow transition-colors text-sm"
        >
          <Eye className="w-4 h-4" />
        </Link>
      </div>

      {/* User Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select User
        </label>
        <select
          value={selectedUser?.id || ''}
          onChange={(e) => {
            const user = users.find(u => u.id === e.target.value);
            setSelectedUser(user);
          }}
          className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyber-accent"
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.username} ({user.department})
            </option>
          ))}
        </select>
      </div>

      {selectedUser && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* User Info */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-cyber-accent to-cyber-glow rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-white">{selectedUser.username}</h4>
              <p className="text-sm text-gray-400">{selectedUser.role}</p>
              <p className="text-xs text-gray-500">{selectedUser.department}</p>
            </div>
            {selectedUser.is_flagged && (
              <div className="p-2 bg-threat-high/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-threat-high" />
              </div>
            )}
          </div>

          {/* Risk Score */}
          <div className={`p-4 rounded-lg border ${getRiskBgColor(selectedUser.risk_score)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-300">Risk Score</span>
              <span className={`text-lg font-bold ${getRiskColor(selectedUser.risk_score)}`}>
                {(selectedUser.risk_score * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <motion.div
                className={`h-2 rounded-full ${
                  selectedUser.risk_score >= 0.8 ? 'bg-threat-critical' :
                  selectedUser.risk_score >= 0.6 ? 'bg-threat-high' :
                  selectedUser.risk_score >= 0.4 ? 'bg-threat-medium' :
                  'bg-threat-low'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${selectedUser.risk_score * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Risk Level: {getRiskScoreLabel(selectedUser.risk_score)}
            </p>
          </div>

          {/* Activity Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-700/30 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <Activity className="w-4 h-4 text-cyber-accent" />
                <span className="text-xs text-gray-400">Total Events</span>
              </div>
              <div className="text-lg font-semibold text-white">
                {selectedUser.total_events.toLocaleString()}
              </div>
            </div>
            <div className="p-3 bg-slate-700/30 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-threat-high" />
                <span className="text-xs text-gray-400">Alerts</span>
              </div>
              <div className="text-lg font-semibold text-white">
                {selectedUser.total_alerts}
              </div>
            </div>
          </div>

          {/* Last Activity */}
          <div className="p-3 bg-slate-700/30 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">Last Activity</span>
            </div>
            <div className="text-sm text-white">
              {formatRelativeTime(selectedUser.last_activity)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Link
              to={`/timeline/${selectedUser.id}`}
              className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 bg-cyber-accent/20 text-cyber-accent rounded-lg hover:bg-cyber-accent/30 transition-colors text-sm"
            >
              <TrendingUp className="w-4 h-4" />
              <span>View Timeline</span>
            </Link>
            <button className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 bg-slate-700/50 text-gray-300 rounded-lg hover:bg-slate-700 transition-colors text-sm">
              <Shield className="w-4 h-4" />
              <span>Investigate</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default UserProfileCard;
