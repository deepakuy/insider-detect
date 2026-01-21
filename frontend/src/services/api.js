import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Debug request
    try {
      // Only log minimal sensitive info
      // eslint-disable-next-line no-console
      console.debug('[API] Request:', {
        method: (config.method || 'GET').toUpperCase(),
        url: `${config.baseURL || ''}${config.url}`,
        hasAuth: !!token,
      });
    } catch (_) { }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    try {
      // eslint-disable-next-line no-console
      console.debug('[API] Response:', {
        url: response.config?.url,
        status: response.status,
      });
    } catch (_) { }
    return response;
  },
  (error) => {
    try {
      // eslint-disable-next-line no-console
      console.debug('[API] Error:', {
        url: error.config?.url,
        status: error.response?.status,
        message: error.response?.data?.detail || error.message,
      });
    } catch (_) { }
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }

    const message = error.response?.data?.detail || error.message || 'An error occurred';
    toast.error(message);

    return Promise.reject(error);
  }
);

// Simple retry helper with exponential backoff
async function requestWithRetry(fn, { retries = 2, baseDelayMs = 300 } = {}) {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= retries) throw err;
      const delay = baseDelayMs * Math.pow(2, attempt);
      // eslint-disable-next-line no-console
      console.warn(`[API] Retry attempt ${attempt + 1} in ${delay}ms`);
      await new Promise((res) => setTimeout(res, delay));
      attempt += 1;
    }
  }
}

export const apiService = {
  // Authentication
  login: async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Health check
  getHealth: async () => {
    return requestWithRetry(async () => {
      const response = await api.get('/health');
      return response.data;
    });
  },

  getStats: async () => {
    return requestWithRetry(async () => {
      const response = await api.get('/stats');
      return response.data;
    });
  },

  // Alerts
  getRecentAlerts: async (limit = 50) => {
    return requestWithRetry(async () => {
      const response = await api.get(`/alerts/recent?limit=${limit}`);
      return response.data;
    });
  },

  acknowledgeAlert: async (alertId) => {
    const response = await api.put(`/alerts/${alertId}/acknowledge`);
    return response.data;
  },

  // User Timeline
  getUserTimeline: async (userId, hours = 24) => {
    const response = await api.get(`/users/${userId}/timeline?hours=${hours}`);
    return response.data;
  },

  // Incidents
  getIncidents: async (status = null) => {
    return requestWithRetry(async () => {
      const config = status ? { params: { status } } : {};
      const response = await api.get('/incidents', config);
      return response.data;
    });
  },

  getIncident: async (id) => {
    return requestWithRetry(async () => {
      const response = await api.get(`/incidents/${id}`);
      return response.data;
    });
  },

  updateIncidentStatus: async (id, status, comment = null) => {
    const response = await api.patch(`/incidents/${id}/status`, { status, comment });
    return response.data;
  },

  getTimeline: async (limit = 100) => {
    const response = await api.get('/timeline', { params: { limit } });
    return response.data;
  },

  // Events
  ingestEvent: async (eventData) => {
    const response = await api.post('/events/ingest', eventData);
    return response.data;
  },

  // Predictions
  predictThreat: async (eventData) => {
    const response = await api.post('/predict', eventData);
    return response.data;
  },

  // User Management
  getUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  getUserProfile: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  getNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  // Simulation (Admin only)
  getScenarios: async () => {
    return requestWithRetry(async () => {
      const response = await api.get('/simulate/scenarios');
      return response.data;
    });
  },

  runSimulation: async (scenarioId, targetUser) => {
    return requestWithRetry(async () => {
      const response = await api.post('/simulate/attack', {
        scenario_id: scenarioId,
        target_user: targetUser
      });
      return response.data;
    });
  }
};

export default api;