import React, { useState } from 'react';
import { Search, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="navbar">
      <div className="navbar-search">
        <Search size={18} className="search-icon" />
        <input 
          type="text" 
          placeholder="Search medicines, barcodes, invoices..." 
          className="search-input"
        />
      </div>
      
      <div className="navbar-actions">
        <button className="action-btn position-relative">
          <Bell size={20} />
          <span className="notification-badge">3</span>
        </button>
        
        <div className="profile-menu" onClick={() => setMenuOpen(!menuOpen)} style={{ position: 'relative' }}>
          <div className="avatar">
            <User size={18} />
          </div>
          <div className="profile-info">
            <span className="profile-name">{user?.full_name || 'Admin User'}</span>
            <span className="profile-role" style={{ textTransform: 'capitalize' }}>
              {user?.role ? user.role.toLowerCase() : 'Owner'}
            </span>
          </div>

          {menuOpen && (
            <div className="dropdown-menu" style={{
              position: 'absolute',
              top: '100%',
              right: '0',
              marginTop: '0.5rem',
              backgroundColor: 'var(--color-card-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.5rem',
              minWidth: '150px',
              zIndex: 50,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
            }}>
              <button 
                onClick={logout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '0.5rem',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-danger)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
