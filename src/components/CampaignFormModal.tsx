import React, { useState } from 'react';
import { DonationCampaign, CampaignCategory, CampaignStatus } from '../types';
import { dataService } from '../services/dataService';
import { X, AlertCircle } from 'lucide-react';
import { ImageUploader } from './ImageUploader';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  campaignToEdit?: DonationCampaign | null;
  adminEmail: string;
  onSuccess: () => void;
}

export const CampaignFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  campaignToEdit,
  adminEmail,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState(campaignToEdit?.title || '');
  const [description, setDescription] = useState(campaignToEdit?.description || '');
  const [category, setCategory] = useState<CampaignCategory>(campaignToEdit?.category || 'INFRASTRUCTURE');
  const [targetAmount, setTargetAmount] = useState<number>(campaignToEdit?.targetAmount || 20000000);
  const [coverImage, setCoverImage] = useState(campaignToEdit?.coverImage || '');
  const [status, setStatus] = useState<CampaignStatus>(campaignToEdit?.status || 'ACTIVE');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim()) {
      setError('Please provide a campaign title and detailed description.');
      return;
    }

    if (targetAmount < 1000000) {
      setError('Target amount should be at least UGX 1,000,000.');
      return;
    }

    setSubmitting(true);
    try {
      if (campaignToEdit) {
        const res = await dataService.updateDonationCampaign(campaignToEdit.id, {
          title: title.trim(),
          description: description.trim(),
          category,
          targetAmount,
          coverImage: coverImage.trim() || undefined,
          status,
        }, adminEmail);

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Failed to update campaign');
        }
      } else {
        const res = await dataService.createDonationCampaign({
          title: title.trim(),
          description: description.trim(),
          category,
          targetAmount,
          coverImage: coverImage.trim() || 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
          status: 'ACTIVE',
          startDate: new Date().toISOString(),
        }, adminEmail);

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Failed to create campaign');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '580px', width: '95%' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.25rem', color: '#0B203E', margin: 0, fontWeight: 700 }}>
            {campaignToEdit ? 'Edit Development Campaign' : 'Launch New School Campaign'}
          </h3>
          <button 
            type="button" 
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #F87171', color: '#991B1B', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Campaign Title <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. MASSH Computer Lab 50 Modern PCs Fund"
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as CampaignCategory)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
              >
                <option value="INFRASTRUCTURE">Infrastructure & Buildings</option>
                <option value="BURSARY">Needy Student Bursary</option>
                <option value="ACADEMIC">Academic & Science Labs</option>
                <option value="SPORTS">Sports & Recreation</option>
                <option value="WELFARE">Alumni Welfare</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Target Amount (UGX) <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="number"
                required
                min={1000000}
                step={500000}
                value={targetAmount}
                onChange={e => setTargetAmount(parseInt(e.target.value, 10) || 0)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Project Description & Objectives <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Explain what the funds will be used for, how it benefits MASSH students or alumni, and milestones..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
            />
          </div>

          <ImageUploader
            value={coverImage}
            onChange={setCoverImage}
            label="Cover Image (Direct Upload or Link)"
            helpText="Upload a campaign photo from your phone or computer, or paste a link."
          />

          {campaignToEdit && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Campaign Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as CampaignStatus)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
              >
                <option value="ACTIVE">ACTIVE (Accepting Donations)</option>
                <option value="GOAL_REACHED">GOAL REACHED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting}
              style={{ padding: '0.65rem 1.5rem' }}
            >
              {submitting ? 'Saving...' : (campaignToEdit ? 'Update Campaign' : 'Launch Campaign')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
