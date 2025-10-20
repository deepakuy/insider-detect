import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiService } from '../services/api';
import { formatDateTime, formatRelativeTime, getStatusColor, getStatusIcon, getThreatLevelColor } from '../utils/formatters';
import { AlertTriangle, Search, Filter, Eye, Edit, CheckCircle, X, Clock, User, Shield } from 'lucide-react';

const Incidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const data = await apiService.getIncidents();
      setIncidents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (incidentId, newStatus) => {
    try {
      await apiService.updateIncident(incidentId, { status: newStatus });
      setIncidents(prev => prev.map(incident => 
        incident.id === incidentId 
          ? { ...incident, status: newStatus }
          : incident
      ));
      setShowModal(false);
    } catch (err) {
      console.error('Failed to update incident:', err);
    }
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = incident.incident_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.narrative?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Mock data for demonstration
  const mockIncidents = [
    {
      id: 1,
      incident_number: 'INC-2024-001',
      user_id: 'john.doe',
      start_time: '2024-01-20T10:15:00Z',
      end_time: null,
      severity: 'critical',
      status: 'open',
      attack_chain: ['Initial Access', 'Execution', 'Exfiltration'],
      narrative: 'Suspicious data exfiltration activity detected. User accessed multiple confidential files and transferred large amounts of data to external IP addresses.',
      assigned_to: null,
      resolution_notes: null,
      false_positive: false,
      created_at: '2024-01-20T10:15:00Z',
      updated_at: '2024-01-20T10:15:00Z',
    },
    {
      id: 2,
      incident_number: 'INC-2024-002',
      user_id: 'jane.smith',
      start_time: '2024-01-20T09:30:00Z',
      end_time: null,
      severity: 'high',
      status: 'investigating',
      attack_chain: ['Initial Access', 'Privilege Escalation'],
      narrative: 'Unusual privilege escalation attempt detected. User attempted to access administrative functions outside normal business hours.',
      assigned_to: 'analyst',
      resolution_notes: null,
      false_positive: false,
      created_at: '2024-01-20T09:30:00Z',
      updated_at: '2024-01-20T11:00:00Z',
    },
    {
      id: 3,
      incident_number: 'INC-2024-003',
      user_id: 'mike.wilson',
      start_time: '2024-01-19T16:45:00Z',
      end_time: '2024-01-20T08:30:00Z',
      severity: 'medium',
      status: 'resolved',
      attack_chain: ['Initial Access', 'Discovery'],
      narrative: 'Automated scanning activity detected from user account. Investigation revealed legitimate security testing activity.',
      assigned_to: 'admin',
      resolution_notes: 'Confirmed as legitimate security testing. No further action required.',
      false_positive: true,
      created_at: '2024-01-19T16:45:00Z',
      updated_at: '2024-01-20T08:30:00Z',
    },
  ];

  const data = incidents.length > 0 ? incidents : mockIncidents;

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-darker p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700 rounded w-1/3 mb-6"></div>
            <div className="h-12 bg-slate-700 rounded mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-darker p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-threat-high/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-threat-high" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Security Incidents</h1>
              <p className="text-gray-400">Manage and investigate security incidents</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search incidents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyber-accent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyber-accent"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="false_positive">False Positive</option>
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
              <div className="p-2 bg-threat-critical/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-threat-critical" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Open Incidents</p>
                <p className="text-2xl font-bold text-white">
                  {data.filter(i => i.status === 'open').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-threat-high/20 rounded-lg">
                <Clock className="w-5 h-5 text-threat-high" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Investigating</p>
                <p className="text-2xl font-bold text-white">
                  {data.filter(i => i.status === 'investigating').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-threat-low/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-threat-low" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Resolved</p>
                <p className="text-2xl font-bold text-white">
                  {data.filter(i => i.status === 'resolved').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-threat-medium/20 rounded-lg">
                <X className="w-5 h-5 text-threat-medium" />
              </div>
              <div>
                <p className="text-sm text-gray-400">False Positives</p>
                <p className="text-2xl font-bold text-white">
                  {data.filter(i => i.status === 'false_positive').length}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Incidents Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Incident
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredIncidents.map((incident, index) => {
                  const severityColors = getThreatLevelColor(incident.severity);
                  const statusColors = getStatusColor(incident.status);
                  const statusIcon = getStatusIcon(incident.status);

                  return (
                    <motion.tr
                      key={incident.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {incident.incident_number}
                          </div>
                          <div className="text-sm text-gray-400 truncate max-w-xs">
                            {incident.narrative}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-white">{incident.user_id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityColors.bg} ${severityColors.text}`}>
                          {incident.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{statusIcon}</span>
                          <span className={`text-sm ${statusColors}`}>
                            {incident.status.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {formatRelativeTime(incident.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedIncident(incident);
                              setShowModal(true);
                            }}
                            className="text-cyber-accent hover:text-cyber-glow transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-gray-400 hover:text-white transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Incident Details Modal */}
        {showModal && selectedIncident && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  {selectedIncident.incident_number}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Incident Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">User</label>
                    <p className="text-white">{selectedIncident.user_id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Severity</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getThreatLevelColor(selectedIncident.severity).bg} ${getThreatLevelColor(selectedIncident.severity).text}`}>
                      {selectedIncident.severity.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                    <p className="text-white">{selectedIncident.status.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Created</label>
                    <p className="text-white">{formatDateTime(selectedIncident.created_at)}</p>
                  </div>
                </div>

                {/* Narrative */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                  <p className="text-white bg-slate-700/30 p-3 rounded-lg">
                    {selectedIncident.narrative}
                  </p>
                </div>

                {/* Attack Chain */}
                {selectedIncident.attack_chain && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Attack Chain</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedIncident.attack_chain.map((tactic, index) => (
                        <span
                          key={index}
                          className="bg-slate-600/50 text-gray-300 px-3 py-1 rounded-full text-sm"
                        >
                          {tactic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resolution Notes */}
                {selectedIncident.resolution_notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Resolution Notes</label>
                    <p className="text-white bg-slate-700/30 p-3 rounded-lg">
                      {selectedIncident.resolution_notes}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t border-slate-700/50">
                  <button
                    onClick={() => handleStatusUpdate(selectedIncident.id, 'investigating')}
                    className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 bg-threat-high/20 text-threat-high rounded-lg hover:bg-threat-high/30 transition-colors"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Start Investigation</span>
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedIncident.id, 'resolved')}
                    className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 bg-threat-low/20 text-threat-low rounded-lg hover:bg-threat-low/30 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Mark Resolved</span>
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedIncident.id, 'false_positive')}
                    className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 bg-threat-medium/20 text-threat-medium rounded-lg hover:bg-threat-medium/30 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>False Positive</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Incidents;
