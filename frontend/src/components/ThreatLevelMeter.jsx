import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gauge, AlertTriangle, Shield, Zap } from 'lucide-react';

const ThreatLevelMeter = ({ threatLevel = 0.3, activeThreats = 0 }) => {
  const [animatedLevel, setAnimatedLevel] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedLevel(threatLevel);
    }, 500);
    return () => clearTimeout(timer);
  }, [threatLevel]);

  const getThreatLevelInfo = (level) => {
    if (level >= 0.8) {
      return {
        label: 'CRITICAL',
        color: '#dc2626',
        bgColor: 'bg-threat-critical/20',
        borderColor: 'border-threat-critical',
        textColor: 'text-threat-critical',
        icon: AlertTriangle,
        description: 'Immediate action required',
      };
    } else if (level >= 0.6) {
      return {
        label: 'HIGH',
        color: '#ea580c',
        bgColor: 'bg-threat-high/20',
        borderColor: 'border-threat-high',
        textColor: 'text-threat-high',
        icon: AlertTriangle,
        description: 'Elevated threat level',
      };
    } else if (level >= 0.4) {
      return {
        label: 'MEDIUM',
        color: '#f59e0b',
        bgColor: 'bg-threat-medium/20',
        borderColor: 'border-threat-medium',
        textColor: 'text-threat-medium',
        icon: Zap,
        description: 'Moderate risk detected',
      };
    } else {
      return {
        label: 'LOW',
        color: '#84cc16',
        bgColor: 'bg-threat-low/20',
        borderColor: 'border-threat-low',
        textColor: 'text-threat-low',
        icon: Shield,
        description: 'System secure',
      };
    }
  };

  const threatInfo = getThreatLevelInfo(animatedLevel);
  const Icon = threatInfo.icon;

  // Calculate gauge rotation (0-180 degrees)
  const rotation = (animatedLevel * 180) - 90;

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-4">System Threat Level</h3>
        
        {/* Gauge */}
        <div className="relative w-48 h-24 mx-auto mb-6">
          {/* Gauge Background */}
          <svg className="w-full h-full" viewBox="0 0 200 100">
            {/* Background Arc */}
            <path
              d="M 20 80 A 80 80 0 0 1 180 80"
              fill="none"
              stroke="#374151"
              strokeWidth="8"
              strokeLinecap="round"
            />
            
            {/* Threat Level Arc */}
            <motion.path
              d="M 20 80 A 80 80 0 0 1 180 80"
              fill="none"
              stroke={threatInfo.color}
              strokeWidth="8"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: animatedLevel }}
              transition={{ duration: 2, ease: 'easeInOut' }}
              style={{
                filter: `drop-shadow(0 0 8px ${threatInfo.color}40)`,
              }}
            />
            
            {/* Needle */}
            <motion.line
              x1="100"
              y1="80"
              x2="100"
              y2="30"
              stroke="#ffffff"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ rotate: -90 }}
              animate={{ rotate: rotation }}
              transition={{ duration: 2, ease: 'easeInOut' }}
              transformOrigin="100 80"
              style={{
                filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.5))',
              }}
            />
            
            {/* Center Dot */}
            <circle
              cx="100"
              cy="80"
              r="6"
              fill="#ffffff"
              style={{
                filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.5))',
              }}
            />
          </svg>
          
          {/* Threat Level Display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, type: 'spring', stiffness: 200 }}
                className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${threatInfo.bgColor} ${threatInfo.borderColor} border-2 mb-2`}
              >
                <Icon className={`w-6 h-6 ${threatInfo.textColor}`} />
              </motion.div>
              <div className={`text-2xl font-bold ${threatInfo.textColor}`}>
                {(animatedLevel * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        {/* Threat Level Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className={`p-4 rounded-lg ${threatInfo.bgColor} ${threatInfo.borderColor} border`}
        >
          <div className={`text-lg font-semibold ${threatInfo.textColor} mb-1`}>
            {threatInfo.label}
          </div>
          <div className="text-sm text-gray-300 mb-2">
            {threatInfo.description}
          </div>
          <div className="text-xs text-gray-400">
            {activeThreats} active threats detected
          </div>
        </motion.div>

        {/* Threat Indicators */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {activeThreats}
            </div>
            <div className="text-xs text-gray-400">Active Threats</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {Math.round(animatedLevel * 100)}%
            </div>
            <div className="text-xs text-gray-400">Risk Score</div>
          </div>
        </div>

        {/* Status Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="mt-4 flex items-center justify-center space-x-2"
        >
          <div className={`w-2 h-2 rounded-full ${
            animatedLevel >= 0.6 ? 'bg-threat-critical animate-pulse' : 
            animatedLevel >= 0.4 ? 'bg-threat-high animate-pulse' : 
            'bg-threat-low'
          }`}></div>
          <span className="text-xs text-gray-400">
            {animatedLevel >= 0.6 ? 'High Alert' : 
             animatedLevel >= 0.4 ? 'Monitoring' : 
             'Secure'}
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default ThreatLevelMeter;
