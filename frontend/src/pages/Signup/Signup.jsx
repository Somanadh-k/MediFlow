import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../../components/Card/Card';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import { useAuth } from '../../context/AuthContext';
import './Signup.css';

const Signup = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'PHARMACIST',
    password: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      await register(formData.full_name, formData.email, formData.password, formData.role);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <div className="signup-header">
          <h1 className="signup-logo">MediFlow <span className="text-accent">AI</span></h1>
          <p className="signup-subtitle">Create a new account</p>
        </div>
        
        <Card className="signup-card">
          <form onSubmit={handleSignup} className="signup-form">
            {error && <div className="input-error-msg" style={{marginBottom: '1rem', textAlign: 'center'}}>{error}</div>}
            {success && <div className="input-success-msg" style={{marginBottom: '1rem', textAlign: 'center', color: 'var(--color-success)'}}>Account created successfully! Redirecting...</div>}
            
            <Input 
              label="Full Name" 
              type="text" 
              name="full_name"
              placeholder="John Doe" 
              value={formData.full_name}
              onChange={handleChange}
              required
            />

            <Input 
              label="Email Address" 
              type="email" 
              name="email"
              placeholder="admin@mediflow.com" 
              value={formData.email}
              onChange={handleChange}
              required
            />
            
            <Input 
              label="Phone Number" 
              type="tel" 
              name="phone"
              placeholder="+1 234 567 890" 
              value={formData.phone}
              onChange={handleChange}
            />

            <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label className="input-label">Role</label>
              <select 
                name="role" 
                value={formData.role} 
                onChange={handleChange}
                className="input-field"
                style={{ appearance: 'auto', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                required
              >
                <option value="OWNER">Owner</option>
                <option value="PHARMACIST">Pharmacist</option>
                <option value="STAFF">Staff</option>
              </select>
            </div>

            <Input 
              label="Password" 
              type="password" 
              name="password"
              placeholder="••••••••" 
              value={formData.password}
              onChange={handleChange}
              required
            />

            <Input 
              label="Confirm Password" 
              type="password" 
              name="confirmPassword"
              placeholder="••••••••" 
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            
            <Button type="submit" variant="primary" size="lg" className="signup-btn" disabled={loading || success}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>

            <div className="signup-footer" style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Already have an account? </span>
              <Link to="/login" style={{ color: 'var(--color-accent-primary)', textDecoration: 'none' }}>Sign In</Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
