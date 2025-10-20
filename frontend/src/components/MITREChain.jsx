import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Target, Zap, Eye, ArrowRight } from 'lucide-react';

const MITREChain = ({ alerts = [] }) => {
  const [attackChain, setAttackChain] = useState([]);
  const [selectedTactic, setSelectedTactic] = useState(null);

  useEffect(() => {
    // Extract unique MITRE tactics from alerts
    const tactics = [...new Set(alerts.map(alert => alert.mitre_tactic).filter(Boolean))];
    
    // Create attack chain based on common progression
    const chain = [
      { id: 'TA0001', name: 'Initial Access', icon: Target, color: 'text-threat-critical', techniques: ['T1078', 'T1566'] },
      { id: 'TA0002', name: 'Execution', icon: Zap, color: 'text-threat-high', techniques: ['T1059', 'T1204'] },
      { id: 'TA0003', name: 'Persistence', icon: Shield, color: 'text-threat-medium', techniques: ['T1547', 'T1053'] },
      { id: 'TA0004', name: 'Privilege Escalation', icon: ArrowRight, color: 'text-threat-high', techniques: ['T1068', 'T1134'] },
      { id: 'TA0005', name: 'Defense Evasion', icon: Eye, color: 'text-threat-medium', techniques: ['T1070', 'T1027'] },
      { id: 'TA0006', name: 'Credential Access', icon: Shield, color: 'text-threat-high', techniques: ['T1110', 'T1003'] },
      { id: 'TA0007', name: 'Discovery', icon: Eye, color: 'text-threat-low', techniques: ['T1083', 'T1057'] },
      { id: 'TA0008', name: 'Lateral Movement', icon: ArrowRight, color: 'text-threat-high', techniques: ['T1021', 'T1071'] },
      { id: 'TA0009', name: 'Collection', icon: Target, color: 'text-threat-medium', techniques: ['T1005', 'T1114'] },
      { id: 'TA0010', name: 'Exfiltration', icon: Zap, color: 'text-threat-critical', techniques: ['T1041', 'T1048'] },
    ].filter(tactic => tactics.includes(tactic.name));

    setAttackChain(chain);
  }, [alerts]);

  const getTacticStatus = (tacticName) => {
    const relatedAlerts = alerts.filter(alert => alert.mitre_tactic === tacticName);
    if (relatedAlerts.length === 0) return 'inactive';
    if (relatedAlerts.some(alert => alert.threat_level === 'critical')) return 'critical';
    if (relatedAlerts.some(alert => alert.threat_level === 'high')) return 'high';
    return 'active';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return 'bg-threat-critical/20 border-threat-critical text-threat-critical';
      case 'high': return 'bg-threat-high/20 border-threat-high text-threat-high';
      case 'active': return 'bg-threat-medium/20 border-threat-medium text-threat-medium';
      default: return 'bg-slate-700/30 border-slate-600 text-gray-400';
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-threat-high/20 rounded-lg">
            <Shield className="w-5 h-5 text-threat-high" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">MITRE ATT&CK Chain</h3>
            <p className="text-sm text-gray-400">Attack progression analysis</p>
          </div>
        </div>
        <div className="text-xs text-gray-400">
          {attackChain.length} tactics detected
        </div>
      </div>

      {attackChain.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-400">No attack patterns detected</p>
          <p className="text-sm text-gray-500 mt-1">System appears secure</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {attackChain.map((tactic, index) => {
            const Icon = tactic.icon;
            const status = getTacticStatus(tactic.name);
            const statusColor = getStatusColor(status);
            const relatedAlerts = alerts.filter(alert => alert.mitre_tactic === tactic.name);

            return (
              <motion.div
                key={tactic.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border transition-all duration-300 cursor-pointer hover:border-slate-500/50 ${statusColor}`}
                onClick={() => setSelectedTactic(selectedTactic === tactic.id ? null : tactic.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-white">{tactic.name}</h4>
                        <span className="text-xs bg-slate-600/50 text-gray-300 px-2 py-1 rounded">
                          {tactic.id}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {relatedAlerts.length} alert{relatedAlerts.length !== 1 ? 's' : ''} detected
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {status !== 'inactive' && (
                      <div className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${
                          status === 'critical' ? 'bg-threat-critical animate-pulse' :
                          status === 'high' ? 'bg-threat-high animate-pulse' :
                          'bg-threat-medium'
                        }`}></div>
                        <span className="text-xs capitalize">{status}</span>
                      </div>
                    )}
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedTactic === tactic.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-slate-600/50"
                  >
                    <div className="space-y-3">
                      <div>
                        <h5 className="text-xs font-medium text-gray-300 mb-2">Techniques Used:</h5>
                        <div className="flex flex-wrap gap-2">
                          {tactic.techniques.map((technique) => (
                            <span
                              key={technique}
                              className="text-xs bg-slate-600/50 text-gray-300 px-2 py-1 rounded"
                            >
                              {technique}
                            </span>
                          ))}
                        </div>
                      </div>

                      {relatedAlerts.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium text-gray-300 mb-2">Recent Alerts:</h5>
                          <div className="space-y-2">
                            {relatedAlerts.slice(0, 3).map((alert) => (
                              <div
                                key={alert.id}
                                className="p-2 bg-slate-700/30 rounded text-xs"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-white">{alert.user_id}</span>
                                  <span className={`px-2 py-1 rounded ${
                                    alert.threat_level === 'critical' ? 'bg-threat-critical/20 text-threat-critical' :
                                    alert.threat_level === 'high' ? 'bg-threat-high/20 text-threat-high' :
                                    'bg-threat-medium/20 text-threat-medium'
                                  }`}>
                                    {alert.threat_level}
                                  </span>
                                </div>
                                {alert.mitre_technique && (
                                  <p className="text-gray-400 mt-1">
                                    Technique: {alert.mitre_technique}
                                  </p>
                                )}
                              </div>
                            ))}
                            {relatedAlerts.length > 3 && (
                              <p className="text-xs text-gray-400">
                                +{relatedAlerts.length - 3} more alerts
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-slate-700/50">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>MITRE ATT&CK Framework</span>
          <span>v13.1</span>
        </div>
      </div>
    </div>
  );
};

export default MITREChain;
