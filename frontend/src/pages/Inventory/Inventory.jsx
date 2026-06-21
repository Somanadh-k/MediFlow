import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/PageHeader/PageHeader';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import Badge from '../../components/Badge/Badge';
import { Plus, Search, Filter } from 'lucide-react';
import { medicineService } from '../../services/medicineService';
import MedicineModal from './MedicineModal';

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);

  const loadMedicines = useCallback(async () => {
    setLoading(true);
    try {
      const data = await medicineService.getMedicines();
      setMedicines(data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load medicines:', err);
      setError('Unable to load inventory data at this time.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedicines();
  }, [loadMedicines]);

  const handleEditClick = (medicine) => {
    setEditingMedicine(medicine);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (medicine) => {
    const confirmed = window.confirm(`Are you sure you want to delete ${medicine.medicine_name}?\n\nThis action cannot be undone.`);
    if (confirmed) {
      try {
        await medicineService.deleteMedicine(medicine.id);
        loadMedicines();
      } catch (err) {
        console.error('Failed to delete medicine:', err);
        alert('Failed to delete medicine. Please try again.');
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE': return <Badge variant="success">Active</Badge>;
      case 'LOW_STOCK': return <Badge variant="warning">Low Stock</Badge>;
      case 'OUT_OF_STOCK': return <Badge variant="danger">Out of Stock</Badge>;
      case 'NEAR_EXPIRY': return <Badge variant="primary">Near Expiry</Badge>;
      case 'QUARANTINED': return <Badge variant="neutral">Quarantined</Badge>;
      case 'EXPIRED': return <Badge variant="danger">Expired</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const columns = [
    { header: 'Medicine Name', accessor: 'medicine_name' },
    { header: 'Barcode', accessor: 'barcode' },
    { header: 'Batch', accessor: 'batch_no' },
    { header: 'Stock', accessor: 'stock_quantity', align: 'right' },
    { header: 'Expiry Date', accessor: 'expiry_date' },
    { header: 'Status', cell: (row) => getStatusBadge(row.status) },
    { 
      header: 'Actions', 
      cell: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="text" size="sm" onClick={() => handleEditClick(row)}>Edit</Button>
          <Button variant="text" size="sm" onClick={() => handleDeleteClick(row)} style={{ color: 'var(--color-danger)' }}>Delete</Button>
        </div>
      ) 
    },
  ];

  const filteredMedicines = (medicines || []).filter(m => {
    const nameMatch = m?.medicine_name ? m.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const barcodeMatch = m?.barcode ? m.barcode.includes(searchTerm) : false;
    return nameMatch || barcodeMatch;
  });

  return (
    <div>
      <PageHeader 
        title="Inventory Management" 
        subtitle="Manage medicines, stock levels, and barcodes."
        action={
          <Button variant="primary" onClick={() => { setEditingMedicine(null); setIsModalOpen(true); }}>
            <Plus size={18} /> Add Medicine
          </Button>
        }
      />

      <Card>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <Input 
              placeholder="Search by name or barcode..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="secondary">
            <Filter size={18} /> Filters
          </Button>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading inventory...</div>
        ) : error ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-danger)' }}>{error}</div>
        ) : (
          <Table columns={columns} data={filteredMedicines} />
        )}
      </Card>

      <MedicineModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingMedicine(null);
        }} 
        onSuccess={() => {
          setIsModalOpen(false);
          setEditingMedicine(null);
          loadMedicines();
        }}
        initialData={editingMedicine}
      />
    </div>
  );
};

export default Inventory;
