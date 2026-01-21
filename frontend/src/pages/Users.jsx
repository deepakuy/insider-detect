import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiService } from '../services/api';
import { User, Shield, AlertTriangle, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const Users = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await apiService.getUsers();
            console.log("Users API response:", data);

            if (Array.isArray(data)) {
                setUsers(data);
            } else {
                console.error("Expected array of users, got:", data);
                setUsers([]);
            }
        } catch (error) {
            toast.error('Failed to load users');
            console.error(error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = (Array.isArray(users) ? users : []).filter(user =>
        (user?.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user?.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">User Directory</h1>
                    <p className="text-gray-400">Manage and monitor system users</p>
                </div>
                <div className="flex space-x-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyber-accent"
                        />
                    </div>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-gray-300 hover:text-white transition-colors">
                        <Filter className="w-5 h-5" />
                        <span>Filter</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse bg-slate-800/50 rounded-xl p-6 h-48"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers.map((user) => (
                        <motion.div
                            key={user.username}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ y: -5 }}
                            className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-accent/5 rounded-full blur-3xl group-hover:bg-cyber-accent/10 transition-colors"></div>

                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-cyber-accent to-cyber-glow rounded-full flex items-center justify-center">
                                    <User className="w-6 h-6 text-white" />
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${user.role === 'admin'
                                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                                    : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                    }`}>
                                    {user.role}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-1">{user.username}</h3>
                            <p className="text-sm text-gray-400 mb-4">{user.email}</p>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                                <button
                                    onClick={() => navigate(`/users/${user.username}`)}
                                    className="text-sm text-cyber-accent hover:text-cyber-glow transition-colors"
                                >
                                    View Profile
                                </button>
                                <div className="flex space-x-2">
                                    <Shield className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer transition-colors" />
                                    <AlertTriangle className="w-4 h-4 text-gray-500 hover:text-threat-high cursor-pointer transition-colors" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Users;
