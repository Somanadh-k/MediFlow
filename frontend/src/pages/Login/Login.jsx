import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../../components/Card/Card';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1 className="login-logo">MediFlow <span className="text-accent">AI</span></h1>
          <p className="login-subtitle">Sign in to your account</p>
        </div>
        
        <Card className="login-card">
          <form onSubmit={handleLogin} className="login-form">
            {error && <div className="input-error-msg" style={{marginBottom: '1rem', textAlign: 'center'}}>{error}</div>}
            
            <Input 
              label="Email Address" 
              type="email" 
              placeholder="admin@mediflow.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <Input 
              label="Password" 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
            <div className="login-options">
              <label className="remember-me">
                <input type="checkbox" /> Remember me
              </label>
              <a href="#" className="forgot-password">Forgot password?</a>
            </div>
            
            <Button type="submit" variant="primary" size="lg" className="login-btn" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>

            <div className="login-footer" style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Don't have an account? </span>
              <Link to="/signup" style={{ color: 'var(--color-accent-primary)', textDecoration: 'none' }}>Create Account</Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
