import React, { useState } from 'react';
import axios from 'axios';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/login`, { username, password });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setShowWelcome(true);
        setTimeout(() => onLogin(res.data.user), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    }
  };

  if (showWelcome) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.85)' }}>
        <div className="text-center p-8" style={{ background: '#0a1628', border: '2px solid #ff6b2b' }}>
          <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: '#ff6b2b' }}>
            <span className="text-4xl">✓</span>
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#ff6b2b' }}>Welcome Back!</h2>
          <p className="text-gray-300">Hello {username}, redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a1628' }}>
      <div className="w-full max-w-md p-8" style={{ background: '#0d1b2a', border: '1px solid #1b2a4a' }}>
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Stritgrad Market Solutions" className="h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold" style={{ color: '#ff6b2b' }}>Stritgrad Market Solutions</h1>
          <p className="text-gray-400 mt-2">CRM System</p>
        </div>
        {error && <div className="mb-4 p-3 text-center" style={{ background: 'rgba(255,107,43,0.1)', border: '1px solid #ff6b2b', color: '#ff6b2b' }}>⚠️ {error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 mb-4"
            style={{ background: '#0a1628', border: '1px solid #1b2a4a', color: '#fff' }}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 mb-6"
            style={{ background: '#0a1628', border: '1px solid #1b2a4a', color: '#fff' }}
            required
          />
          <button type="submit" className="w-full py-3 font-bold" style={{ background: '#ff6b2b', color: '#fff' }}>
            Sign In
          </button>
        </form>
        <div className="mt-6 text-center text-gray-500 text-sm">
          Demo: admin / admin123 &nbsp;|&nbsp; agent1 / agent123
        </div>
      </div>
    </div>
  );
}

export default Login;