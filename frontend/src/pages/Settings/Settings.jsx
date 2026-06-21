import React from 'react';
import PageHeader from '../../components/PageHeader/PageHeader';
import Card from '../../components/Card/Card';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';

const Settings = () => {
  return (
    <div>
      <PageHeader 
        title="Settings" 
        subtitle="Configure system preferences and notifications."
      />

      <div style={{ display: 'grid', gap: '2rem', maxWidth: '800px' }}>
        <Card title="Pharmacy Details">
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <Input label="Pharmacy Name" defaultValue="MediCare Pharmacy" />
            <Input label="Registration Number" defaultValue="PH-12345678" />
            <Input label="Contact Email" defaultValue="admin@medicare.com" />
            <Input label="Address" defaultValue="123 Health Street, Medical District" />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <Button variant="primary">Save Changes</Button>
            </div>
          </div>
        </Card>

        <Card title="Notification Preferences">
          <div style={{ display: 'grid', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked />
              <span>Email alerts for Low Stock</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked />
              <span>Email alerts for Near Expiry (30 days)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked />
              <span>Daily summary report</span>
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <Button variant="primary">Update Preferences</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
