import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
);

const API_BASE = 'http://localhost:8000/api';

export default function Dashboard() {
  const { token, logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [latestMetrics, setLatestMetrics] = useState({});
  const [cpuHistory, setCpuHistory] = useState(null);
  const [ramHistory, setRamHistory] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const fetchWithAuth = (url) => {
    return fetch(url, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
    });
  };

  const handleFetchError = (error) => {
    console.error('[v0] Fetch error:', error);
    setIsConnected(false);
  };

  const loadLatest = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/metrics/latest/?page_size=5`);
      if (!res.ok) throw new Error('Failed to fetch metrics');
      const data = await res.json();
      const metrics = {};
      if (data.results && Array.isArray(data.results)) {
        data.results.forEach(m => {
          metrics[m.metric_type] = m.value || m.text_value;
        });
      }
      setLatestMetrics(metrics);
      setIsConnected(true);
    } catch (e) {
      handleFetchError(e);
    }
  };

  const loadHistory = async () => {
    try {
      // CPU History
      const cpuRes = await fetchWithAuth(`${API_BASE}/metrics/history/?hours=24&type=CPU_Usage`);
      if (!cpuRes.ok) throw new Error('Failed to fetch CPU history');
      const cpuData = await cpuRes.json();
      
      if (cpuData.results && Array.isArray(cpuData.results)) {
        const cpuResults = [...cpuData.results].reverse();
        const cpuLabels = cpuResults.map(m => new Date(m.timestamp).toLocaleTimeString());
        const cpuValues = cpuResults.map(m => parseFloat(m.value) || 0);
        
        setCpuHistory({
          labels: cpuLabels,
          datasets: [{
            label: 'CPU Usage (%)',
            data: cpuValues,
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 3,
            pointBackgroundColor: '#38bdf8',
            pointBorderColor: '#0f172a',
            pointBorderWidth: 2,
          }],
        });
      }

      // RAM History
      const ramRes = await fetchWithAuth(`${API_BASE}/metrics/history/?hours=24&type=Available_RAM`);
      if (!ramRes.ok) throw new Error('Failed to fetch RAM history');
      const ramData = await ramRes.json();
      
      if (ramData.results && Array.isArray(ramData.results)) {
        const ramResults = [...ramData.results].reverse();
        const ramLabels = ramResults.map(m => new Date(m.timestamp).toLocaleTimeString());
        const ramValues = ramResults.map(m => parseFloat(m.value) || 0);
        
        setRamHistory({
          labels: ramLabels,
          datasets: [{
            label: 'Available RAM (MB)',
            data: ramValues,
            borderColor: '#fbbf24',
            backgroundColor: 'rgba(251, 191, 36, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 3,
            pointBackgroundColor: '#fbbf24',
            pointBorderColor: '#0f172a',
            pointBorderWidth: 2,
          }],
        });
      }

      setIsConnected(true);
    } catch (e) {
      handleFetchError(e);
    }
  };

  const loadAlerts = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/alerts/`);
      if (!res.ok) throw new Error('Failed to fetch alerts');
      const data = await res.json();
      setAlerts(data.results || []);
      setIsConnected(true);
    } catch (e) {
      handleFetchError(e);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      await Promise.all([loadLatest(), loadHistory(), loadAlerts()]);
      setIsLoading(false);
    };

    loadAll();
    const interval = setInterval(loadLatest, 10000);
    return () => clearInterval(interval);
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: {
          color: '#e2e8f0',
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#e2e8f0',
        bodyColor: '#e2e8f0',
        borderColor: '#334155',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        ticks: { color: '#94a3b8' },
        grid: { color: '#334155' },
      },
      x: {
        ticks: { color: '#94a3b8' },
        grid: { color: '#334155' },
      },
    },
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="header-logo">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="logo-icon">
              <defs>
                <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00FFCC" />
                  <stop offset="100%" stopColor="#38BDF8" />
                </linearGradient>
              </defs>
              <path d="M50 10 L75 25 L75 50 Q75 75 50 90 Q25 75 25 50 L25 25 Z" fill="url(#headerGradient)" strokeWidth="1" stroke="#00FFCC" />
              <circle cx="35" cy="45" r="4" fill="#0B0F19" />
              <circle cx="50" cy="55" r="4" fill="#0B0F19" />
              <circle cx="65" cy="45" r="4" fill="#0B0F19" />
            </svg>
          </div>
          <div className="header-info">
            <h1>CERBERUS</h1>
            <p>Enterprise Monitoring Platform</p>
          </div>
        </div>
        <div className="header-right">
          <div className="user-section">
            <span className="user-icon">👤</span>
            <span className="username">{user?.username || 'User'}</span>
          </div>
          {isConnected ? (
            <span className="status-indicator online">
              <span className="status-dot"></span>
              Connected
            </span>
          ) : (
            <span className="status-indicator offline">
              <span className="status-dot"></span>
              Disconnected
            </span>
          )}
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      {!isConnected && (
        <div className="connection-notice">
          <span className="notice-icon">⚠</span>
          <span>Unable to connect to backend API. Make sure the Django server is running at http://localhost:8000</span>
        </div>
      )}

      <div className="cards">
        <div className="card">
          <h3>CPU Usage</h3>
          <p className="metric-value">
            {isConnected && Object.keys(latestMetrics).length > 0
              ? `${parseFloat(latestMetrics.CPU_Usage || 0).toFixed(1)}%`
              : '--'}
          </p>
        </div>
        <div className="card">
          <h3>Available RAM</h3>
          <p className="metric-value">
            {isConnected && Object.keys(latestMetrics).length > 0
              ? `${Math.round(latestMetrics.Available_RAM || 0)} MB`
              : '--'}
          </p>
        </div>
        <div className="card">
          <h3>Disk Free (C:)</h3>
          <p className="metric-value">
            {isConnected && Object.keys(latestMetrics).length > 0
              ? `${parseFloat(latestMetrics.Disk_Free_C || 0).toFixed(2)} GB`
              : '--'}
          </p>
        </div>
      </div>

      <div className="charts">
        <div className="chart-container">
          <h3>CPU History (24h)</h3>
          {cpuHistory ? (
            <Line data={cpuHistory} options={chartOptions} />
          ) : (
            <p className="placeholder">{isLoading ? 'Loading...' : 'No data available'}</p>
          )}
        </div>
        <div className="chart-container">
          <h3>RAM History (24h)</h3>
          {ramHistory ? (
            <Line data={ramHistory} options={chartOptions} />
          ) : (
            <p className="placeholder">{isLoading ? 'Loading...' : 'No data available'}</p>
          )}
        </div>
      </div>

      <div className="alerts-section">
        <h3>Security & Alerts</h3>
        {alerts.length === 0 ? (
          <div className="alerts-empty">
            <div className="secure-icon">✓</div>
            <p className="secure-message">System Secure: No active alerts</p>
            <p className="secure-subtitle">All integrity checks passed</p>
          </div>
        ) : (
          <div className="alerts-list">
            {alerts.map(alert => (
              <div key={alert.id} className="alert-item">
                <div className="alert-badge">!</div>
                <div className="alert-content">
                  <span className="alert-time">{new Date(alert.timestamp).toLocaleString()}</span>
                  <span className="alert-message">{alert.text_value || alert.value}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
