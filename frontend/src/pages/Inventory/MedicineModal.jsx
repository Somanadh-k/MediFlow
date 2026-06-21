import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal/Modal';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import { medicineService } from '../../services/medicineService';
import './MedicineModal.css';

const MedicineModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
  const defaultState = {
    medicine_name: '',
    barcode: '',
    batch_no: '',
    vendor_id: '5ebcc729-fc58-48c2-9f40-a1b99ddfe9cb',
    purchase_price: '',
    selling_price: '',
    stock_quantity: '',
    reorder_level: '',
    expiry_date: '',
  };

  const [formData, setFormData] = useState(defaultState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const vendors = [
    { id: '5ebcc729-fc58-48c2-9f40-a1b99ddfe9cb', name: 'Apollo Distributors' }
  ];

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        medicine_name: initialData.medicine_name || '',
        barcode: initialData.barcode || '',
        batch_no: initialData.batch_no || '',
        vendor_id: initialData.vendor_id || '5ebcc729-fc58-48c2-9f40-a1b99ddfe9cb',
        purchase_price: initialData.purchase_price !== undefined ? initialData.purchase_price : '',
        selling_price: initialData.selling_price !== undefined ? initialData.selling_price : '',
        stock_quantity: initialData.stock_quantity !== undefined ? initialData.stock_quantity : '',
        reorder_level: initialData.reorder_level !== undefined ? initialData.reorder_level : '',
        expiry_date: initialData.expiry_date || '',
      });
      setError(null);
    } else if (isOpen && !initialData) {
      setFormData(defaultState);
      setError(null);
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!formData.medicine_name || !formData.barcode || !formData.batch_no || !formData.expiry_date) {
      return 'Please fill all required string fields.';
    }
    if (Number(formData.purchase_price) < 0 || Number(formData.selling_price) < 0) {
      return 'Prices must be non-negative.';
    }
    if (Number(formData.stock_quantity) < 0 || Number(formData.reorder_level) < 0) {
      return 'Stock and reorder levels must be non-negative.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        purchase_price: parseFloat(formData.purchase_price) || 0,
        selling_price: parseFloat(formData.selling_price) || 0,
        stock_quantity: parseInt(formData.stock_quantity, 10) || 0,
        reorder_level: parseInt(formData.reorder_level, 10) || 0,
      };

      if (initialData) {
        await medicineService.updateMedicine(initialData.id, payload);
      } else {
        payload.status = 'ACTIVE';
        await medicineService.createMedicine(payload);
      }
      
      onSuccess();
    } catch (err) {
      console.error('Failed to save medicine:', err);
      setError(err.message || 'Failed to save medicine. Please try again or check for duplicate barcodes.');
    } finally {
      setLoading(false);
    }
  };

  const title = initialData ? 'Edit Medicine' : 'Add New Medicine';

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={title}
      footer={
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', width: '100%' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Save Medicine'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="add-medicine-form">
        {error && <div className="error-message" style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>{error}</div>}
        
        <div className="form-grid">
          <Input 
            label="Medicine Name *" 
            name="medicine_name" 
            value={formData.medicine_name} 
            onChange={handleChange} 
            placeholder="e.g. Paracetamol 500mg" 
            required 
          />
          <Input 
            label="Barcode *" 
            name="barcode" 
            value={formData.barcode} 
            onChange={handleChange} 
            placeholder="Scan or enter barcode" 
            required 
          />
          <Input 
            label="Batch Number *" 
            name="batch_no" 
            value={formData.batch_no} 
            onChange={handleChange} 
            placeholder="e.g. BT-2023-XYZ" 
            required 
          />
          <Input 
            label="Expiry Date *" 
            name="expiry_date" 
            type="date" 
            value={formData.expiry_date} 
            onChange={handleChange} 
            required 
          />
          
          <div className="input-group">
            <label className="input-label">Vendor *</label>
            <select 
              name="vendor_id" 
              value={formData.vendor_id} 
              onChange={handleChange} 
              className="custom-select"
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              {vendors.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          
          <Input 
            label="Stock Quantity *" 
            name="stock_quantity" 
            type="number" 
            min="0"
            value={formData.stock_quantity} 
            onChange={handleChange} 
            required 
          />
          <Input 
            label="Purchase Price *" 
            name="purchase_price" 
            type="number" 
            step="0.01"
            min="0"
            value={formData.purchase_price} 
            onChange={handleChange} 
            required 
          />
          <Input 
            label="Selling Price *" 
            name="selling_price" 
            type="number" 
            step="0.01"
            min="0"
            value={formData.selling_price} 
            onChange={handleChange} 
            required 
          />
          <Input 
            label="Reorder Level *" 
            name="reorder_level" 
            type="number" 
            min="0"
            value={formData.reorder_level} 
            onChange={handleChange} 
            required 
          />
        </div>
      </form>
    </Modal>
  );
};

export default MedicineModal;
