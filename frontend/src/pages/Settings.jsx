import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { User, Bell, Lock, Globe, Moon } from 'lucide-react';

const Settings = () => {
    const { user } = useAuth();

    const sections = [
        {
            title: 'Profile Settings',
            icon: User,
            items: [
                { label: 'Username', value: user?.username, type: 'text', readOnly: true },
                { label: 'Email', value: user?.email, type: 'email', readOnly: true },
                { label: 'Role', value: user?.role, type: 'text', readOnly: true },
            ]
        },
        {
            title: 'Notifications',
            icon: Bell,
            items: [
                { label: 'Email Alerts', checked: true, type: 'toggle' },
                { label: 'Browser Notifications', checked: false, type: 'toggle' },
            ]
        },
        {
            title: 'Security',
            icon: Lock,
            items: [
                { label: 'Two-Factor Authentication', checked: true, type: 'toggle' },
                { label: 'Session Timeout', value: '30 minutes', type: 'select' },
            ]
        }
    ];

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>

            <div className="space-y-6">
                {sections.map((section, idx) => {
                    const Icon = section.icon;
                    return (
                        <motion.div
                            key={section.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6"
                        >
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="p-2 bg-slate-700/50 rounded-lg">
                                    <Icon className="w-5 h-5 text-cyber-accent" />
                                </div>
                                <h2 className="text-lg font-semibold text-white">{section.title}</h2>
                            </div>

                            <div className="space-y-4">
                                {section.items.map((item, itemIdx) => (
                                    <div key={itemIdx} className="flex items-center justify-between py-2">
                                        <span className="text-gray-300">{item.label}</span>
                                        {item.type === 'toggle' ? (
                                            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${item.checked ? 'bg-cyber-accent' : 'bg-slate-700'}`}>
                                                <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${item.checked ? 'translate-x-6' : ''}`} />
                                            </div>
                                        ) : (
                                            <input
                                                type={item.type}
                                                value={item.value || ''}
                                                readOnly={item.readOnly}
                                                className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyber-accent transition-colors disabled:opacity-50"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default Settings;
