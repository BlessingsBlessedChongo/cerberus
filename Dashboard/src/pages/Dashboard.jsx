import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend
);

const API_BASE = 'http://localhost:8000/api';

export default function Dashboard() {
  const { token, logout } = useContext(AuthContext);
  const [latestMetrics, setLatestMetrics] = useState({});
  const [cpuHistory, setCpuHistory] = useState([]);
  const [ramHistory, setRamHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const fetchWithAuth = (url) => {
    return fetch(url, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
    });
  };

  const loadLatest = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/metrics/latest/?page_size=5`);
      const data = await res.json();
      const metrics = {};
      data.results.forEach(m => {
        metrics[m.metric_type] = m.value || m.text_value;
      });
      setLatestMetrics(metrics);
    } catch (e) { console.error(e); }
  };

  const loadHistory = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/metrics/history/?hours=24&type=CPU_Usage`);
      const data = await res.json();
      const labels = data.results.map(m => new Date(m.timestamp).toLocaleTimeString()).reverse();
      const values = data.results.map(m => m.value).reverse();
      setCpuHistory({ labels, datasets: [{ label: 'CPU %', data: values, borderColor: 'rgb(75, 192, 192)' }] });

      const ramRes = await fetchWithAuth(`${API_BASE}/metrics/history/?hours=24&type=Available_RAM`);
      const ramData = await ramRes.json();
      const ramLabels = ramData.results.map(m => new Date(m.timestamp).toLocaleTimeString()).reverse();
      const ramValues = ramData.results.map(m => m.value).reverse();
      setRamHistory({ labels: ramLabels, datasets: [{ label: 'RAM (MB)', data: ramValues, borderColor: 'rgb(255, 159, 64)' }] });
    } catch (e) { console.error(e); }
  };

  const loadAlerts = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/alerts/`);
      const data = await res.json();
      setAlerts(data.results);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    loadLatest();
    loadHistory();
    loadAlerts();
    const interval = setInterval(loadLatest, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard">
      <header>
        <h1>🐕 Cerberus Dashboard</h1>
        <button onClick={logout}>Logout</button>
      </header>

      <div className="cards">
        <div className="card">
          <h3>CPU Usage</h3>
          <p>{latestMetrics.CPU_Usage ? `${latestMetrics.CPU_Usage}%` : '--'}</p>
        </div>
        <div className="card">
          <h3>Available RAM</h3>
          <p>{latestMetrics.Available_RAM ? `${latestMetrics.Available_RAM} MB` : '--'}</p>
        </div>
        <div className="card">
          <h3>Disk Free (C:)</h3>
          <p>{latestMetrics.Disk_Free_C ? `${latestMetrics.Disk_Free_C} GB` : '--'}</p>
        </div>
      </div>

      <div className="charts">
        <div className="chart-container">
          <h3>CPU History (24h)</h3>
          {cpuHistory.labels ? <Line data={cpuHistory} /> : <p>Loading...</p>}
        </div>
        <div className="chart-container">
          <h3>RAM History (24h)</h3>
          {ramHistory.labels ? <Line data={ramHistory} /> : <p>Loading...</p>}
        </div>
      </div>

      <div className="alerts">
        <h3>Recent Alerts</h3>
        {alerts.length === 0 ? <p>No alerts</p> : (
          <ul>
            {alerts.map(alert => (
              <li key={alert.id}>
                {new Date(alert.timestamp).toLocaleString()} - {alert.text_value || alert.value}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}