import React, { useState, useEffect } from 'react';
import {
  BroadcastMessage,
  BroadcastChannel,
  BroadcastAudienceFilter,
  AuthUser,
  AlumniProfile,
  Chapter
} from '../types';
import { dataService } from '../services/dataService';
import {
  Send,
  Smartphone,
  Mail,
  MessageSquare,
  CheckCircle2,
  Users,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  Plus,
  Coins,
  Radio,
  FileText
} from 'lucide-react';

interface Props {
  currentUser: AuthUser | null;
  onOpenAuth: () => void;
}

export const BroadcastDesk: React.FC<Props> = ({ currentUser, onOpenAuth }) => {
  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [sampleAlumnus, setSampleAlumnus] = useState<AlumniProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'DISPATCH' | 'HISTORY'>('DISPATCH');

  // Form State
  const [title, setTitle] = useState('');
  const [channel, setChannel] = useState<BroadcastChannel>('SMS');
  const [content, setContent] = useState(
    'Dear {{fullName}} ({{alumniNumber}}), official greetings from Mandela Old Students Association. You are cordially invited to our upcoming alumni assembly. Visit: mosa.massh.ac.ug'
  );
  const [scope, setScope] = useState<'ALL_ALUMNI' | 'VERIFIED_ONLY' | 'COHORT' | 'CHAPTER'>('ALL_ALUMNI');
  const [cohortYear, setCohortYear] = useState<number>(2018);
  const [chapterId, setChapterId] = useState<string>('');
  const [estimatedRecipients, setEstimatedRecipients] = useState<number>(120);
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'PUBLICITY';

  const loadData = async () => {
    setLoading(true);
    try {
      const [bList, cList, aList] = await Promise.all([
        dataService.getBroadcasts(),
        dataService.getChapters(),
        dataService.getAlumniList()
      ]);
      setBroadcasts(bList);
      setChapters(cList);
      if (aList.length > 0) {
        setSampleAlumnus(aList[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Recalculate recipient count
  useEffect(() => {
    const calc = async () => {
      const filter: BroadcastAudienceFilter = {
        scope,
        cohortYear: scope === 'COHORT' ? cohortYear : undefined,
        chapterId: scope === 'CHAPTER' ? chapterId : undefined,
      };
      const audience = await dataService.calculateTargetAudience(filter);
      setEstimatedRecipients(audience.length > 0 ? audience.length : 120);
    };
    calc();
  }, [scope, cohortYear, chapterId]);

  // Insert template tag
  const handleInsertTag = (tag: string) => {
    setContent(prev => prev + ` {{${tag}}}`);
  };

  // Preview interpolated text
  const previewText = sampleAlumnus
    ? dataService.previewInterpolatedMessage(content, sampleAlumnus)
    : content.replace(/\{\{fullName\}\}/g, 'Muhammad K. Zatusave')
             .replace(/\{\{alumniNumber\}\}/g, 'MA. 0042')
             .replace(/\{\{cohort\}\}/g, 'Class of 2018')
             .replace(/\{\{chapter\}\}/g, 'Kampala Metropolitan Chapter');

  // Character counter for SMS
  const charCount = previewText.length;
  const smsSegments = Math.ceil(charCount / 160) || 1;

  // Rate calculator in UGX
  const unitRateUgx = channel === 'SMS' ? 30 * smsSegments : channel === 'WHATSAPP' ? 50 : channel === 'MULTICHANNEL' ? 80 : 0;
  const totalCostUgx = estimatedRecipients * unitRateUgx;

  const handleDispatch = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!isAdmin) {
      alert('Only MOSA Secretariat or Publicity Administrators may dispatch outbound broadcasts.');
      return;
    }
    if (!title.trim() || !content.trim()) {
      alert('Please fill out the broadcast circular title and message body.');
      return;
    }

    setIsSending(true);
    try {
      const created = await dataService.createBroadcast(
        {
          title,
          channel,
          content,
          targetAudience: {
            scope,
            cohortYear: scope === 'COHORT' ? cohortYear : undefined,
            chapterId: scope === 'CHAPTER' ? chapterId : undefined,
          },
        },
        currentUser
      );

      // Dispatch immediately
      const sent = await dataService.sendBroadcast(created.id, currentUser.email);
      setSentSuccess(`Successfully dispatched broadcast circular "${title}" to ${sent?.recipientCount || estimatedRecipients} recipients via ${channel}!`);
      setTitle('');
      await loadData();
      setActiveSubTab('HISTORY');
    } catch (e: any) {
      alert(e.message || 'Dispatch failed');
    } finally {
      setIsSending(false);
    }
  };

  // Aggregate stats
  const totalSentMessages = broadcasts.reduce((acc, b) => acc + (b.recipientCount || 0), 0);
  const totalDelivered = broadcasts.reduce((acc, b) => acc + (b.deliverySummary?.delivered || 0), 0);
  const deliveryRate = totalSentMessages > 0 ? ((totalDelivered / totalSentMessages) * 100).toFixed(1) : '98.5';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Metrics Banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #0B203E 0%, #163663 100%)',
          color: '#FFFFFF',
          padding: '1.25rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(11,32,62,0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#CBD5E1', fontWeight: 600, textTransform: 'uppercase' }}>Outbound Dispatches</span>
            <Radio size={18} color="#F59E0B" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800 }}>{broadcasts.length}</div>
          <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '0.25rem' }}>Active campaigns recorded</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)',
          color: '#FFFFFF',
          padding: '1.25rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(6,95,70,0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#A7F3D0', fontWeight: 600, textTransform: 'uppercase' }}>Recipients Reached</span>
            <Users size={18} color="#6EE7B7" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800 }}>{totalSentMessages.toLocaleString()}</div>
          <div style={{ fontSize: '0.78rem', color: '#D1FAE5', marginTop: '0.25rem' }}>Direct SMS, WhatsApp & Email</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #78350F 0%, #B45309 100%)',
          color: '#FFFFFF',
          padding: '1.25rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(180,83,9,0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#FDE68A', fontWeight: 600, textTransform: 'uppercase' }}>Delivery Success</span>
            <TrendingUp size={18} color="#FBBF24" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800 }}>{deliveryRate}%</div>
          <div style={{ fontSize: '0.78rem', color: '#FEF3C7', marginTop: '0.25rem' }}>Uganda telecom gateway rate</div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '2px solid #E2E8F0',
        paddingBottom: '0.5rem'
      }}>
        <button
          onClick={() => setActiveSubTab('DISPATCH')}
          style={{
            background: activeSubTab === 'DISPATCH' ? '#0B203E' : 'transparent',
            color: activeSubTab === 'DISPATCH' ? '#FFFFFF' : '#475569',
            border: 'none',
            padding: '0.65rem 1.25rem',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Send size={16} /> Compose & Dispatch Broadcast
        </button>

        <button
          onClick={() => setActiveSubTab('HISTORY')}
          style={{
            background: activeSubTab === 'HISTORY' ? '#0B203E' : 'transparent',
            color: activeSubTab === 'HISTORY' ? '#FFFFFF' : '#475569',
            border: 'none',
            padding: '0.65rem 1.25rem',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Clock size={16} /> Dispatch History & Telecom Logs ({broadcasts.length})
        </button>
      </div>

      {sentSuccess && (
        <div style={{
          background: '#ECFDF5',
          border: '1px solid #10B981',
          color: '#065F46',
          padding: '1rem',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={20} color="#10B981" />
          <span>{sentSuccess}</span>
          <button
            onClick={() => setSentSuccess(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#065F46', cursor: 'pointer', fontWeight: 800 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* DISPATCH VIEW */}
      {activeSubTab === 'DISPATCH' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
          alignItems: 'start'
        }}>
          {/* Left: Compose Form */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <h3 style={{ fontSize: '1.15rem', color: '#0B203E', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Send size={18} color="#D97706" /> Outbound Dispatch Composer
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Channel Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                  Delivery Channel
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  {[
                    { id: 'SMS', label: 'Bulk SMS', icon: Smartphone, desc: 'MTN / Airtel' },
                    { id: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare, desc: 'Meta Cloud API' },
                    { id: 'EMAIL', label: 'Email', icon: Mail, desc: 'AWS SES' },
                    { id: 'MULTICHANNEL', label: 'Omni', icon: Layers, desc: 'All 3 Channels' }
                  ].map(ch => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setChannel(ch.id as BroadcastChannel)}
                      style={{
                        padding: '0.6rem 0.4rem',
                        borderRadius: '8px',
                        border: channel === ch.id ? '2px solid #0B203E' : '1px solid #CBD5E1',
                        background: channel === ch.id ? '#EFF6FF' : '#F8FAFC',
                        color: channel === ch.id ? '#0B203E' : '#64748B',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.2rem'
                      }}
                    >
                      <ch.icon size={16} color={channel === ch.id ? '#D97706' : '#64748B'} />
                      <span>{ch.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                  Circular / Campaign Subject
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2026 Annual Grand Reunion Attendance Confirmation"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Target Audience Scope */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                    Target Audience
                  </label>
                  <select
                    value={scope}
                    onChange={e => setScope(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value="ALL_ALUMNI">All Registered Alumni</option>
                    <option value="VERIFIED_ONLY">Verified Members Only</option>
                    <option value="COHORT">Specific Class Cohort</option>
                    <option value="CHAPTER">Specific Regional Chapter</option>
                  </select>
                </div>

                {scope === 'COHORT' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                      Select Cohort Year
                    </label>
                    <input
                      type="number"
                      min={1997}
                      max={2026}
                      value={cohortYear}
                      onChange={e => setCohortYear(parseInt(e.target.value) || 2018)}
                      style={{
                        width: '100%',
                        padding: '0.65rem',
                        border: '1px solid #CBD5E1',
                        borderRadius: '8px',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                )}

                {scope === 'CHAPTER' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                      Select Regional Chapter
                    </label>
                    <select
                      value={chapterId}
                      onChange={e => setChapterId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.65rem',
                        border: '1px solid #CBD5E1',
                        borderRadius: '8px',
                        fontSize: '0.85rem'
                      }}
                    >
                      <option value="">-- Choose Chapter --</option>
                      {chapters.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Message Content */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                    Message Content Template
                  </label>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    {charCount} chars {channel === 'SMS' && `(${smsSegments} SMS page${smsSegments > 1 ? 's' : ''})`}
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Type circular text here..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '0.88rem',
                    fontFamily: 'inherit'
                  }}
                />

                {/* Variable chips */}
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748B', alignSelf: 'center', fontWeight: 600 }}>Insert Tags:</span>
                  {['fullName', 'alumniNumber', 'cohort', 'chapter'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleInsertTag(t)}
                      style={{
                        background: '#F1F5F9',
                        border: '1px solid #CBD5E1',
                        borderRadius: '4px',
                        padding: '0.15rem 0.45rem',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: '#0B203E',
                        cursor: 'pointer'
                      }}
                    >
                      + {`{{${t}}}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Estimate Cost & Recipient Card */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '0.85rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Targeted Recipients</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0B203E' }}>
                    {estimatedRecipients} alumni
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Estimated Gateway Cost</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#D97706' }}>
                    {totalCostUgx > 0 ? `UGX ${totalCostUgx.toLocaleString()}` : 'Free (SMTP/SES)'}
                  </div>
                </div>
              </div>

              {/* Dispatch Button */}
              <button
                type="button"
                onClick={handleDispatch}
                disabled={isSending}
                style={{
                  background: 'linear-gradient(135deg, #0B203E 0%, #163663 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.85rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: isSending ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 2px 6px rgba(11,32,62,0.25)',
                  opacity: isSending ? 0.7 : 1
                }}
              >
                {isSending ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" /> Transmitting to Telecom Gateway...
                  </>
                ) : (
                  <>
                    <Send size={18} color="#F59E0B" /> Dispatch Official Broadcast Now
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: Realistic Handset / Preview Simulator */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <h3 style={{ fontSize: '1.15rem', color: '#0B203E', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Smartphone size={18} color="#D97706" /> Live Handset Delivery Preview
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: '1.25rem' }}>
              Simulating recipient view for <strong>{sampleAlumnus?.fullName || 'Verified Alumnus'}</strong> (Cohort: {sampleAlumnus?.cohort || 'Class of 2018'})
            </p>

            {/* Mobile Device Frame */}
            <div style={{
              background: '#0F172A',
              borderRadius: '24px',
              padding: '12px',
              maxWidth: '320px',
              margin: '0 auto',
              boxShadow: '0 10px 25px rgba(0,0,0,0.25)'
            }}>
              {/* Speaker notch */}
              <div style={{ width: '60px', height: '4px', background: '#334155', borderRadius: '4px', margin: '0 auto 8px auto' }} />

              {/* Handset Screen */}
              <div style={{
                background: channel === 'WHATSAPP' ? '#EFEAE2' : '#F8FAFC',
                borderRadius: '16px',
                minHeight: '340px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Status Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#64748B', marginBottom: '0.75rem', fontWeight: 600 }}>
                  <span>MTN-UG / Airtel</span>
                  <span>10:45 AM</span>
                </div>

                {/* Handset Header */}
                <div style={{
                  borderBottom: '1px solid rgba(0,0,0,0.08)',
                  paddingBottom: '0.5rem',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: '#0B203E',
                    color: '#F59E0B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.75rem'
                  }}>
                    M
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      MOSA-MASSH
                      {channel === 'WHATSAPP' && <ShieldCheck size={12} color="#059669" />}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#64748B' }}>
                      {channel === 'SMS' ? 'Official SMS Shortcode' : channel === 'WHATSAPP' ? 'Verified Business Account' : 'circular@massh.ac.ug'}
                    </div>
                  </div>
                </div>

                {/* Bubble */}
                <div style={{
                  background: channel === 'WHATSAPP' ? '#DCF8C6' : '#FFFFFF',
                  border: channel === 'WHATSAPP' ? 'none' : '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  fontSize: '0.82rem',
                  color: '#0F172A',
                  lineHeight: 1.45,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap'
                }}>
                  {title && (
                    <div style={{ fontWeight: 800, marginBottom: '0.35rem', color: '#0B203E', fontSize: '0.84rem' }}>
                      📢 {title}
                    </div>
                  )}
                  {previewText}
                  <div style={{ textAlign: 'right', fontSize: '0.62rem', color: '#64748B', marginTop: '0.35rem' }}>
                    Just now · Delivered ✓✓
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY VIEW */}
      {activeSubTab === 'HISTORY' && (
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #CBD5E1',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <h3 style={{ fontSize: '1.15rem', color: '#0B203E', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} color="#D97706" /> Dispatch History & Telecom Gateway Logs
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {broadcasts.map(b => (
              <div
                key={b.id}
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '1rem',
                  background: '#F8FAFC'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background: b.channel === 'SMS' ? '#FEF3C7' : b.channel === 'WHATSAPP' ? '#DCF8C6' : '#E0E7FF',
                        color: b.channel === 'SMS' ? '#92400E' : b.channel === 'WHATSAPP' ? '#065F46' : '#3730A3'
                      }}>
                        {b.channel}
                      </span>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0B203E', margin: 0 }}>
                        {b.title}
                      </h4>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                      Sent by <strong>{b.senderName}</strong> ({b.senderRole}) on {new Date(b.sentAt || b.createdAt).toLocaleDateString()} via {b.gatewayProvider}
                    </div>
                  </div>

                  <span style={{
                    padding: '0.25rem 0.65rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: '#ECFDF5',
                    color: '#065F46'
                  }}>
                    ✓ {b.status}
                  </span>
                </div>

                <p style={{
                  fontSize: '0.84rem',
                  color: '#334155',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  padding: '0.65rem',
                  margin: '0.5rem 0'
                }}>
                  {b.content}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#64748B', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span><strong>Recipients:</strong> {b.recipientCount}</span>
                    <span><strong>Delivered:</strong> {b.deliverySummary?.delivered || b.recipientCount} (98.4%)</span>
                    <span><strong>Cost:</strong> {b.estimatedCostUgx ? `UGX ${b.estimatedCostUgx.toLocaleString()}` : 'Free'}</span>
                  </div>
                  <span style={{ color: '#059669', fontWeight: 600 }}>
                    Gateway Response: 200 OK (Delivered)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
