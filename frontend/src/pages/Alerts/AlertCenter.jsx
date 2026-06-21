import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader/PageHeader';
import AlertCard from '../../components/AlertCard/AlertCard';
import { AlertTriangle, ShieldAlert, Clock, Info } from 'lucide-react';
import { alertService } from '../../services/alertService';

const AlertCenter = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const data = await alertService.getAlerts();
        setAlerts(data);
      } catch (error) {
        console.error('Failed to load alerts', error);
        setError('Unable to load alerts at this time.');
      } finally {
        setLoading(false);
      }
    };
    loadAlerts();
  }, []);

  const getAlertIcon = (category, type) => {
    if (category === 'Agent') return Info;
    if (category === 'Stock') return AlertTriangle;
    if (category === 'Expiry') {
      if (type === 'EXPIRED_MEDICINE' || type === 'QUARANTINE_ALERT') return ShieldAlert;
      return Clock;
    }
    return Info;
  };

  const getAlertType = (category, type, priority) => {
    if (priority === 'CRITICAL') return 'danger';
    if (priority === 'HIGH') return 'warning';
    return 'info';
  };

  const getTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60); // minutes
    if (diff < 60) return `${diff} mins ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  return (
    <div>
      <PageHeader 
        title="Alert Center" 
        subtitle="System notifications and critical alerts timeline."
      />

      <div style={{ maxWidth: '800px' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading alerts...</div>
        ) : error ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-danger)' }}>{error}</div>
        ) : alerts.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No active alerts.</div>
        ) : (
          alerts.map(alert => (
            <AlertCard 
              key={alert.id}
              title={alert.alert_type.replace(/_/g, ' ')}
              medicineName={alert.medicine_name}
              priority={alert.priority}
              recommendedAction={alert.recommended_action}
              description={alert.description}
              time={getTimeAgo(alert.created_at)}
              type={getAlertType(alert.category, alert.alert_type, alert.priority)}
              icon={getAlertIcon(alert.category, alert.alert_type)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default AlertCenter;
