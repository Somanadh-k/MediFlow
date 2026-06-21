import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader/PageHeader';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import Badge from '../../components/Badge/Badge';
import { medicineService } from '../../services/medicineService';

const ExpiryMonitor = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await medicineService.getMedicines();
        setMedicines(data);
      } catch (error) {
        console.error('Failed to load medicines for expiry monitor', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const expiredData = medicines.filter(m => m.days_remaining !== null && m.days_remaining < 0);
  const days30Data = medicines.filter(m => m.days_remaining !== null && m.days_remaining >= 0 && m.days_remaining <= 30);
  const days60Data = medicines.filter(m => m.days_remaining !== null && m.days_remaining > 30 && m.days_remaining <= 60);
  const days90Data = medicines.filter(m => m.days_remaining !== null && m.days_remaining > 60 && m.days_remaining <= 90);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE': return <Badge variant="success">Active</Badge>;
      case 'NEAR_EXPIRY': return <Badge variant="warning">Near Expiry</Badge>;
      case 'EXPIRED': return <Badge variant="danger">Expired</Badge>;
      case 'QUARANTINED': return <Badge variant="neutral">Quarantined</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const columns = [
    { header: 'Medicine Name', accessor: 'medicine_name' },
    { header: 'Batch', accessor: 'batch_no' },
    { header: 'Stock', accessor: 'stock_quantity', align: 'right' },
    { header: 'Expiry Date', accessor: 'expiry_date' },
    { header: 'Status', cell: (row) => getStatusBadge(row.status) },
  ];

  if (loading) return <div>Loading expiry data...</div>;

  return (
    <div>
      <PageHeader 
        title="Expiry Monitor" 
        subtitle="Track upcoming expirations and manage expired inventory."
      />

      <div style={{ display: 'grid', gap: '2rem' }}>
        <Card title="Expired (Action Required)" className="border-danger">
          <Table columns={columns} data={expiredData} />
        </Card>

        <Card title="Expiring within 30 Days">
          <Table columns={columns} data={days30Data} />
        </Card>

        <Card title="Expiring within 60 Days">
          <Table columns={columns} data={days60Data} />
        </Card>

        <Card title="Expiring within 90 Days">
          <Table columns={columns} data={days90Data} />
        </Card>
      </div>
    </div>
  );
};

export default ExpiryMonitor;
