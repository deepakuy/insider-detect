import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const AdminSimulationControl = ({ isOpen, onClose, onComplete }) => {
    const [scenarios, setScenarios] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedScenario, setSelectedScenario] = useState('');
    const [targetUser, setTargetUser] = useState('');
    const [loading, setLoading] = useState(false);
    const [simulating, setSimulating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [scenariosData, usersData] = await Promise.all([
                apiService.getScenarios(),
                apiService.getUsers()
            ]);
            setScenarios(scenariosData);
            setUsers(usersData);
            if (scenariosData.length > 0) setSelectedScenario(scenariosData[0].id);
            if (usersData.length > 0) setTargetUser(usersData[0].username);
        } catch (error) {
            toast.error("Failed to load simulation data");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSimulating(true);
        try {
            await apiService.runSimulation(selectedScenario, targetUser);
            toast.success("Simulation started successfully!");
            if (onComplete) onComplete();
            onClose();
        } catch (error) {
            toast.error("Failed to start simulation");
            console.error(error);
        } finally {
            setSimulating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full border border-gray-700 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
                        <div className="flex items-center space-x-2">
                            <span className="text-2xl">⚡</span>
                            <h2 className="text-xl font-bold text-white">Attack Simulation Engine</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin h-8 w-8 border-4 border-red-500 rounded-full border-t-transparent"></div>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Select Attack Scenario
                                    </label>
                                    <select
                                        value={selectedScenario}
                                        onChange={(e) => setSelectedScenario(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                                        required
                                    >
                                        {scenarios.map((scenario) => (
                                            <option key={scenario.id} value={scenario.id}>
                                                {scenario.name} ({scenario.severity.toUpperCase()})
                                            </option>
                                        ))}
                                    </select>
                                    {selectedScenario && (
                                        <p className="mt-2 text-sm text-gray-400 italic">
                                            {scenarios.find(s => s.id === selectedScenario)?.description}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Target User
                                    </label>
                                    <select
                                        value={targetUser}
                                        onChange={(e) => setTargetUser(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                                        required
                                    >
                                        {users.map((user) => (
                                            <option key={user.username} value={user.username}>
                                                {user.username} ({user.role})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-4">
                                    <div className="flex items-start space-x-3">
                                        <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <p className="text-sm text-red-200">
                                            Warning: This will generate real security alerts and incidents in the system.
                                            Automated response rules may be triggered.
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={simulating || loading}
                                className={`px-6 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-lg transition-all transform hover:scale-105 font-bold shadow-lg flex items-center space-x-2 ${(simulating || loading) ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                            >
                                {simulating ? (
                                    <>
                                        <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                                        <span>Simulating...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>Execute Attack</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AdminSimulationControl;
