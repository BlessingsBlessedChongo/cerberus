import { useState, useEffect, useContext } from 'react';
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
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend
);

const API_BASE = 'http://localhost:8000/api';

export default function Dashboard() {
  const { token, logout } = useContext(AuthContext);
  const [latestMetrics, setLatestMetrics] = useState({});
  const [cpuHistory, setCpuHistory] = useState(null);
  const [ramHistory, setRamHistory] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

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
      <header>
        <h1>Cerberus Dashboard</h1>
        <div className="header-right">
          {isConnected ? (
            <span className="status-indicator online">Connected</span>
          ) : (
            <span className="status-indicator offline">Disconnected</span>
          )}
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </header>

      {isLoading && !isConnected && (
        <div className="connection-notice">
          ⚠ Unable to connect to backend API. Make sure the Django server is running at http://localhost:8000
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

      <div className="alerts">
        <h3>Recent Alerts</h3>
        {alerts.length === 0 ? (
          <p className="no-alerts">No alerts</p>
        ) : (
          <ul>
            {alerts.map(alert => (
              <li key={alert.id}>
                <span className="alert-time">{new Date(alert.timestamp).toLocaleString()}</span>
                <span className="alert-message">{alert.text_value || alert.value}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
