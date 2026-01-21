import React from 'react';
import { motion } from 'framer-motion';
import {
    ShieldAlert,
    Terminal,
    FileText,
    User,
    Globe,
    CheckCircle,
    Clock,
    MessageSquare
} from 'lucide-react';
import { formatRelativeTime } from '../utils/formatters';

const TimelineItem = ({ item, index }) => {
    const isAnalyst = item.type === 'analyst_activity';

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative pl-8 pb-8 border-l border-slate-700 last:pb-0"
        >
            <div className={`absolute left-[-12px] top-0 p-1.5 rounded-full border-4 border-slate-900 ${isAnalyst ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                }`}>
                {isAnalyst ? <MessageSquare className="w-3 h-3" /> : <Terminal className="w-3 h-3" />}
            </div>

            <div className={`rounded-xl p-4 border ${isAnalyst
                ? 'bg-blue-900/10 border-blue-500/20'
                : 'bg-slate-800/50 border-slate-700'
                }`}>
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${isAnalyst ? 'bg-blue-500/20 text-blue-300' : 'bg-red-500/20 text-red-300'
                            }`}>
                            {isAnalyst ? item.details.split(' by ')[0] : item.details}
                        </span>
                        <div className="text-sm text-gray-400 mt-1 flex items-center space-x-2">
                            <Clock className="w-3 h-3" />
                            <span>{formatRelativeTime(new Date(item.timestamp))}</span>
                        </div>
                    </div>
                    {isAnalyst && (
                        <div className="flex items-center space-x-2 text-xs text-blue-300">
                            <User className="w-3 h-3" />
                            <span>{item.details.split(' by ')[1]}</span>
                        </div>
                    )}
                </div>

                {isAnalyst ? (
                    <p className="text-sm text-gray-300 italic border-l-2 border-blue-500/40 pl-3">
                        "{(item.metadata?.details || '').split('Comment: ')[1] || item.metadata?.details || 'No details'}"
                    </p>
                ) : (
                    <div className="text-sm text-gray-300 space-y-1">
                        {item.metadata.src_ip && (
                            <div className="flex items-center space-x-2">
                                <Globe className="w-3 h-3 text-gray-500" />
                                <span>Source: {item.metadata.src_ip}</span>
                            </div>
                        )}
                        {item.metadata.file_name && (
                            <div className="flex items-center space-x-2">
                                <FileText className="w-3 h-3 text-gray-500" />
                                <span>File: {item.metadata.file_name}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const Timeline = ({ events }) => {
    return (
        <div className="space-y-4">
            {events.map((item, index) => (
                <TimelineItem key={`${item.timestamp}-${index}`} item={item} index={index} />
            ))}
        </div>
    );
};

export default Timeline;
