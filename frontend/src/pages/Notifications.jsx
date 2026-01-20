import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../services/api';
import { Bell, AlertTriangle, Info, CheckCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const data = await apiService.getNotifications();
            setNotifications(data);
        } catch (error) {
            toast.error('Failed to load notifications');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = (id) => {
        setNotifications(notifications.filter(n => n.id !== id));
        toast.success('Notification marked as read');
    };

    const getIcon = (type) => {
        switch (type) {
            case 'alert': return <AlertTriangle className="w-5 h-5 text-threat-high" />;
            case 'success': return <CheckCircle className="w-5 h-5 text-green-400" />;
            default: return <Info className="w-5 h-5 text-cyber-accent" />;
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-white">Notifications</h1>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <Bell className="w-4 h-4" />
                    <span>{notifications.length} Unread</span>
                </div>
            </div>

            <div className="space-y-4">
                <AnimatePresence>
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse bg-slate-800/50 rounded-xl p-4 h-20"></div>
                        ))
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 bg-slate-800/30 rounded-xl border border-slate-700/50 border-dashed">
                            <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No new notifications</p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <motion.div
                                key={notification.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/70 transition-colors relative group"
                            >
                                <div className="flex items-start space-x-4">
                                    <div className="p-2 bg-slate-900 rounded-lg">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-white font-medium mb-1">{notification.message}</h3>
                                        <p className="text-xs text-gray-400">
                                            {new Date(notification.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => markAsRead(notification.id)}
                                        className="p-1 text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Notifications;
