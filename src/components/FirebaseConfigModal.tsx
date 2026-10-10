import React, { useState } from 'react';
import { dataService } from '../services/dataService';
import { isFirebaseConfigured, defaultEnvConfig } from '../services/firebase';
import { X, Database, Save, RotateCcw, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseConfigModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const isFbLive = isFirebaseConfigured();
  
  const [apiKey, setApiKey] = useState(defaultEnvConfig.apiKey || '');
  const [projectId, setProjectId] = useState(defaultEnvConfig.projectId || '');
  const [authDomain, setAuthDomain] = useState(defaultEnvConfig.authDomain || '');
  const [storageBucket, setStorageBucket] = useState(defaultEnvConfig.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(defaultEnvConfig.messagingSenderId || '');
  const [appId, setAppId] = useState(defaultEnvConfig.appId || '');

  if (!isOpen) return null;

  const handleSave = () => {
    dataService.saveFirebaseConfig({
      apiKey,
      projectId,
      authDomain,
      storageBucket,
      messagingSenderId,
      appId,
    });
  };

  const handleResetToDemo = () => {
    if (confirm('Switch to built-in Local Demo Simulation mode?')) {
      dataService.clearFirebaseConfig();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '580px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database color="#0B203E" size={20} />
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#0B203E' }}>Database Engine Settings</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Configure live Firebase Firestore or test with embedded local simulation
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Status banner */}
          <div style={{ padding: '0.85rem', background: isFbLive ? '#D1FAE5' : '#FEF3C7', border: isFbLive ? '1px solid #A7F3D0' : '1px solid #FDE68A', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: isFbLive ? '#059669' : '#D97706' }} />
            <div style={{ fontSize: '0.85rem', color: isFbLive ? '#065F46' : '#92400E' }}>
              <strong>Current Mode: {isFbLive ? 'Live Firebase Connected' : 'Local High-Fidelity Simulation'}</strong>
              <div style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                {isFbLive
                  ? 'All alumni, applications, audit logs, and MA numbers sync to your Firebase cloud project.'
                  : 'Running locally in your browser with identical Firestore collections, atomic transactions, and sample MASSH data.'}
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Firebase API Key</label>
            <input
              type="text"
              className="form-input"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
            />
          </div>

          <div className="grid-2">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Project ID</label>
              <input
                type="text"
                className="form-input"
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                placeholder="massh-mosa-alumni"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Auth Domain</label>
              <input
                type="text"
                className="form-input"
                value={authDomain}
                onChange={e => setAuthDomain(e.target.value)}
                placeholder="massh-mosa-alumni.firebaseapp.com"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Storage Bucket</label>
              <input
                type="text"
                className="form-input"
                value={storageBucket}
                onChange={e => setStorageBucket(e.target.value)}
                placeholder="massh-mosa-alumni.appspot.com"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">App ID</label>
              <input
                type="text"
                className="form-input"
                value={appId}
                onChange={e => setAppId(e.target.value)}
                placeholder="1:123456789:web:abcdef"
              />
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="btn btn-secondary" onClick={handleResetToDemo}>
            <RotateCcw size={15} /> Use Local Demo Mode
          </button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              <Save size={15} /> Save & Apply Config
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
