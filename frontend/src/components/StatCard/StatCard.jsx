import React from 'react';
import Card from '../Card/Card';
import './StatCard.css';

const StatCard = ({ title, value, icon: Icon, trend, trendLabel, className = '' }) => {
  return (
    <Card className={`stat-card ${className}`}>
      <div className="stat-card-content">
        <div className="stat-card-info">
          <p className="stat-card-title">{title}</p>
          <h4 className="stat-card-value">{value}</h4>
          
          {(trend || trendLabel) && (
            <div className="stat-card-trend-container">
              {trend && (
                <span className={`stat-card-trend ${trend > 0 ? 'trend-up' : trend < 0 ? 'trend-down' : 'trend-neutral'}`}>
                  {trend > 0 ? '+' : ''}{trend}%
                </span>
              )}
              {trendLabel && <span className="stat-card-trend-label">{trendLabel}</span>}
            </div>
          )}
        </div>
        
        {Icon && (
          <div className="stat-card-icon">
            <Icon size={24} />
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
