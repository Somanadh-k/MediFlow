import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Clock, 
  ShieldAlert, 
  Receipt, 
  Bell, 
  Users, 
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Inventory', path: '/inventory', icon: Package },
    { name: 'Expiry Monitor', path: '/expiry', icon: Clock },
    { name: 'Quarantine', path: '/quarantine', icon: ShieldAlert },
    { name: 'Billing', path: '/billing', icon: Receipt },
    { name: 'Alerts', path: '/alerts', icon: Bell },
    { name: 'Vendors', path: '/vendors', icon: Users },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!isCollapsed && <div className="sidebar-logo">MediFlow <span className="text-accent">AI</span></div>}
        {isCollapsed && <div className="sidebar-logo-icon">M<span className="text-accent">A</span></div>}
        <button 
          className="collapse-btn" 
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {navItems.map((item) => (
            <li key={item.path} className="nav-item">
              <NavLink 
                to={item.path} 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                title={isCollapsed ? item.name : ''}
              >
                <item.icon size={20} className="nav-icon" />
                {!isCollapsed && <span className="nav-text">{item.name}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
