import React from 'react';
import Card from '../Card/Card';
import './AlertCard.css';

const AlertCard = ({ title, medicineName, description, recommendedAction, priority, time, type = 'warning', icon: Icon }) => {
  return (
    <Card className={`alert-card alert-${type}`}>
      <div className="alert-content">
        <div className={`alert-icon-wrapper alert-icon-${type}`}>
          {Icon && <Icon size={20} />}
        </div>
        <div className="alert-details" style={{ width: '100%' }}>
          <div className="alert-header">
            <h4 className="alert-title">{title}</h4>
            <span className="alert-time">{time}</span>
          </div>
          
          <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
            {medicineName && <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--color-text)' }}>{medicineName}</strong>}
            {priority && (
              <span style={{ 
                display: 'inline-block',
                padding: '0.2rem 0.5rem', 
                borderRadius: '4px', 
                fontSize: '0.75rem', 
                fontWeight: 'bold', 
                backgroundColor: priority === 'CRITICAL' ? 'var(--color-danger)' : priority === 'HIGH' ? 'var(--color-warning)' : 'var(--color-border)', 
                color: priority === 'CRITICAL' || priority === 'HIGH' ? 'var(--color-background)' : 'var(--color-text)',
                marginTop: '0.25rem',
                marginBottom: '0.25rem'
              }}>
                {priority} PRIORITY
              </span>
            )}
          </div>

          <p className="alert-description">{description}</p>
          
          {recommendedAction && (
            <div style={{ 
              marginTop: '0.75rem', 
              padding: '0.5rem', 
              backgroundColor: 'var(--color-background-hover)', 
              borderRadius: '4px',
              borderLeft: `3px solid var(--color-${type})`
            }}>
              <strong style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>RECOMMENDED ACTION:</strong>
              <p style={{ margin: '0', fontSize: '0.9rem', color: 'var(--color-text)', fontWeight: '500' }}>{recommendedAction}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AlertCard;
