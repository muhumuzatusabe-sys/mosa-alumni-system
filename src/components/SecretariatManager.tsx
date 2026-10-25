import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Save, 
  ExternalLink,
  ShieldCheck,
  Check,
  ArrowUpDown
} from 'lucide-react';
import { AuthUser, SecretariatContact } from '../types';
import { dataService } from '../services/dataService';

interface SecretariatManagerProps {
  currentUser: AuthUser;
}

export const SecretariatManager: React.FC<SecretariatManagerProps> = ({ currentUser }) => {
  const [contacts, setContacts] = useState<SecretariatContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Partial<SecretariatContact> | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const data = await dataService.getSecretariatContacts(false);
      setContacts(data);
    } catch (err: any) {
      setNotice({ text: err.message || 'Failed to load Secretariat contacts.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const handleOpenAdd = () => {
    setEditingContact({
      id: '',
      title: '',
      name: '',
      publishedPhone: '+256 ',
      whatsAppNumber: '256',
      status: 'ACTIVE',
      displayOrder: contacts.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (contact: SecretariatContact) => {
    setEditingContact({ ...contact });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;
    if (!editingContact.title?.trim() || !editingContact.name?.trim()) {
      setNotice({ text: 'Office title and contact person name are required.', type: 'error' });
      return;
    }
    if (!editingContact.publishedPhone?.trim()) {
      setNotice({ text: 'Published telephone number is required.', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const payload: SecretariatContact = {
        id: editingContact.id || `sec-${Date.now()}`,
        title: editingContact.title.trim(),
        name: editingContact.name.trim(),
        publishedPhone: editingContact.publishedPhone.trim(),
        whatsAppNumber: (editingContact.whatsAppNumber || '').trim().replace(/[^0-9]/g, ''),
        status: editingContact.status || 'ACTIVE',
        displayOrder: Number(editingContact.displayOrder) || contacts.length + 1,
      };

      await dataService.saveSecretariatContact(payload);
      setIsModalOpen(false);
      setEditingContact(null);
      await loadContacts();
      setNotice({ text: 'Secretariat official contact updated successfully!', type: 'success' });
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      setNotice({ text: err.message || 'Failed to save contact.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the official contact for ${name}?`)) {
      return;
    }
    try {
      await dataService.deleteSecretariatContact(id);
      await loadContacts();
      setNotice({ text: `Contact for ${name} removed from directory.`, type: 'success' });
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      setNotice({ text: err.message || 'Failed to delete contact.', type: 'error' });
    }
  };

  const handleToggleStatus = async (contact: SecretariatContact) => {
    const updated: SecretariatContact = {
      ...contact,
      status: contact.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
    };
    try {
      await dataService.saveSecretariatContact(updated);
      await loadContacts();
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Card */}
      <div className="mosa-card" style={{ padding: '1.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Phone size={22} color="#0B203E" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0B203E', margin: 0 }}>
                Secretariat & WhatsApp Communications
              </h2>
            </div>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: '#64748B' }}>
              Manage official executive contacts (President, Secretary, Treasurer, etc.) displayed on the member-facing Contact directory with verified WhatsApp click-to-chat links.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: 700 }}
          >
            <Plus size={16} /> Add Official Contact
          </button>
        </div>

        {notice && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.75rem 1rem', 
            borderRadius: '8px', 
            fontSize: '0.85rem', 
            fontWeight: 600,
            background: notice.type === 'success' ? '#DCFCE7' : '#FEE2E2',
            color: notice.type === 'success' ? '#166534' : '#991B1B',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {notice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{notice.text}</span>
          </div>
        )}
      </div>

      {/* Contacts List Table */}
      <div className="mosa-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0B203E' }}>
            Registered Secretariat Officials ({contacts.length})
          </span>
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
            Changes appear immediately on public & member-facing Contact views
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Loading Secretariat contacts...</div>
        ) : contacts.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>
            No Secretariat contacts configured yet. Click "Add Official Contact" above.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #CBD5E1', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Order</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Office / Title</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Official Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Published Phone</th>
                  <th style={{ padding: '0.75rem 1rem' }}>WhatsApp Chat</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact, idx) => {
                  const cleanWA = contact.whatsAppNumber.replace(/[^0-9]/g, '');
                  return (
                    <tr key={contact.id} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748B', fontWeight: 700 }}>
                        #{contact.displayOrder}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0B203E' }}>
                        {contact.title}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#1E293B', fontWeight: 600 }}>
                        {contact.name}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>
                        <a href={`tel:${contact.publishedPhone}`} style={{ color: '#0B203E', textDecoration: 'none', fontWeight: 500 }}>
                          {contact.publishedPhone}
                        </a>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {cleanWA ? (
                          <a
                            href={`https://wa.me/${cleanWA}?text=Hello%20${encodeURIComponent(contact.name)},%20I%20am%20a%20member%20of%20MOSA.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              background: '#DCFCE7',
                              color: '#166534',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '6px',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              textDecoration: 'none'
                            }}
                          >
                            <MessageSquare size={13} /> Chat ({cleanWA})
                          </a>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>No WhatsApp</span>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <button
                          onClick={() => handleToggleStatus(contact)}
                          style={{
                            border: 'none',
                            padding: '0.25rem 0.55rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: contact.status === 'ACTIVE' ? '#D1FAE5' : '#F1F5F9',
                            color: contact.status === 'ACTIVE' ? '#065F46' : '#64748B'
                          }}
                          title="Click to toggle status"
                        >
                          {contact.status === 'ACTIVE' ? 'Active' : 'Hidden'}
                        </button>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => handleOpenEdit(contact)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                            title="Edit Official"
                          >
                            <Edit3 size={13} /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(contact.id, contact.name)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', color: '#991B1B' }}
                            title="Delete Official"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit / Add Modal */}
      {isModalOpen && editingContact && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: '520px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={20} color="#0B203E" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0B203E', fontWeight: 800 }}>
                  {editingContact.id ? 'Edit Secretariat Official' : 'Add Secretariat Official'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Office Title *</label>
                <input
                  className="form-control"
                  placeholder="e.g. National Chairperson or General Secretary"
                  value={editingContact.title || ''}
                  onChange={e => setEditingContact({ ...editingContact, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Official's Name *</label>
                <input
                  className="form-control"
                  placeholder="e.g. Hon. Muhumuza Tusabe"
                  value={editingContact.name || ''}
                  onChange={e => setEditingContact({ ...editingContact, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Published Phone *</label>
                  <input
                    className="form-control"
                    placeholder="e.g. +256 772 123456"
                    value={editingContact.publishedPhone || ''}
                    onChange={e => setEditingContact({ ...editingContact, publishedPhone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>WhatsApp Number</label>
                  <input
                    className="form-control"
                    placeholder="e.g. 256772123456"
                    value={editingContact.whatsAppNumber || ''}
                    onChange={e => setEditingContact({ ...editingContact, whatsAppNumber: e.target.value })}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Numbers only with country code</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Display Order</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={editingContact.displayOrder || 1}
                    onChange={e => setEditingContact({ ...editingContact, displayOrder: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Status</label>
                  <select
                    className="form-control"
                    value={editingContact.status || 'ACTIVE'}
                    onChange={e => setEditingContact({ ...editingContact, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                  >
                    <option value="ACTIVE">Active (Visible)</option>
                    <option value="INACTIVE">Hidden (Draft)</option>
                  </select>
                </div>
              </div>

              {editingContact.whatsAppNumber && (
                <div style={{ padding: '0.65rem 0.85rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.78rem', color: '#475569' }}>
                  WhatsApp link preview: <code>https://wa.me/{editingContact.whatsAppNumber.replace(/[^0-9]/g, '')}</code>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Save size={15} /> {saving ? 'Saving...' : 'Save Official'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
