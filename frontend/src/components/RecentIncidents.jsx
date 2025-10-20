import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { formatRelativeTime, getStatusColor, getStatusIcon, getThreatLevelColor } from '../utils/formatters';
import { AlertTriangle, Clock, User, ArrowRight, Eye } from 'lucide-react';

const RecentIncidents = ({ incidents = [] }) => {
  const getSeverityIcon = (severity) => {
    const icons = {
      critical: '🚨',
      high: '⚠️',
      medium: '⚡',
      low: 'ℹ️',
    };
    return icons[severity] || icons.low;
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-threat-medium/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-threat-medium" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Recent Incidents</h3>
            <p className="text-sm text-gray-400">Latest security incidents</p>
          </div>
        </div>
        <Link
          to="/incidents"
          className="flex items-center space-x-1 text-cyber-accent hover:text-cyber-glow transition-colors text-sm"
        >
          <span>View All</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {incidents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400">No recent incidents</p>
            <p className="text-sm text-gray-500 mt-1">System is secure</p>
          </motion.div>
        ) : (
          incidents.map((incident, index) => {
            const severityColors = getThreatLevelColor(incident.severity);
            const statusColors = getStatusColor(incident.status);
            const statusIcon = getStatusIcon(incident.status);

            return (
              <motion.div
                key={incident.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-slate-700/30 border border-slate-600/50 rounded-lg hover:border-slate-500/50 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0">
                      <span className="text-lg">{getSeverityIcon(incident.severity)}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-medium text-white truncate">
                          {incident.incident_number}
                        </h4>
                        <span className={`text-xs px-2 py-1 rounded ${severityColors.bg} ${severityColors.text}`}>
                          {incident.severity.toUpperCase()}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                        {incident.narrative || 'Security incident detected'}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{incident.user_id}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatRelativeTime(incident.start_time)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <span className="text-sm">{statusIcon}</span>
                      <span className={`text-xs ${statusColors}`}>
                        {incident.status}
                      </span>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-white">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Attack Chain Preview */}
                {incident.attack_chain && incident.attack_chain.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-600/50">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400">Attack Chain:</span>
                      <div className="flex items-center space-x-1">
                        {incident.attack_chain.slice(0, 3).map((tactic, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-slate-600/50 text-gray-300 px-2 py-1 rounded"
                          >
                            {tactic}
                          </span>
                        ))}
                        {incident.attack_chain.length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{incident.attack_chain.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-slate-700/50">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{incidents.length} total incidents</span>
          <div className="flex items-center space-x-4">
            <span>Open: {incidents.filter(i => i.status === 'open').length}</span>
            <span>Investigating: {incidents.filter(i => i.status === 'investigating').length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentIncidents;
