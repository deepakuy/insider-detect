import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    ShieldAlert,
    User,
    Clock,
    Activity,
    CheckCircle,
    AlertTriangle,
    Lock,
    Search
} from 'lucide-react';
import { apiService } from '../services/api';
import Timeline from '../components/Timeline';
import { formatNumber, formatRelativeTime, getThreatLevelColor } from '../utils/formatters';
import toast from 'react-hot-toast';

const IncidentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [comment, setComment] = useState('');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchIncident();
    }, [id]);

    const fetchIncident = async () => {
        try {
            const result = await apiService.getIncident(id);
            setData(result);
        } catch (error) {
            console.error("Failed to fetch incident", error);
            toast.error("Failed to load incident details");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        // Generate human-readable comment for timeline if not provided
        const autoCommentMap = {
            'investigating': 'Analyst started investigation',
            'contained': 'Incident contained',
            'closed': 'Incident marked as resolved',
        };
        const finalComment = comment.trim() || autoCommentMap[newStatus] || `Status changed to ${newStatus}`;

        setUpdating(true);
        try {
            await apiService.updateIncidentStatus(id, newStatus, finalComment);
            toast.success(`Status updated to ${newStatus.toUpperCase()}`);
            setComment('');
            fetchIncident(); // Refresh to show new timeline entry
        } catch (error) {
            toast.error("Failed to update status");
            console.error(error);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-cyber-darker">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-accent"></div>
            </div>
        );
    }

    if (!data) return null;

    const { incident, alerts = [], activities = [] } = data || {};

    // Combine alerts (as events) and activities into a single timeline
    const combinedTimeline = [
        ...(alerts || []).map(a => ({
            type: 'event', // Treat alert as a high-level event for timeline
            timestamp: a.timestamp,
            details: a.description || `Alert: ${a.threat_level}`,
            metadata: {
                threat_level: a.threat_level,
                files: [],
                src_ip: 'Internal'
            } // simplified
        })),
        ...(activities || []).map(a => ({
            type: 'analyst_activity',
            timestamp: a.timestamp,
            details: `${a.action} by ${a.analyst_id}`,
            metadata: { details: a.details, incident_id: a.incident_id }
        }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return (
        <div className="min-h-screen bg-cyber-darker p-6 text-white">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between"
                >
                    <div className="flex items-center space-x-4">
                        <button onClick={() => navigate(-1)} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center space-x-3">
                                <h1 className="text-2xl font-bold">Incident #{incident.incident_number}</h1>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${incident.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                                    incident.severity === 'high' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
                                    }`}>
                                    {incident.severity}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border border-slate-600 ${incident.status === 'open' ? 'text-green-400' :
                                    incident.status === 'investigating' ? 'text-yellow-400' : 'text-gray-400'
                                    }`}>
                                    {incident.status}
                                </span>
                            </div>
                            <p className="text-gray-400 text-sm mt-1">Generated {formatRelativeTime(new Date(incident.start_time))} • Assigned to {incident.assigned_to || 'Unassigned'}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        {incident.status === 'open' && (
                            <button
                                onClick={() => handleStatusChange('investigating')}
                                disabled={updating}
                                className="flex items-center space-x-2 px-4 py-2 bg-yellow-600/20 text-yellow-500 border border-yellow-600/50 rounded-lg hover:bg-yellow-600/30 transition-colors disabled:opacity-50"
                            >
                                <Search className="w-4 h-4" />
                                <span>{updating ? 'Updating...' : 'Start Investigation'}</span>
                            </button>
                        )}
                        {incident.status === 'investigating' && (
                            <button
                                onClick={() => handleStatusChange('contained')}
                                disabled={updating}
                                className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 text-blue-500 border border-blue-600/50 rounded-lg hover:bg-blue-600/30 transition-colors disabled:opacity-50"
                            >
                                <Lock className="w-4 h-4" />
                                <span>{updating ? 'Updating...' : 'Contain Incident'}</span>
                            </button>
                        )}
                        {incident.status !== 'closed' && (
                            <button
                                onClick={() => handleStatusChange('closed')}
                                disabled={updating}
                                className="flex items-center space-x-2 px-4 py-2 bg-green-600/20 text-green-500 border border-green-600/50 rounded-lg hover:bg-green-600/30 transition-colors disabled:opacity-50"
                            >
                                <CheckCircle className="w-4 h-4" />
                                <span>{updating ? 'Updating...' : 'Close Incident'}</span>
                            </button>
                        )}
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left: Context & MITRE */}
                    <div className="lg:col-span-1 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl p-6"
                        >
                            <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
                                <ShieldAlert className="w-5 h-5 text-cyber-accent" />
                                <span>Threat Scope</span>
                            </h3>

                            <div className="space-y-4">
                                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                                    <span className="text-xs text-gray-400 uppercase tracking-wider">Targeted User</span>
                                    <div className="flex items-center space-x-3 mt-2">
                                        <div className="p-2 bg-slate-800 rounded-full">
                                            <User className="w-5 h-5 text-gray-300" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{incident.user_id}</p>
                                            <p className="text-xs text-gray-500">Analyst • Operations</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                                    <span className="text-xs text-gray-400 uppercase tracking-wider">MITRE ATT&CK Context</span>
                                    {alerts[0] && (
                                        <div className="mt-2 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-300">Tactic</span>
                                                <span className="text-sm font-mono text-red-400">{alerts[0].mitre_tactic || 'Unknown'}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-300">Technique</span>
                                                <span className="text-sm font-mono text-orange-400">{alerts[0].mitre_technique || 'Unknown'}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2 border-t border-slate-700 pt-2">
                                                {alerts[0].description}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
                            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Add a comment or outcome note..."
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-cyber-accent mb-3 h-24 resize-none"
                            />
                            <button
                                onClick={() => handleStatusChange(incident.status)} // Just log comment
                                disabled={!comment.trim() || updating}
                                className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Log Note
                            </button>
                        </div>
                    </div>

                    {/* Right: Forensic Timeline */}
                    <div className="lg:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl p-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold flex items-center space-x-2">
                                    <Activity className="w-5 h-5 text-cyber-accent" />
                                    <span>Forensic Timeline</span>
                                </h3>
                                <span className="text-xs text-gray-400">{combinedTimeline.length} events logged</span>
                            </div>

                            <Timeline events={combinedTimeline} />
                        </motion.div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default IncidentDetail;
