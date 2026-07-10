import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { AuthContext } from './context/AuthContext';

function App() {
  const [token, setToken] = useState(localStorage.getItem('cerberus_token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('cerberus_user') || 'null'));

  const saveToken = (userToken) => {
    localStorage.setItem('cerberus_token', userToken);
    setToken(userToken);
  };

  const saveUser = (userData) => {
    localStorage.setItem('cerberus_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('cerberus_token');
    localStorage.removeItem('cerberus_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, saveToken, saveUser, logout }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={token ? <Navigate to="/" /> : <Login />} />
          <Route path="/" element={token ? <Dashboard /> : <Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
