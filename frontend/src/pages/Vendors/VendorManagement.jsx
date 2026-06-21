import React from 'react';
import PageHeader from '../../components/PageHeader/PageHeader';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import Badge from '../../components/Badge/Badge';
import { Plus } from 'lucide-react';

const VendorManagement = () => {
  const vendors = [
    { id: 'V-001', name: 'PharmaCorp Ltd', contact: 'john@pharmacorp.com', phone: '+1 234-567-8901', status: 'ACTIVE' },
    { id: 'V-002', name: 'MediSupply Co', contact: 'sales@medisupply.com', phone: '+1 987-654-3210', status: 'INACTIVE' },
  ];

  const columns = [
    { header: 'Vendor Name', accessor: 'vendor_name' },
    { header: 'Contact Email', accessor: 'contact' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Status', cell: (row) => <Badge variant={row.status === 'ACTIVE' ? 'success' : 'neutral'}>{row.status}</Badge> },
    { header: 'Actions', cell: () => <Button variant="text" size="sm">Edit</Button> },
  ];

  return (
    <div>
      <PageHeader 
        title="Vendor Management" 
        subtitle="Manage your medicine suppliers and contacts."
        action={
          <Button variant="primary">
            <Plus size={18} /> Add Vendor
          </Button>
        }
      />

      <Card>
        <Table columns={columns} data={vendors} />
      </Card>
    </div>
  );
};

export default VendorManagement;
