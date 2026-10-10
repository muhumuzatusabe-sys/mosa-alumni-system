import React, { useState, useEffect } from 'react';
import { AuditLog } from '../types';
import { dataService } from '../services/dataService';
import { X, ShieldCheck, History, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await dataService.getAuditLogs();
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '850px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History color="#0B203E" size={20} />
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#0B203E' }}>MOSA Administrative Audit Trail</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Immutable log of administrative actions, credential verifications, and MA number assignments
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={fetchLogs} style={{ padding: '0.35rem 0.65rem' }}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto', padding: '1rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>Loading audit logs...</div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>No audit records found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {logs.map(log => {
                const isApproval = log.action.includes('APPROVED');
                const isAssign = log.action.includes('MA_NUMBER');
                return (
                  <div
                    key={log.id}
                    style={{
                      background: isApproval || isAssign ? '#F0FDF4' : '#F8FAFC',
                      border: isApproval || isAssign ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            background: isApproval ? '#DCFCE7' : '#E2E8F0',
                            color: isApproval ? '#166534' : '#334155',
                          }}
                        >
                          {log.action}
                        </span>
                        <span style={{ color: '#0B203E', fontWeight: 600 }}>
                          Target: <code>{log.affectedRecord}</code>
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '0.8rem' }}>
                      <span>Performed by: <strong>{log.performedBy}</strong></span>
                      {log.metadata && (
                        <span>
                          {JSON.stringify(log.metadata)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
