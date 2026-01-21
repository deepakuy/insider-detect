import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    User,
    Mail,
    Shield,
    Activity,
    AlertTriangle,
    TrendingUp,
    Clock,
    Eye
} from 'lucide-react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const UserDetail = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUser();
    }, [username]);

    const fetchUser = async () => {
        try {
            const users = await apiService.getUsers();
            const foundUser = users.find(u => u.username === username);

            if (foundUser) {
                // Enrich with computed fields
                setUser({
                    ...foundUser,
                    risk_score: Math.random() * 0.5, // Placeholder
                    total_events: Math.floor(Math.random() * 2000) + 100,
                    total_alerts: Math.floor(Math.random() * 15),
                    last_activity: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
                    is_flagged: Math.random() > 0.8,
                    department: foundUser.role === 'admin' ? 'IT Security' : 'SOC'
                });
            } else {
                setError('User not found');
            }
        } catch (err) {
            console.error('Failed to fetch user:', err);
            setError('Failed to load user data');
            toast.error('Failed to load user data');
        } finally {
            setLoading(false);
        }
    };

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

    const formatRelativeTime = (date) => {
        const now = new Date();
        const diffMs = now - new Date(date);
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        return `${diffDays} days ago`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-cyber-darker">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-accent"></div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-8 text-center"
                >
                    <AlertTriangle className="w-16 h-16 text-threat-high mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">User Not Found</h2>
                    <p className="text-gray-400 mb-6">The user "{username}" could not be found.</p>
                    <button
                        onClick={() => navigate('/users')}
                        className="px-6 py-2 bg-cyber-accent text-white rounded-lg hover:bg-cyber-glow transition-colors"
                    >
                        Back to Users
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-8"
            >
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white">User Profile</h1>
                        <p className="text-gray-400 text-sm">Detailed user information</p>
                    </div>
                </div>
            </motion.div>

            {/* Main Profile Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-8 mb-6"
            >
                <div className="flex items-start space-x-6">
                    {/* Avatar */}
                    <div className="w-20 h-20 bg-gradient-to-br from-cyber-accent to-cyber-glow rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-10 h-10 text-white" />
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                            <h2 className="text-2xl font-bold text-white">{user.username}</h2>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${user.role === 'admin'
                                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                }`}>
                                {user.role}
                            </span>
                            {user.is_flagged && (
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-threat-high/20 text-threat-high border border-threat-high/30">
                                    FLAGGED
                                </span>
                            )}
                        </div>

                        <div className="flex items-center space-x-2 text-gray-400 mb-1">
                            <Mail className="w-4 h-4" />
                            <span>{user.email}</span>
                        </div>

                        <div className="flex items-center space-x-2 text-gray-400">
                            <Shield className="w-4 h-4" />
                            <span>{user.department}</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Risk Score */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={`p-6 rounded-xl border ${getRiskBgColor(user.risk_score)}`}
                >
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-300">Risk Score</span>
                        <TrendingUp className={`w-5 h-5 ${getRiskColor(user.risk_score)}`} />
                    </div>
                    <div className={`text-3xl font-bold ${getRiskColor(user.risk_score)}`}>
                        {(user.risk_score * 100).toFixed(0)}%
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-1000 ${user.risk_score >= 0.8 ? 'bg-threat-critical' :
                                    user.risk_score >= 0.6 ? 'bg-threat-high' :
                                        user.risk_score >= 0.4 ? 'bg-threat-medium' : 'bg-threat-low'
                                }`}
                            style={{ width: `${user.risk_score * 100}%` }}
                        />
                    </div>
                </motion.div>

                {/* Total Events */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-6 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl"
                >
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-300">Total Events</span>
                        <Activity className="w-5 h-5 text-cyber-accent" />
                    </div>
                    <div className="text-3xl font-bold text-white">
                        {user.total_events.toLocaleString()}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
                </motion.div>

                {/* Alerts */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-6 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl"
                >
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-300">Active Alerts</span>
                        <AlertTriangle className="w-5 h-5 text-threat-high" />
                    </div>
                    <div className="text-3xl font-bold text-white">
                        {user.total_alerts}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Requiring attention</p>
                </motion.div>
            </div>

            {/* Last Activity */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 mb-6"
            >
                <div className="flex items-center space-x-3 mb-2">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-300">Last Activity</span>
                </div>
                <p className="text-lg text-white">{formatRelativeTime(user.last_activity)}</p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex space-x-4"
            >
                <Link
                    to={`/timeline/${user.username}`}
                    className="flex-1 flex items-center justify-center space-x-2 py-3 px-6 bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/50 rounded-xl hover:bg-cyber-accent/30 transition-colors"
                >
                    <Eye className="w-5 h-5" />
                    <span className="font-medium">View Timeline</span>
                </Link>
                <Link
                    to={`/investigate/${user.username}`}
                    className="flex-1 flex items-center justify-center space-x-2 py-3 px-6 bg-slate-700/50 text-gray-300 border border-slate-600 rounded-xl hover:bg-slate-700 transition-colors"
                >
                    <Shield className="w-5 h-5" />
                    <span className="font-medium">Investigate User</span>
                </Link>
            </motion.div>
        </div>
    );
};

export default UserDetail;
