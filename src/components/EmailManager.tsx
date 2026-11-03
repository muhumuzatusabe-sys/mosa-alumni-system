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
  Save,
  Check,
  Inbox,
  Sparkles,
  ExternalLink,
  Globe,
  Sliders,
  CheckCircle
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
  const [loadingCloud, setLoadingCloud] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoadingCloud(true);
    try {
      const synced = await emailService.syncEmailSettingsFromCloud();
      setSettings(synced);
    } catch {
      setSettings(emailService.getEmailSettings());
    } finally {
      setLoadingCloud(false);
    }
    setLogs(emailService.getEmailLogs());
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    emailService.saveEmailSettings(settings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
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
      // First save current inputs before test dispatch
      emailService.saveEmailSettings(settings);

      const res = await emailService.sendTestEmail(testEmail);
      if (res.success) {
        if (res.provider === 'local_offline') {
          setTestResult({
            success: true,
            provider: 'Offline / Direct Verification Mode',
            message: `Dispatched in offline audit mode. The email was logged in history. To deliver directly to external email inboxes (e.g. Gmail), enter a free API key from Brevo or Web3Forms below.`,
          });
        } else {
          setTestResult({
            success: true,
            provider: res.provider?.toUpperCase(),
            message: `Test email successfully dispatched to ${testEmail} via ${res.provider?.toUpperCase()}! Check your inbox (and spam/junk folder).`,
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
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0A271B 0%, #14532D 100%)',
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
              Official Email Gateway & Verification Settings
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.86rem', color: '#A7F3D0', maxWidth: '650px', lineHeight: 1.5 }}>
            Configure and test how the system dispatches registration OTP codes, application receipt confirmations, and permanent MA approval letters.
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
              color: activeTab === 'config' ? '#14532D' : '#FFFFFF',
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
              color: activeTab === 'logs' ? '#14532D' : '#FFFFFF',
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
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '1.5rem' }}>
          {/* Settings Form */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0F172A', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={18} color="#059669" />
                  <span>Email Provider Settings</span>
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.2rem' }}>
                  Select which email delivery service sends real emails to recipients. Settings sync to cloud database.
                </div>
              </div>
              {loadingCloud && (
                <span style={{ fontSize: '0.75rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Syncing...</span>
                </span>
              )}
            </div>

            {saveSuccess && (
              <div style={{
                background: '#ECFDF5',
                border: '1.5px solid #6EE7B7',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                color: '#065F46',
                fontSize: '0.88rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.25rem'
              }}>
                <Check size={18} />
                <span>Email gateway settings saved and synchronized to cloud database!</span>
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Primary Dispatch Mode Selector */}
              <div style={{ background: '#F8FAFC', padding: '1.15rem', borderRadius: '10px', border: '1.5px solid #CBD5E1' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.35rem' }}>
                  Active Email Dispatch Gateway
                </label>
                <select
                  value={settings.provider}
                  onChange={e => setSettings({ ...settings, provider: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1.5px solid #059669',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    background: '#FFFFFF',
                    color: '#0A271B',
                    outline: 'none'
                  }}
                >
                  <option value="auto">Auto-Detect Relay (Recommended • Brevo → Web3Forms → FormSubmit)</option>
                  <option value="brevo">Brevo / Sendinblue (Recommended for masshalumni@gmail.com • 300 free/day)</option>
                  <option value="web3forms">Web3Forms API (Instant CORS delivery to external inboxes)</option>
                  <option value="resend">Resend REST API (Modern transactional delivery)</option>
                  <option value="emailjs">EmailJS (Browser SDK client-side dispatch)</option>
                  <option value="smtp">Direct SMTP (requires browser-compatible relay)</option>
                </select>
                <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '0.45rem', lineHeight: 1.45 }}>
                  <strong>Auto-Detect:</strong> Delivers via whichever API key you enter below. If no API key is entered, it safely falls back to direct verification so users are never blocked.
                </div>
              </div>

              {/* Sender Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                    Sender Name
                  </label>
                  <input
                    type="text"
                    value={settings.senderName}
                    onChange={e => setSettings({ ...settings, senderName: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                    Official Sender Email
                  </label>
                  <input
                    type="email"
                    value={settings.senderEmail}
                    onChange={e => setSettings({ ...settings, senderEmail: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Provider 1: Brevo (Sendinblue) */}
              <div style={{
                background: settings.provider === 'brevo' || settings.brevoApiKey ? '#F0FDF4' : '#F8FAFC',
                border: settings.provider === 'brevo' ? '2px solid #059669' : '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>
                      1. Brevo (Sendinblue) REST API Key
                    </span>
                    <span style={{ fontSize: '0.72rem', background: '#DCFCE7', color: '#0A271B', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700 }}>
                      Recommended
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    background: settings.brevoApiKey ? '#DCFCE7' : '#F1F5F9',
                    color: settings.brevoApiKey ? '#0A271B' : '#64748B'
                  }}>
                    {settings.brevoApiKey ? 'Key Saved' : 'Not Set'}
                  </span>
                </div>
                <input
                  type="password"
                  placeholder="xkeysib-..."
                  value={settings.brevoApiKey || ''}
                  onChange={e => setSettings({ ...settings, brevoApiKey: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '0.35rem' }}>
                  Free plan sends 300 emails/day directly from <code>masshalumni@gmail.com</code>. Get your free API key at <a href="https://app.brevo.com/settings/keys/api" target="_blank" rel="noreferrer" style={{ color: '#059669', fontWeight: 700 }}>brevo.com/api-keys</a>.
                </div>
              </div>

              {/* Provider 2: Web3Forms */}
              <div style={{
                background: settings.provider === 'web3forms' || settings.web3formsAccessKey ? '#F0FDF4' : '#F8FAFC',
                border: settings.provider === 'web3forms' ? '2px solid #059669' : '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>
                    2. Web3Forms Access Key
                  </span>
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    background: settings.web3formsAccessKey ? '#DCFCE7' : '#F1F5F9',
                    color: settings.web3formsAccessKey ? '#0A271B' : '#64748B'
                  }}>
                    {settings.web3formsAccessKey ? 'Key Saved' : 'Optional'}
                  </span>
                </div>
                <input
                  type="password"
                  placeholder="Paste Web3Forms Access Key (e.g. 00000000-0000-0000-0000-000000000000)"
                  value={settings.web3formsAccessKey || ''}
                  onChange={e => setSettings({ ...settings, web3formsAccessKey: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '0.35rem' }}>
                  Instant zero-config email delivery. Get free access key at <a href="https://web3forms.com" target="_blank" rel="noreferrer" style={{ color: '#059669', fontWeight: 700 }}>web3forms.com</a> (requires no credit card).
                </div>
              </div>

              {/* Provider 3: Resend */}
              <div style={{
                background: settings.provider === 'resend' || settings.resendApiKey ? '#F0FDF4' : '#F8FAFC',
                border: settings.provider === 'resend' ? '2px solid #059669' : '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>
                    3. Resend API Key
                  </span>
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    background: settings.resendApiKey ? '#DCFCE7' : '#F1F5F9',
                    color: settings.resendApiKey ? '#0A271B' : '#64748B'
                  }}>
                    {settings.resendApiKey ? 'Key Saved' : 'Optional'}
                  </span>
                </div>
                <input
                  type="password"
                  placeholder="re_..."
                  value={settings.resendApiKey || ''}
                  onChange={e => setSettings({ ...settings, resendApiKey: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '0.35rem' }}>
                  Get your transactional API key at <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" style={{ color: '#059669', fontWeight: 700 }}>resend.com</a>.
                </div>
              </div>

              {/* Provider 4: EmailJS */}
              <div style={{
                background: settings.provider === 'emailjs' || settings.emailjsPublicKey ? '#F0FDF4' : '#F8FAFC',
                border: settings.provider === 'emailjs' ? '2px solid #059669' : '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>
                    4. EmailJS Configuration
                  </span>
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    background: settings.emailjsPublicKey ? '#DCFCE7' : '#F1F5F9',
                    color: settings.emailjsPublicKey ? '#0A271B' : '#64748B'
                  }}>
                    {settings.emailjsPublicKey ? 'Key Saved' : 'Optional'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.76rem', color: '#475569', display: 'block', marginBottom: '0.2rem' }}>Service ID</label>
                    <input
                      type="text"
                      placeholder="service_xxx"
                      value={settings.emailjsServiceId || ''}
                      onChange={e => setSettings({ ...settings, emailjsServiceId: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.76rem', color: '#475569', display: 'block', marginBottom: '0.2rem' }}>Template ID</label>
                    <input
                      type="text"
                      placeholder="template_xxx"
                      value={settings.emailjsTemplateId || ''}
                      onChange={e => setSettings({ ...settings, emailjsTemplateId: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.76rem', color: '#475569', display: 'block', marginBottom: '0.2rem' }}>Public Key</label>
                  <input
                    type="password"
                    placeholder="Public Key from EmailJS"
                    value={settings.emailjsPublicKey || ''}
                    onChange={e => setSettings({ ...settings, emailjsPublicKey: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Save Settings Action Button */}
              <button
                type="submit"
                style={{
                  background: '#0A271B',
                  color: '#FFFFFF',
                  padding: '0.9rem 1.5rem',
                  borderRadius: '10px',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(10, 39, 27, 0.25)',
                  marginTop: '0.5rem'
                }}
              >
                <Save size={18} />
                <span>Save Email Gateway Settings</span>
              </button>
            </form>
          </div>

          {/* Right Column: Live Test Dispatch & Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Live Test Tool */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1.5px solid #CBD5E1',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1rem', color: '#0F172A', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Send size={18} color="#059669" />
                <span>Live Test Dispatch</span>
              </h3>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#64748B', lineHeight: 1.45 }}>
                Send a real test email to check delivery into an external inbox.
              </p>

              <form onSubmit={handleSendTest} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
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
                      borderRadius: '8px',
                      border: '1.5px solid #CBD5E1',
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
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: sendingTest ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
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
                  <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                    {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{testResult.success ? 'Dispatch Completed' : 'Dispatch Failed'}</span>
                  </div>
                  <div>{testResult.message}</div>
                </div>
              )}
            </div>

            {/* Verification Flow Info Box */}
            <div style={{
              background: '#F0FDF4',
              borderRadius: '12px',
              border: '1.5px solid #86EFAC',
              padding: '1.25rem',
              fontSize: '0.82rem',
              color: '#14532D'
            }}>
              <div style={{ fontWeight: 800, color: '#0A271B', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle size={16} color="#059669" />
                <span>Verification Alignment Status:</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.6 }}>
                <li><strong>Registration OTP:</strong> 6-digit confirmation code dispatched when members sign up.</li>
                <li><strong>Application Notice:</strong> Dispatched immediately upon submission with reference number.</li>
                <li><strong>Approval Letter:</strong> Dispatched when the Secretariat approves membership with their permanent MA number.</li>
                <li><strong>Zero Lockout:</strong> If an external provider key runs out of quota, applicants can still verify directly on-screen without stalling.</li>
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
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0F172A', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Inbox size={18} color="#059669" />
              <span>Recent Dispatched Emails ({logs.length})</span>
            </h3>

            <button
              type="button"
              onClick={() => setLogs(emailService.getEmailLogs())}
              style={{
                background: '#F1F5F9',
                border: '1px solid #CBD5E1',
                padding: '0.45rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <RefreshCw size={13} />
              <span>Refresh</span>
            </button>
          </div>

          {logs.length === 0 ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94A3B8' }}>
              <Mail size={36} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
              <div>No emails dispatched in this session yet.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Timestamp</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Recipient</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Category</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Subject</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Provider</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.65rem 0.75rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                        {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600, color: '#0F172A' }}>
                        <div>{log.toName}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{log.to}</div>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <span style={{
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: log.category === 'VERIFICATION' ? '#FEF3C7' : log.category === 'MEMBERSHIP_APPROVED' ? '#DCFCE7' : '#EFF6FF',
                          color: log.category === 'VERIFICATION' ? '#92400E' : log.category === 'MEMBERSHIP_APPROVED' ? '#0A271B' : '#1E40AF',
                        }}>
                          {log.category}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', color: '#334155' }}>
                        {log.subject}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'monospace', fontSize: '0.76rem', color: '#0A271B' }}>
                        {log.provider}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          color: log.status === 'DELIVERED' ? '#059669' : log.status === 'FAILED' ? '#DC2626' : '#D97706',
                          fontWeight: 700,
                          fontSize: '0.78rem'
                        }}>
                          {log.status === 'DELIVERED' ? '✓ Delivered' : log.status === 'FAILED' ? '✗ Failed' : '● ' + log.status}
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
