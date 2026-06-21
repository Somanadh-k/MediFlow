import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader/PageHeader';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import Badge from '../../components/Badge/Badge';
import { inventoryService } from '../../services/inventoryService';

const QuarantineCenter = () => {
  const [quarantineData, setQuarantineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadQuarantine = async () => {
      try {
        const data = await inventoryService.getQuarantine();
        setQuarantineData(data);
      } catch (error) {
        console.error('Failed to load quarantine records', error);
        setError('Unable to load quarantine records at this time.');
      } finally {
        setLoading(false);
      }
    };
    loadQuarantine();
  }, []);

  const columns = [
    { header: 'Medicine Name', accessor: 'medicine_name' },
    { header: 'Batch', accessor: 'batch_no' },
    { header: 'Quantity', accessor: 'stock_quantity', align: 'right' },
    { header: 'Reason', cell: (row) => <Badge variant={row.reason === 'EXPIRED' ? 'warning' : 'danger'}>{row.reason}</Badge> },
    { header: 'Quarantine Date', cell: (row) => new Date(row.date).toLocaleDateString() },
    { header: 'Actions', cell: () => <Button variant="text" size="sm">Review</Button> },
  ];

  return (
    <div>
      <PageHeader 
        title="Quarantine Center" 
        subtitle="Manage medicines isolated from active inventory."
      />

      <Card>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading quarantine records...</div>
        ) : error ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-danger)' }}>{error}</div>
        ) : (
          <Table columns={columns} data={quarantineData} />
        )}
      </Card>
    </div>
  );
};

export default QuarantineCenter;
