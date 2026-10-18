import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import LoginPage from './LoginPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [backendStatus, setBackendStatus] = useState("checking...");

  useEffect(() => {
    fetch("http://localhost:5000/api/health")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Backend response failed");
        }
        return response.json();
      })
      .then(data => {
      console.log('Backend response:', data);
          setBackendStatus(data.status || 'Connected');
      })
      .catch((error) => {
        console.error('Backend connection error:', error);
        setBackendStatus('Disconnected');
      });
  }, []);

// temporary demo login, not secure for real accounts.
const handleLogin = (gmail, password) => {
  if (
gmail === "admin@gmail.com" && password === "password123"
  ) {
    setIsAuthenticated(true);
    return true;
  }
  return false;
};

return isAuthenticated ? (
  <>
    <div
     style={{
  padding: '10px 14px',
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#111111',
  backgroundColor: '#ffffff',
  position: 'relative',
  zIndex: 99999,
}}
    >
      Backend status: {backendStatus}
    </div>

    <Dashboard onLogout={() => setIsAuthenticated(false)} />
  </>
) : (
  <LoginPage onLogin={handleLogin} />
);
}


export default App;