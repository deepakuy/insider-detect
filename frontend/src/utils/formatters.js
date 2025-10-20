import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

// Date formatters
export const formatDate = (date) => {
  if (!date) return 'N/A';
  return format(new Date(date), 'MMM dd, yyyy');
};

export const formatTime = (date) => {
  if (!date) return 'N/A';
  return format(new Date(date), 'HH:mm:ss');
};

export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  return format(new Date(date), 'MMM dd, yyyy HH:mm:ss');
};

export const formatRelativeTime = (date) => {
  if (!date) return 'N/A';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const formatSmartDate = (date) => {
  if (!date) return 'N/A';
  const dateObj = new Date(date);
  
  if (isToday(dateObj)) {
    return `Today at ${format(dateObj, 'HH:mm')}`;
  } else if (isYesterday(dateObj)) {
    return `Yesterday at ${format(dateObj, 'HH:mm')}`;
  } else {
    return format(dateObj, 'MMM dd, HH:mm');
  }
};

// Threat level colors and styling
export const getThreatLevelColor = (level) => {
  const colors = {
    critical: {
      bg: 'bg-threat-critical',
      text: 'text-threat-critical',
      border: 'border-threat-critical',
      glow: 'shadow-threat-critical/50',
    },
    high: {
      bg: 'bg-threat-high',
      text: 'text-threat-high',
      border: 'border-threat-high',
      glow: 'shadow-threat-high/50',
    },
    medium: {
      bg: 'bg-threat-medium',
      text: 'text-threat-medium',
      border: 'border-threat-medium',
      glow: 'shadow-threat-medium/50',
    },
    low: {
      bg: 'bg-threat-low',
      text: 'text-threat-low',
      border: 'border-threat-low',
      glow: 'shadow-threat-low/50',
    },
  };
  
  return colors[level] || colors.low;
};

export const getThreatLevelIcon = (level) => {
  const icons = {
    critical: '🚨',
    high: '⚠️',
    medium: '⚡',
    low: 'ℹ️',
  };
  
  return icons[level] || icons.low;
};

// Number formatters
export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export const formatPercentage = (value, decimals = 1) => {
  return `${(value * 100).toFixed(decimals)}%`;
};

// Risk score formatters
export const getRiskScoreColor = (score) => {
  if (score >= 0.8) return 'text-threat-critical';
  if (score >= 0.6) return 'text-threat-high';
  if (score >= 0.4) return 'text-threat-medium';
  return 'text-threat-low';
};

export const getRiskScoreLabel = (score) => {
  if (score >= 0.8) return 'Critical';
  if (score >= 0.6) return 'High';
  if (score >= 0.4) return 'Medium';
  return 'Low';
};

// MITRE ATT&CK formatters
export const formatMITRETactic = (tactic) => {
  return tactic?.replace(/([A-Z])/g, ' $1').trim() || 'Unknown';
};

export const formatMITRETechnique = (technique) => {
  return technique?.replace(/([A-Z])/g, ' $1').trim() || 'Unknown';
};

// Status formatters
export const getStatusColor = (status) => {
  const colors = {
    open: 'text-blue-400',
    investigating: 'text-yellow-400',
    resolved: 'text-green-400',
    false_positive: 'text-gray-400',
    closed: 'text-gray-500',
  };
  
  return colors[status] || colors.open;
};

export const getStatusIcon = (status) => {
  const icons = {
    open: '🔍',
    investigating: '🕵️',
    resolved: '✅',
    false_positive: '❌',
    closed: '🔒',
  };
  
  return icons[status] || icons.open;
};

// IP address formatters
export const formatIP = (ip) => {
  if (!ip) return 'N/A';
  return ip;
};

export const getIPType = (ip) => {
  if (!ip) return 'unknown';
  
  // Check if it's a private IP
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
  ];
  
  if (privateRanges.some(range => range.test(ip))) {
    return 'private';
  }
  
  return 'public';
};

// File name formatters
export const getFileExtension = (filename) => {
  if (!filename) return '';
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const getFileTypeIcon = (filename) => {
  const ext = getFileExtension(filename);
  
  const icons = {
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    xls: '📊',
    xlsx: '📊',
    ppt: '📽️',
    pptx: '📽️',
    txt: '📄',
    csv: '📊',
    zip: '🗜️',
    rar: '🗜️',
    exe: '⚙️',
    dll: '⚙️',
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️',
    mp4: '🎥',
    avi: '🎥',
    mp3: '🎵',
    wav: '🎵',
  };
  
  return icons[ext] || '📁';
};
