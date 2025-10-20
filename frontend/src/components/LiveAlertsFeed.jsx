import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatRelativeTime, getThreatLevelColor, getThreatLevelIcon } from '../utils/formatters';
import { AlertTriangle, Eye, CheckCircle, Clock, User, MapPin } from 'lucide-react';

const LiveAlertsFeed = ({ alerts = [] }) => {
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState(new Set());
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  const handleAcknowledge = async (alertId) => {
    try {
      // In a real app, you'd call the API here
      setAcknowledgedAlerts(prev => new Set([...prev, alertId]));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const getAlertAnimation = (alert) => {
    if (alert.threat_level === 'critical') {
      return {
        initial: { x: 100, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: -100, opacity: 0 },
        transition: { type: 'spring', stiffness: 300, damping: 30 }
      };
    }
    return {
      initial: { y: 20, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: -20, opacity: 0 },
      transition: { duration: 0.3 }
    };
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-threat-high/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-threat-high" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Live Alerts</h2>
            <p className="text-sm text-gray-400">Real-time threat notifications</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isAutoRefresh ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-xs text-gray-400">Live</span>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
        <AnimatePresence>
          {alerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-gray-400">No active alerts</p>
              <p className="text-sm text-gray-500 mt-1">System is secure</p>
            </motion.div>
          ) : (
            alerts.map((alert) => {
              const isAcknowledged = acknowledgedAlerts.has(alert.id);
              const threatColors = getThreatLevelColor(alert.threat_level);
              const threatIcon = getThreatLevelIcon(alert.threat_level);
              const animation = getAlertAnimation(alert);

              return (
                <motion.div
                  key={alert.id}
                  {...animation}
                  className={`relative p-4 rounded-lg border transition-all duration-300 ${
                    isAcknowledged 
                      ? 'bg-slate-700/30 border-slate-600/50' 
                      : `bg-slate-700/50 border-${alert.threat_level === 'critical' ? 'threat-critical' : 'slate-600'}/50`
                  } ${alert.threat_level === 'critical' && !isAcknowledged ? 'animate-pulse shadow-lg shadow-threat-critical/20' : ''}`}
                >
                  {/* Alert Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{threatIcon}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${threatColors.text}`}>
                            {alert.threat_level.toUpperCase()}
                          </span>
                          {alert.mitre_tactic && (
                            <span className="text-xs bg-slate-600/50 text-gray-300 px-2 py-1 rounded">
                              {alert.mitre_tactic}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatRelativeTime(alert.timestamp)}
                        </p>
                      </div>
                    </div>
                    {!isAcknowledged && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                        title="Acknowledge alert"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Alert Content */}
                  <div className="space-y-2">
                    <p className="text-sm text-white font-medium">
                      {alert.description || 'Suspicious activity detected'}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>{alert.user_id}</span>
                      </div>
                      {alert.src_ip && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{alert.src_ip}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Score: {(alert.threat_score * 100).toFixed(0)}%</span>
                      </div>
                    </div>

                    {/* MITRE Technique */}
                    {alert.mitre_technique && (
                      <div className="mt-2 p-2 bg-slate-600/30 rounded text-xs">
                        <span className="text-gray-300">Technique: </span>
                        <span className="text-cyber-accent">{alert.mitre_technique}</span>
                      </div>
                    )}
                  </div>

                  {/* Acknowledged Badge */}
                  {isAcknowledged && (
                    <div className="absolute top-2 right-2">
                      <div className="flex items-center space-x-1 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">
                        <CheckCircle className="w-3 h-3" />
                        <span>Acknowledged</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{alerts.length} total alerts</span>
          <span>Auto-refresh: {isAutoRefresh ? 'ON' : 'OFF'}</span>
        </div>
      </div>
    </div>
  );
};

export default LiveAlertsFeed;
