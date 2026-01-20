import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, Terminal, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

const Investigate = () => {
    const { userId } = useParams();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        if (userId) {
            fetchInvestigationData();
        } else {
            setLoading(false);
        }
    }, [userId]);

    const fetchInvestigationData = async () => {
        try {
            const timeline = await apiService.getUserTimeline(userId);
            const profile = await apiService.getUserProfile(userId);
            setData({ ...timeline, ...profile });
        } catch (error) {
            // Graceful fallback if user not found or error
            toast.error(`Could not load investigation data for ${userId}`);
        } finally {
            setLoading(false);
        }
    };

    if (!userId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <Shield className="w-16 h-16 text-cyber-accent mb-4 opacity-50" />
                <h1 className="text-2xl font-bold text-white mb-2">Investigation Center</h1>
                <p className="text-gray-400 max-w-md">
                    Select a user from the Users directory or Dashboard to start an investigation.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center space-x-4 mb-8">
                <div className="p-3 bg-red-500/20 rounded-xl">
                    <Shield className="w-8 h-8 text-red-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Active Investigation</h1>
                    <p className="text-gray-400">Target: <span className="text-cyber-accent font-mono">{userId}</span></p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Console */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 font-mono text-sm h-96 overflow-y-auto">
                        <div className="flex items-center space-x-2 text-gray-500 mb-4 pb-2 border-b border-slate-800">
                            <Terminal className="w-4 h-4" />
                            <span>System Logs & Evidence</span>
                        </div>
                        {loading ? (
                            <div className="animate-pulse space-y-2">
                                <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                                <div className="h-4 bg-slate-800 rounded w-1/2"></div>
                            </div>
                        ) : data?.events?.length > 0 ? (
                            data.events.map((event, idx) => (
                                <div key={idx} className="mb-2">
                                    <span className="text-gray-500">[{new Date(event.timestamp).toLocaleTimeString()}]</span>{' '}
                                    <span className={event.success ? 'text-green-400' : 'text-red-400'}>
                                        {event.event_type.toUpperCase()}
                                    </span>{' '}
                                    <span className="text-gray-300">
                                        {event.src_ip} --&gt; {event.dst_ip || 'Internal'}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-gray-500 italic">No recent events found for context...</div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <Activity className="w-5 h-5 mr-2 text-cyber-accent" />
                            Risk Analysis
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-400">Threat Score</span>
                                    <span className="text-red-400 font-bold">High</span>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-2">
                                    <div className="bg-red-500 h-2 rounded-full w-[75%]"></div>
                                </div>
                            </div>
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <div className="flex items-center space-x-2 text-red-400 text-sm">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>Anomalous Data Exfiltration Detected</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Investigate;
