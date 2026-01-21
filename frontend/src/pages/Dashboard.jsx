import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiService } from '../services/api';
import { formatNumber, formatRelativeTime, getThreatLevelColor } from '../utils/formatters';
import LiveAlertsFeed from '../components/LiveAlertsFeed';
import ThreatLevelMeter from '../components/ThreatLevelMeter';
import RecentIncidents from '../components/RecentIncidents';
import UserProfileCard from '../components/UserProfileCard';
import MITREChain from '../components/MITREChain';
import AdminSimulationControl from '../components/AdminSimulationControl';
import { useAuth } from '../contexts/AuthContext';
import {
  Activity,
  AlertTriangle,
  Users,
  Shield,
  TrendingUp,
  Clock,
  Eye,

  Zap,
  Play
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    alerts: [],
    incidents: [],
    systemHealth: null,
    threatLevel: 0.0,
    totalUsers: 0,
    activeThreats: 0,
    totalAlerts: 0,
    activeIncidents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds

    // WebSocket Connection
    let ws = null;
    try {
      ws = new WebSocket('ws://localhost:8000/ws');

      ws.onopen = () => {
        console.log('✅ Connected to Real-time Event Stream');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
        }
      };

      ws.onerror = (error) => {
        console.warn('WebSocket connection error:', error);
      };

    } catch (e) {
      console.error('Failed to initialize WebSocket:', e);
    }

    return () => {
      clearInterval(interval);
      if (ws) ws.close();
    };
  }, []);

  const handleWebSocketMessage = (message) => {
    console.log('received ws message', message);
    if (!message || !message.type) return;

    setDashboardData(prev => {
      const newState = { ...prev };

      switch (message.type) {
        case 'new_alert':
          // Add new alert to top of list
          newState.alerts = [message.alert, ...prev.alerts].slice(0, 50);
          newState.totalAlerts += 1;
          if (message.alert.threat_level === 'critical' || message.alert.threat_level === 'high') {
            newState.activeThreats += 1;
          }
          break;

        case 'new_incident':
          newState.incidents = [message.incident, ...prev.incidents].slice(0, 20);
          newState.activeIncidents += 1;
          break;

        case 'simulation_start':
          // Could show a toast or indicator
          console.log(`Simulation started: ${message.scenario}`);
          break;

        default:
          break;
      }

      // Recalculate threat level if needed or just wait for next fetch
      // For immediate visual impact, let's bump threat level if alert is critical
      if (message.type === 'new_alert' && message.alert.threat_level === 'critical') {
        newState.threatLevel = Math.min(1.0, prev.threatLevel + 0.05);
      }

      return newState;
    });
  };

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data...');
      const [stats, alerts, incidents, health] = await Promise.all([
        apiService.getStats().catch(err => { console.error("Stats failed", err); return { total_alerts: 0, active_incidents: 0, monitored_users: 0, threat_level: 0 }; }),
        apiService.getRecentAlerts(20).catch(err => []),
        apiService.getIncidents('open').catch(err => []),
        apiService.getHealth().catch(err => ({ status: 'unknown' })),
      ]);

      setDashboardData({
        alerts,
        incidents,
        systemHealth: health,
        threatLevel: stats.threat_level,
        totalUsers: stats.monitored_users,
        activeThreats: alerts.filter(alert => alert.threat_level === 'critical' || alert.threat_level === 'high').length,
        totalAlerts: stats.total_alerts,
        activeIncidents: stats.active_incidents
      });
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(`Error loading dashboard: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-accent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-threat-critical mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-cyber-accent text-white rounded-lg hover:bg-cyber-accent/80 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Alerts',
      value: formatNumber(dashboardData.totalAlerts),
      change: '+12%',
      changeType: 'increase',
      icon: AlertTriangle,
      color: 'text-threat-high',
    },
    {
      name: 'Active Incidents',
      value: formatNumber(dashboardData.activeIncidents),
      change: '-5%',
      changeType: 'decrease',
      icon: Shield,
      color: 'text-threat-medium',
    },
    {
      name: 'Monitored Users',
      value: formatNumber(dashboardData.totalUsers),
      change: '+2%',
      changeType: 'increase',
      icon: Users,
      color: 'text-cyber-accent',
    },
    {
      name: 'System Health',
      value: (dashboardData.systemHealth?.status === 'healthy' || dashboardData.systemHealth?.status === 'ok') ? '100%' : '85%',
      change: 'Stable',
      changeType: 'neutral',
      icon: Activity,
      color: 'text-threat-low',
    },
  ];

  return (
    <div className="min-h-screen bg-cyber-darker p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Security Dashboard</h1>
              <p className="text-gray-400">Real-time threat monitoring and incident management</p>
            </div>
            {user?.role === 'admin' && (
              <button
                onClick={() => setIsSimModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-600/30 transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Simulate Attack</span>
              </button>
            )}
          </div>
          <AdminSimulationControl
            isOpen={isSimModalOpen}
            onClose={() => setIsSimModalOpen(false)}
            onComplete={() => {
              fetchDashboardData();
              // Keep it open briefly or close it? onComplete closes it in my logic above? 
              // Actually my logic above: onComplete={() => { fetchDashboardData(); setIsSimModalOpen(false); }}
            }}
          />
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 hover:border-slate-600/50 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">{stat.name}</p>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                    <p className={`text-sm mt-1 ${stat.changeType === 'increase' ? 'text-green-400' :
                      stat.changeType === 'decrease' ? 'text-red-400' :
                        'text-gray-400'
                      }`}>
                      {stat.change}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg bg-slate-700/50 ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Threat Meter and Recent Incidents */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <ThreatLevelMeter
                threatLevel={dashboardData.threatLevel}
                activeThreats={dashboardData.activeThreats}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <RecentIncidents incidents={dashboardData.incidents.slice(0, 5)} />
            </motion.div>
          </div>

          {/* Center Column - Live Alerts Feed */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <LiveAlertsFeed alerts={dashboardData.alerts} />
            </motion.div>
          </div>

          {/* Right Column - User Profiles and MITRE Chain */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <UserProfileCard />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <MITREChain alerts={dashboardData.alerts} />
            </motion.div>
          </div>
        </div>

        {/* System Status Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-300">System Online</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">
                  Last updated: {formatRelativeTime(new Date())}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>Redis: {dashboardData.systemHealth?.redis ? 'Connected' : 'Disconnected'}</span>
              <span>Models: {dashboardData.systemHealth?.models_loaded ? 'Loaded' : 'Loading'}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
