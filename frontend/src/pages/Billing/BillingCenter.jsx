import React from 'react';
import PageHeader from '../../components/PageHeader/PageHeader';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import Badge from '../../components/Badge/Badge';
import { Plus } from 'lucide-react';

const BillingCenter = () => {
  const invoices = [
    { id: 'INV-1001', customer: 'Walk-in', amount: '$45.00', date: '2024-06-20', status: 'PAID' },
    { id: 'INV-1002', customer: 'John Doe', amount: '$120.50', date: '2024-06-20', status: 'PENDING' },
    { id: 'INV-1003', customer: 'Jane Smith', amount: '$8.99', date: '2024-06-19', status: 'PAID' },
  ];

  const columns = [
    { header: 'Invoice #', accessor: 'id' },
    { header: 'Customer', accessor: 'customer' },
    { header: 'Date', accessor: 'date' },
    { header: 'Amount', accessor: 'amount', align: 'right' },
    { header: 'Status', cell: (row) => <Badge variant={row.status === 'PAID' ? 'success' : 'warning'}>{row.status}</Badge> },
    { header: 'Actions', cell: () => <Button variant="text" size="sm">View</Button> },
  ];

  return (
    <div>
      <PageHeader 
        title="Billing Center" 
        subtitle="Process sales and manage invoices."
        action={
          <Button variant="primary">
            <Plus size={18} /> New Sale
          </Button>
        }
      />

      <Card>
        <Table columns={columns} data={invoices} />
      </Card>
    </div>
  );
};

export default BillingCenter;
