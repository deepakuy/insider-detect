import React, { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Users, 
  TrendingUp, 
  Clock,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { apiService } from './services/api'

function Dashboard() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [alerts, setAlerts] = useState([])
  const [stats, setStats] = useState({
    totalAlerts: 0,
    criticalAlerts: 0,
    highAlerts: 0,
    mediumAlerts: 0,
    lowAlerts: 0
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const alertsData = await apiService.getRecentAlerts()
      setAlerts(alertsData)
      
      // Calculate stats
      const newStats = {
        totalAlerts: alertsData.length,
        criticalAlerts: alertsData.filter(a => a.threat_level === 'critical').length,
        highAlerts: alertsData.filter(a => a.threat_level === 'high').length,
        mediumAlerts: alertsData.filter(a => a.threat_level === 'medium').length,
        lowAlerts: alertsData.filter(a => a.threat_level === 'low').length
      }
      setStats(newStats)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
  }

  const getThreatColor = (level) => {
    switch (level) {
      case 'critical': return 'text-threat-critical bg-threat-critical/20 border-threat-critical/50'
      case 'high': return 'text-threat-high bg-threat-high/20 border-threat-high/50'
      case 'medium': return 'text-threat-medium bg-threat-medium/20 border-threat-medium/50'
      case 'low': return 'text-threat-low bg-threat-low/20 border-threat-low/50'
      default: return 'text-gray-400 bg-gray-400/20 border-gray-400/50'
    }
  }

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-cyber-dark/50 backdrop-blur-sm border border-cyber-accent/30 rounded-xl p-6 hover:border-cyber-accent/50 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('text-', 'bg-')}/20`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
          <span className="text-green-400">{trend}</span>
        </div>
      )}
    </div>
  )

  const AlertCard = ({ alert }) => (
    <div className="bg-cyber-dark/50 backdrop-blur-sm border border-cyber-accent/30 rounded-lg p-4 hover:border-cyber-accent/50 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-threat-critical" />
          <div>
            <h4 className="font-semibold text-white">{alert.user_id}</h4>
            <p className="text-sm text-gray-400">{alert.description}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getThreatColor(alert.threat_level)}`}>
          {alert.threat_level}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>Score: {alert.threat_score.toFixed(2)}</span>
        <span className="flex items-center">
          <Clock className="w-4 h-4 mr-1" />
          {new Date(alert.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-cyber-darker">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-cyber-dark border-r border-cyber-accent/30 transform transition-transform duration-200 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-cyber-accent/30">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-cyber-glow" />
            <h1 className="text-xl font-bold text-white">Threat Detector</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-8 px-4">
          <div className="space-y-2">
            <a href="#" className="flex items-center space-x-3 px-4 py-3 text-white bg-cyber-accent/20 rounded-lg border border-cyber-accent/30">
              <Activity className="w-5 h-5" />
              <span>Dashboard</span>
            </a>
            <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-cyber-accent/10 rounded-lg transition-colors">
              <AlertTriangle className="w-5 h-5" />
              <span>Alerts</span>
            </a>
            <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-cyber-accent/10 rounded-lg transition-colors">
              <Users className="w-5 h-5" />
              <span>Users</span>
            </a>
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-cyber-accent/30">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-cyber-accent/20 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-cyber-glow">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user?.username}</p>
              <p className="text-xs text-gray-400">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-2 text-gray-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-cyber-dark/50 backdrop-blur-sm border-b border-cyber-accent/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-white">Security Dashboard</h2>
            <div className="text-sm text-gray-400">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Alerts"
              value={stats.totalAlerts}
              icon={AlertTriangle}
              color="text-cyber-glow"
              trend="+12% from yesterday"
            />
            <StatCard
              title="Critical"
              value={stats.criticalAlerts}
              icon={Shield}
              color="text-threat-critical"
            />
            <StatCard
              title="High Risk"
              value={stats.highAlerts}
              icon={Activity}
              color="text-threat-high"
            />
            <StatCard
              title="Medium Risk"
              value={stats.mediumAlerts}
              icon={TrendingUp}
              color="text-threat-medium"
            />
          </div>

          {/* Recent Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-cyber-dark/50 backdrop-blur-sm border border-cyber-accent/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Alerts</h3>
                <div className="space-y-4">
                  {alerts.slice(0, 5).map((alert, index) => (
                    <AlertCard key={index} alert={alert} />
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <div className="bg-cyber-dark/50 backdrop-blur-sm border border-cyber-accent/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full bg-gradient-to-r from-cyber-accent to-cyber-glow text-white font-semibold py-3 px-4 rounded-lg hover:from-cyber-accent/80 hover:to-cyber-glow/80 transition-all duration-200">
                    Run Threat Scan
                  </button>
                  <button className="w-full bg-cyber-accent/20 text-cyber-accent font-semibold py-3 px-4 rounded-lg border border-cyber-accent/30 hover:bg-cyber-accent/30 transition-all duration-200">
                    Export Report
                  </button>
                  <button className="w-full bg-threat-critical/20 text-threat-critical font-semibold py-3 px-4 rounded-lg border border-threat-critical/30 hover:bg-threat-critical/30 transition-all duration-200">
                    Emergency Lockdown
                  </button>
                </div>
              </div>

              {/* System Status */}
              <div className="bg-cyber-dark/50 backdrop-blur-sm border border-cyber-accent/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">ML Models</span>
                    <span className="text-green-400 flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Database</span>
                    <span className="text-green-400 flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                      Connected
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Redis Cache</span>
                    <span className="text-green-400 flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                      Online
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Dashboard
