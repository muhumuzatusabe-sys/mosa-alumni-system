import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Key, 
  ShieldCheck, 
  Clock, 
  ExternalLink, 
  Save,
  Check,
  Inbox
} from 'lucide-react';
import { 
  emailService, 
  EmailSettings, 
  EmailDispatchLog 
} from '../services/emailService';

export const EmailManager: React.FC = () => {
  const [settings, setSettings] = useState<EmailSettings>(emailService.getEmailSettings());
  const [logs, setLogs] = useState<EmailDispatchLog[]>([]);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; provider?: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'logs'>('config');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setSettings(emailService.getEmailSettings());
    setLogs(emailService.getEmailLogs());
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    emailService.saveEmailSettings(settings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail || !testEmail.includes('@')) {
      setTestResult({ success: false, message: 'Please provide a valid recipient email address.' });
      return;
    }

    setSendingTest(true);
    setTestResult(null);

    try {
      const res = await emailService.sendTestEmail(testEmail);
      if (res.success) {
        if (res.provider === 'local_offline') {
          setTestResult({
            success: true,
            provider: 'Offline / Audit Log',
            message: `Dispatched in offline audit mode. To deliver real emails to actual external inboxes, please enter your Brevo, Resend, or EmailJS API key below.`,
          });
        } else {
          setTestResult({
            success: true,
            provider: res.provider,
            message: `Test email successfully dispatched to ${testEmail} via ${res.provider?.toUpperCase()}! Please check your inbox and spam folder.`,
          });
        }
      } else {
        setTestResult({
          success: false,
          message: res.error || 'Failed to dispatch test email. Check your provider credentials.',
        });
      }
      setLogs(emailService.getEmailLogs());
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'An unexpected error occurred during test dispatch.',
      });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #166534 0%, #15803D 100%)',
        color: '#FFFFFF',
        padding: '1.5rem',
        borderRadius: '14px',
        boxShadow: '0 4px 16px rgba(17, 61, 43, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#047857',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FCD34D'
            }}>
              <Mail size={20} />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>
              Official Email Dispatcher & Verification
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.86rem', color: '#A7F3D0', maxWidth: '650px', lineHeight: 1.5 }}>
            Deliver registration OTPs, application receipt notices, and membership approval letters directly into alumni email inboxes.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            style={{
              padding: '0.6rem 1.1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'config' ? '#FCD34D' : 'rgba(255,255,255,0.15)',
              color: activeTab === 'config' ? '#15803D' : '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s'
            }}
          >
            <Key size={16} />
            <span>Provider Settings</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('logs');
              setLogs(emailService.getEmailLogs());
            }}
            style={{
              padding: '0.6rem 1.1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'logs' ? '#FCD34D' : 'rgba(255,255,255,0.15)',
              color: activeTab === 'logs' ? '#15803D' : '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s'
            }}
          >
            <Clock size={16} />
            <span>Dispatch History ({logs.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PROVIDER CONFIGURATION & TEST */}
      {activeTab === 'config' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem' }}>
          {/* Settings Form */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', color: '#0F172A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="#059669" />
              <span>Email Gateway Configuration</span>
            </h3>

            {saveSuccess && (
              <div style={{
                background: '#ECFDF5',
                border: '1px solid #6EE7B7',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                color: '#065F46',
                fontSize: '0.86rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <Check size={16} />
                <span>Email dispatcher settings saved successfully!</span>
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Primary Dispatch Provider
                </label>
                <select
                  value={settings.provider}
                  onChange={e => setSettings({ ...settings, provider: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.9rem',
                    background: '#FFFFFF'
                  }}
                >
                  <option value="auto">Auto-Detect (Gmail SMTP → Brevo → Resend → EmailJS)</option>
                  <option value="smtp">Official Gmail SMTP (masshalumni@gmail.com • Connected)</option>
                  <option value="brevo">Brevo / Sendinblue (Recommended • 300 free emails/day)</option>
                  <option value="resend">Resend (Modern Transactional REST API)</option>
                  <option value="emailjs">EmailJS (Client-side browser dispatch)</option>
                  <option value="web3forms">Web3Forms (Zero-config webhook)</option>
                </select>
                <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem', display: 'block' }}>
                  Choose which delivery network sends emails to recipient inboxes.
                </span>
              </div>

              {/* Official Gmail SMTP Settings */}
              <div style={{
                background: '#F0FDF4',
                border: '1.5px solid #86EFAC',
                borderRadius: '10px',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#065F46' }}>
                    Official MASSH Gmail SMTP Gateway
                  </label>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    background: '#DCFCE7',
                    color: '#166534'
                  }}>
                    Active &bull; Google App Password Linked
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#475569', display: 'block', marginBottom: '0.2rem' }}>Gmail Address</label>
                    <input
                      type="email"
                      value={settings.smtpUser || ''}
                      onChange={e => setSettings({ ...settings, smtpUser: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#475569', display: 'block', marginBottom: '0.2rem' }}>Google App Password (16 chars)</label>
                    <input
                      type="password"
                      placeholder="•••• •••• •••• ••••"
                      value={settings.smtpPass || ''}
                      onChange={e => setSettings({ ...settings, smtpPass: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                <span style={{ fontSize: '0.74rem', color: '#15803D', marginTop: '0.2rem', display: 'block' }}>
                  Linked to Google Account: <strong>masshalumni@gmail.com</strong> (App: MASSH ALUMNI).
                </span>
              </div>

              {/* Brevo Settings */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                    Brevo (Sendinblue) API Key
                  </label>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    background: settings.brevoApiKey ? '#DCFCE7' : '#F1F5F9',
                    color: settings.brevoApiKey ? '#166534' : '#64748B'
                  }}>
                    {settings.brevoApiKey ? 'Configured' : 'Optional'}
                  </span>
                </div>
                <input
                  type="password"
                  placeholder="xkeysib-..."
                  value={settings.brevoApiKey || ''}
                  onChange={e => setSettings({ ...settings, brevoApiKey: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '0.35rem', display: 'block' }}>
                  Get your free API key at <a href="https://app.brevo.com/settings/keys/api" target="_blank" rel="noreferrer" style={{ color: '#059669', fontWeight: 600 }}>brevo.com</a> (Free tier sends 300 emails/day).
                </span>
              </div>

              {/* Resend Settings */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                    Resend API Key
                  </label>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    background: settings.resendApiKey ? '#DCFCE7' : '#F1F5F9',
                    color: settings.resendApiKey ? '#166534' : '#64748B'
                  }}>
                    {settings.resendApiKey ? 'Configured' : 'Optional'}
                  </span>
                </div>
                <input
                  type="password"
                  placeholder="re_..."
                  value={settings.resendApiKey || ''}
                  onChange={e => setSettings({ ...settings, resendApiKey: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '0.35rem', display: 'block' }}>
                  Get your API key at <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" style={{ color: '#059669', fontWeight: 600 }}>resend.com</a>.
                </span>
              </div>

              {/* EmailJS Settings */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                    EmailJS Configuration
                  </label>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    background: settings.emailjsPublicKey ? '#DCFCE7' : '#F1F5F9',
                    color: settings.emailjsPublicKey ? '#166534' : '#64748B'
                  }}>
                    {settings.emailjsPublicKey ? 'Configured' : 'Optional'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#475569', display: 'block', marginBottom: '0.2rem' }}>Service ID</label>
                    <input
                      type="text"
                      placeholder="service_xxx"
                      value={settings.emailjsServiceId || ''}
                      onChange={e => setSettings({ ...settings, emailjsServiceId: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#475569', display: 'block', marginBottom: '0.2rem' }}>Template ID</label>
                    <input
                      type="text"
                      placeholder="template_xxx"
                      value={settings.emailjsTemplateId || ''}
                      onChange={e => setSettings({ ...settings, emailjsTemplateId: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#475569', display: 'block', marginBottom: '0.2rem' }}>Public Key</label>
                  <input
                    type="password"
                    placeholder="Public Key from Account Settings"
                    value={settings.emailjsPublicKey || ''}
                    onChange={e => setSettings({ ...settings, emailjsPublicKey: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Sender Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                    Sender Name
                  </label>
                  <input
                    type="text"
                    value={settings.senderName}
                    onChange={e => setSettings({ ...settings, senderName: e.target.value })}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                    Sender Email
                  </label>
                  <input
                    type="email"
                    value={settings.senderEmail}
                    onChange={e => setSettings({ ...settings, senderEmail: e.target.value })}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                style={{
                  background: '#166534',
                  color: '#FFFFFF',
                  padding: '0.85rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 10px rgba(17, 61, 43, 0.2)'
                }}
              >
                <Save size={18} />
                <span>Save Email Gateway Settings</span>
              </button>
            </form>
          </div>

          {/* Test Dispatch Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1.5px solid #E2E8F0',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#0F172A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Send size={18} color="#059669" />
                <span>Live Test Dispatch</span>
              </h3>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#64748B', lineHeight: 1.45 }}>
                Send a real test email to verify that your configured email provider delivers directly to an external recipient inbox.
              </p>

              <form onSubmit={handleSendTest} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                    Recipient Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. yourname@gmail.com"
                    value={testEmail}
                    onChange={e => setTestEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.7rem',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingTest || !testEmail}
                  style={{
                    background: sendingTest ? '#6EE7B7' : '#059669',
                    color: '#FFFFFF',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: sendingTest ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {sendingTest ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                  <span>{sendingTest ? 'Dispatching Test Email...' : 'Send Test Email to Inbox'}</span>
                </button>
              </form>

              {testResult && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.85rem',
                  borderRadius: '8px',
                  background: testResult.success ? '#ECFDF5' : '#FEF2F2',
                  border: `1.5px solid ${testResult.success ? '#6EE7B7' : '#FCA5A5'}`,
                  fontSize: '0.82rem',
                  color: testResult.success ? '#065F46' : '#991B1B'
                }}>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                    {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{testResult.success ? 'Test Dispatched' : 'Dispatch Failed'}</span>
                  </div>
                  <div>{testResult.message}</div>
                </div>
              )}
            </div>

            {/* Quick Status Pill */}
            <div style={{
              background: '#F8FAFC',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              padding: '1.25rem',
              fontSize: '0.82rem',
              color: '#475569'
            }}>
              <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
                How Email Delivery Works:
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.6 }}>
                <li><strong>Verification OTP:</strong> Sent when an alumnus registers or resets their password.</li>
                <li><strong>Application Notice:</strong> Sent with reference ID when an application is submitted.</li>
                <li><strong>Approval Letter:</strong> Sent with permanent MA number when membership is approved.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DISPATCH HISTORY LOGS */}
      {activeTab === 'logs' && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0F172A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Inbox size={18} color="#059669" />
              <span>Recent Dispatched Emails ({logs.length})</span>
            </h3>

            <button
              type="button"
              onClick={() => setLogs(emailService.getEmailLogs())}
              style={{
                background: '#F1F5F9',
                border: '1px solid #CBD5E1',
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <RefreshCw size={14} />
              <span>Refresh Logs</span>
            </button>
          </div>

          {logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
              <Mail size={36} color="#CBD5E1" style={{ margin: '0 auto 0.75rem auto' }} />
              <div style={{ fontWeight: 600 }}>No email dispatch events recorded yet.</div>
              <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                When applicants verify their email or register, events will appear here in real-time.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', color: '#475569' }}>
                    <th style={{ padding: '0.75rem 0.85rem' }}>Date & Time</th>
                    <th style={{ padding: '0.75rem 0.85rem' }}>Recipient</th>
                    <th style={{ padding: '0.75rem 0.85rem' }}>Subject</th>
                    <th style={{ padding: '0.75rem 0.85rem' }}>Category</th>
                    <th style={{ padding: '0.75rem 0.85rem' }}>Provider</th>
                    <th style={{ padding: '0.75rem 0.85rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.75rem 0.85rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', fontWeight: 600, color: '#0F172A' }}>
                        <div>{log.to}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 400 }}>{log.toName}</div>
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', color: '#334155', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.subject}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          background: log.category === 'VERIFICATION' ? '#FEF3C7' : log.category === 'MEMBERSHIP_APPROVED' ? '#DCFCE7' : '#E0E7FF',
                          color: log.category === 'VERIFICATION' ? '#92400E' : log.category === 'MEMBERSHIP_APPROVED' ? '#166534' : '#3730A3'
                        }}>
                          {log.category}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', fontFamily: 'monospace', fontSize: '0.78rem', color: '#0F172A' }}>
                        {log.provider}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          background: log.status === 'DELIVERED' ? '#DCFCE7' : log.status === 'QUEUED' ? '#E0F2FE' : '#FEF3C7',
                          color: log.status === 'DELIVERED' ? '#166534' : log.status === 'QUEUED' ? '#075985' : '#92400E',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          {log.status === 'DELIVERED' && <Check size={12} />}
                          <span>{log.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
