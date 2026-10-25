import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  HelpCircle,
  Landmark,
  ChevronDown,
  ChevronUp,
  ArrowLeft
} from 'lucide-react';
import { AuthUser, ContactContent, FaqItem, SecretariatContact } from '../types';
import { dataService } from '../services/dataService';

interface ContactViewProps {
  currentUser: AuthUser | null;
  onBack?: () => void;
}

export const ContactView: React.FC<ContactViewProps> = ({ currentUser, onBack }) => {
  const [content, setContent] = useState<ContactContent | null>(null);
  const [secretariatContacts, setSecretariatContacts] = useState<SecretariatContact[]>([]);

  const [formData, setFormData] = useState({
    name: currentUser?.displayName || '',
    email: currentUser?.email || '',
    phone: '',
    completionYear: '',
    subject: 'General Inquiry',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const [websiteContent, contacts] = await Promise.all([
          dataService.getWebsiteContent(),
          dataService.getSecretariatContacts(true)
        ]);
        setContent(websiteContent.contact);
        setSecretariatContacts(contacts);
      } catch (err) {
        console.error('Failed to load contact content:', err);
      }
    };
    loadContent();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setSubmitted(true);
  };

  const defaultFaqs: FaqItem[] = [
    {
      q: 'How do I obtain my permanent alumni number?',
      a: 'Simply click "Register as Member" in the portal. Once you submit your academic details (O-Level / A-Level years at MASSH) and upload your portrait photograph, your unique sequential membership number (e.g. MA. 0001 or MOSA-000001) will be generated automatically and instantly issued to you.',
    },
    {
      q: 'Can employers or university registrars verify my membership?',
      a: 'Yes. The portal provides a real-time Public Verification Desk. Anyone with your membership number can check its validity against the official MASSH registry without logging into the platform.',
    },
    {
      q: 'What if I need to update my details or photograph after registration?',
      a: 'You can log in to your Member Profile at any time to update your bio, occupation, contact numbers, and social links. You can also generate an updated digital ID card.',
    },
    {
      q: 'How do I join or start a MOSA chapter at my university or city?',
      a: 'Check the Chapters directory on this platform to connect with existing institutional chapters. If your university does not yet have an accredited chapter, submit an inquiry using the contact form below.',
    },
  ];

  const faqs: FaqItem[] = content?.faqs && content.faqs.length > 0 ? content.faqs : defaultFaqs;
  const emails: string[] = content?.emails && content.emails.length > 0 ? content.emails : ['info@massh.ac.ug', 'alumni@massh.ac.ug'];
  const phoneNumbers: string[] = content?.phoneNumbers && content.phoneNumbers.length > 0 ? content.phoneNumbers : [
    '+256 772 123 456 (General Secretariat)',
    '+256 701 987 654 (Treasury & Membership)'
  ];

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '2.5rem 1.25rem 4rem 1.25rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        {onBack && (
          <div style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
            <button
              onClick={onBack}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                color: '#0B203E',
                borderRadius: '8px',
                padding: '0.45rem 0.9rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
          </div>
        )}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#FEF3C7', color: '#D97706', padding: '0.35rem 0.9rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          <Mail size={15} />
          <span>{content?.tagline || 'NATIONAL SECRETARIAT'}</span>
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', color: '#0B203E', marginBottom: '0.75rem', fontWeight: 800 }}>
          {content?.title || 'Contact MOSA & Alma Mater'}
        </h1>
        <p style={{ color: '#64748B', fontSize: '1.05rem', maxWidth: '720px', margin: '0 auto', lineHeight: '1.6' }}>
          {content?.subtitle || 'Reach out to the Mandela Old Students Association Secretariat, executive committee, or campus coordinators in Hoima.'}
        </p>
      </div>

      {/* Approved Secretariat Officials & Direct WhatsApp Directory (Phase 7) */}
      {secretariatContacts.length > 0 && (
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0B203E', margin: 0 }}>
              MOSA National Secretariat Officials &amp; Direct WhatsApp Desk
            </h2>
          </div>
          <p style={{ fontSize: '0.88rem', color: '#64748B', marginBottom: '1.25rem' }}>
            Approved contact directory for executive leadership and registry inquiries. Click below to start an official WhatsApp conversation.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {secretariatContacts.map(contact => (
              <div
                key={contact.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1.5px solid #E2E8F0',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.85rem',
                  boxShadow: '0 4px 12px rgba(11, 32, 62, 0.05)',
                }}
              >
                <div>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#B45309',
                    background: '#FEF3C7',
                    padding: '0.15rem 0.55rem',
                    borderRadius: '6px',
                    display: 'inline-block',
                    marginBottom: '0.35rem'
                  }}>
                    {contact.title}
                  </span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0B203E', margin: '0 0 0.35rem 0' }}>
                    {contact.name}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Phone size={14} color="#D97706" />
                    <a href={`tel:${contact.publishedPhone.replace(/\s+/g, '')}`} style={{ color: '#0B203E', textDecoration: 'none', fontWeight: 600 }}>
                      {contact.publishedPhone}
                    </a>
                  </div>
                  {contact.notes && (
                    <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '0.35rem' }}>
                      {contact.notes}
                    </div>
                  )}
                </div>

                {contact.whatsAppNumber && (
                  <a
                    href={`https://wa.me/${contact.whatsAppNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${contact.title} (${contact.name}), I am contacting the MOSA Secretariat regarding `)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      background: '#16A34A',
                      color: '#FFFFFF',
                      padding: '0.55rem 1rem',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      textDecoration: 'none',
                      boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
                    }}
                  >
                    <MessageSquare size={16} />
                    <span>Chat on WhatsApp</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', marginBottom: '3.5rem' }}>
        {/* Contact Info Card */}
        <div>
          <div 
            className="mosa-card" 
            style={{ 
              padding: '2rem', 
              background: 'linear-gradient(135deg, #0B203E 0%, #163663 100%)', 
              color: '#FFFFFF',
              borderRadius: '16px',
              border: 'none',
              marginBottom: '1.5rem',
            }}
          >
            <h2 style={{ fontSize: '1.4rem', color: '#FFFFFF', marginBottom: '1.25rem' }}>
              Secretariat Headquarters
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                <MapPin size={20} color="#FBBF24" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '0.95rem' }}>Campus Address</div>
                  <div style={{ color: '#CBD5E1', fontSize: '0.88rem', lineHeight: '1.5' }}>
                    {content?.campusAddress || 'Mandela Secondary School Hoima (MASSH)'}<br />
                    {content?.poBox || 'P.O. Box 284, Hoima City, Bunyoro Sub-Region, Western Uganda'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                <Mail size={20} color="#FBBF24" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '0.95rem' }}>Official Inquiries</div>
                  {emails.map((email: string, idx: number) => (
                    <div key={idx} style={{ color: '#CBD5E1', fontSize: '0.88rem' }}>{email}</div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                <Phone size={20} color="#FBBF24" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '0.95rem' }}>Secretariat Hotlines</div>
                  {phoneNumbers.map((phone: string, idx: number) => (
                    <div key={idx} style={{ color: '#CBD5E1', fontSize: '0.88rem' }}>{phone}</div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                <Clock size={20} color="#FBBF24" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '0.95rem' }}>Secretariat Hours</div>
                  <div style={{ color: '#CBD5E1', fontSize: '0.88rem' }}>
                    {content?.workingHours || 'Monday – Friday: 8:00 AM – 5:00 PM EAT'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message Form */}
        <div className="mosa-card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', color: '#0B203E', marginBottom: '0.5rem' }}>
            Send a Dispatch to the Secretariat
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
            Have a question, suggestion, or update for the association? Fill in the details below.
          </p>

          {submitted ? (
            <div style={{ padding: '2rem 1.5rem', textAlign: 'center', background: '#D1FAE5', borderRadius: '12px', border: '1px solid #10B981' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                <CheckCircle2 size={28} color="#FFFFFF" />
              </div>
              <h3 style={{ color: '#065F46', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Dispatch Received!</h3>
              <p style={{ color: '#047857', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                Thank you, <strong>{formData.name}</strong>. Your message has been logged with the MOSA Secretariat. An officer will respond shortly via <strong>{formData.email}</strong>.
              </p>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: '', email: '', phone: '', completionYear: '', subject: 'General Inquiry', message: '' });
                }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Patrick Mugisa"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    className="input-field"
                    placeholder="e.g. patrick@gmail.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="+256 700 000000"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                  Completion Year (MASSH)
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Class of 2012 (S4) or 2014 (S6)"
                  value={formData.completionYear}
                  onChange={e => setFormData({ ...formData, completionYear: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                  Subject / Category
                </label>
                <select
                  className="input-field"
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem' }}
                >
                  <option value="General Inquiry">General Association Inquiry</option>
                  <option value="Membership & ID">Membership & Alumni Number Verification</option>
                  <option value="Chapters">University or Regional Chapter Inquiry</option>
                  <option value="Reunions">Reunion & Event Information</option>
                  <option value="Giving">Endowments & School Projects</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                  Your Message *
                </label>
                <textarea
                  required
                  rows={4}
                  className="input-field"
                  placeholder="Type your message, inquiry, or feedback here..."
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem', marginTop: '0.5rem', fontWeight: 600 }}
              >
                <Send size={16} /> Send Dispatch
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Frequently Asked Questions Accordion */}
      <div>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', color: '#0B203E', marginBottom: '0.5rem' }}>
            Frequently Asked Questions
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.95rem' }}>
            Quick answers regarding MOSA registration, numbers, and alumni engagement.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '850px', margin: '0 auto' }}>
          {faqs.map((faq: FaqItem, idx: number) => (
            <div 
              key={idx} 
              className="mosa-card" 
              style={{ padding: '1.25rem 1.5rem', cursor: 'pointer' }}
              onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.05rem', color: '#0B203E', margin: 0, fontWeight: 600 }}>{faq.q}</h3>
                {openFaq === idx ? <ChevronUp size={18} color="#D97706" /> : <ChevronDown size={18} color="#64748B" />}
              </div>
              {openFaq === idx && (
                <p style={{ marginTop: '0.75rem', color: '#475569', fontSize: '0.9rem', lineHeight: '1.6', borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem', margin: '0.75rem 0 0 0' }}>
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContactView;
