import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function ReportFound({ currentUserId }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Electronics',
    location: '',
    dateOccurred: new Date().toISOString().split('T')[0],
    imageUrl: '',
    contactEmail: '',
    contactPhone: '',
    tags: '',
  });

  const [status, setStatus] = useState({ loading: false, error: '', success: false });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: '', success: false });

    try {
      await api.reportItem({
        ...formData,
        type: 'FOUND',
        reportedBy: currentUserId,
      });

      setStatus({ loading: false, error: '', success: true });
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setStatus({
        loading: false,
        error: err.response?.data?.message || 'Failed to submit found item report',
        success: false,
      });
    }
  };

  return (
    <div className="form-container">
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Report a Found Item</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
          Help return lost belongings to their owner. If deposited at a campus security or reception desk, please note it.
        </p>
      </div>

      {status.error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <AlertCircle size={18} color="#ef4444" />
          <span style={{ fontSize: '0.9rem' }}>{status.error}</span>
        </div>
      )}

      {status.success && (
        <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <CheckCircle2 size={18} color="#10b981" />
          <span style={{ fontSize: '0.9rem' }}>Thank you! Item report registered. AI match search started.</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Item Title *</label>
          <input
            type="text"
            name="title"
            required
            placeholder="e.g. Black Sony WH-1000XM4 Headphones"
            value={formData.title}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Category *</label>
          <select name="category" value={formData.category} onChange={handleChange} className="form-select">
            <option value="Electronics">Electronics</option>
            <option value="Books & Notebooks">Books & Notebooks</option>
            <option value="ID & Cards">ID & Cards</option>
            <option value="Clothing & Accessories">Clothing & Accessories</option>
            <option value="Bags & Backpacks">Bags & Backpacks</option>
            <option value="Keys">Keys</option>
            <option value="Water Bottles">Water Bottles</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Found Location / Drop-off Desk *</label>
          <input
            type="text"
            name="location"
            required
            placeholder="e.g. Student Union Cafeteria / Turned in to Security Desk A"
            value={formData.location}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Date Found</label>
          <input
            type="date"
            name="dateOccurred"
            value={formData.dateOccurred}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Photo URL</label>
          <input
            type="url"
            name="imageUrl"
            placeholder="https://example.com/photo.jpg"
            value={formData.imageUrl}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description & Physical Condition</label>
          <textarea
            name="description"
            rows={4}
            required
            placeholder="Describe physical condition, color, markings, or safe storage notes..."
            value={formData.description}
            onChange={handleChange}
            className="form-textarea"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Finder Contact Email / Campus ID</label>
          <input
            type="email"
            name="contactEmail"
            placeholder="finder@university.edu"
            value={formData.contactEmail}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        <button type="submit" disabled={status.loading} className="btn-primary" style={{ backgroundColor: '#10b981' }}>
          {status.loading ? 'Submitting...' : 'Register Found Item'}
        </button>
      </form>
    </div>
  );
}
