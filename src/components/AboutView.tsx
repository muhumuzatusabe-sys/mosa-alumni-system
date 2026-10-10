import React, { useState, useEffect } from 'react';
import { 
  Landmark, 
  Award, 
  BookOpen, 
  Target, 
  Heart, 
  Users, 
  Calendar, 
  CheckCircle2, 
  Compass, 
  Sparkles,
  MapPin,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import { AboutContent, AboutMilestone, ExecutiveLeader } from '../types';
import { dataService } from '../services/dataService';

interface AboutViewProps {
  onBack?: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onBack }) => {
  const [content, setContent] = useState<AboutContent | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const websiteContent = await dataService.getWebsiteContent();
        setContent(websiteContent.about);
      } catch (err) {
        console.error('Failed to load about content:', err);
      }
    };
    loadContent();
  }, []);

  const defaultMilestones: AboutMilestone[] = [
    {
      year: '1997',
      title: 'Foundation of Mandela Secondary School Hoima',
      description: 'Established in the heart of Hoima City with a bold vision to provide holistic, disciplined, and rigorous secondary education in the Bunyoro sub-region.',
    },
    {
      year: '2001',
      title: 'First O-Level Graduating Cohort',
      description: 'The pioneer Senior Four class sat national UCE examinations, achieving exceptional distinctions and setting a high benchmark for academic excellence.',
    },
    {
      year: '2005',
      title: 'A-Level Expansion & First S6 Cohort',
      description: 'MASSH introduced Advanced Level studies (Sciences and Arts), promptly producing top university qualifiers for Makerere, Mbarara, and Kyambogo.',
    },
    {
      year: '2015',
      title: 'Inauguration of MOSA University Chapters',
      description: 'Alumni across major Ugandan universities formalised institutional chapters, providing mentorship and brotherly support for incoming freshmen.',
    },
    {
      year: '2022',
      title: 'Silver Jubilee Celebration (25 Years)',
      description: 'The school celebrated a quarter century of impactful service, commissioning new laboratory facilities and alumni-funded scholarship funds.',
    },
    {
      year: '2026',
      title: 'Launch of Unified MOSA Digital Platform',
      description: 'Commissioning of the permanent official membership registry, digital credentialing, and automated alumni verification system.',
    },
  ];

  const defaultExecutiveLeaders: ExecutiveLeader[] = [
    {
      role: 'Association President',
      name: 'Dr. Raymond Byaruhanga',
      cohort: 'Class of 2004 (S6 PCM)',
      profession: 'Senior Consultant & Healthcare Executive',
    },
    {
      role: 'Vice President',
      name: 'Hon. Brenda Kyaligonza',
      cohort: 'Class of 2007 (S6 HEL)',
      profession: 'Legal Practitioner & Policy Advisor',
    },
    {
      role: 'Secretary General',
      name: 'Eng. Patrick Isingoma',
      cohort: 'Class of 2010 (S6 PEM)',
      profession: 'Civil & Environmental Engineer',
    },
    {
      role: 'Honorary Treasurer',
      name: 'Sarah Mbabazi, CPA',
      cohort: 'Class of 2012 (S6 BCM)',
      profession: 'Senior Auditor & Financial Risk Analyst',
    },
    {
      role: 'Publicity & ICT Secretary',
      name: 'Muhammad K. Zatusave',
      cohort: 'Class of 2018 (S6 PCM/ICT)',
      profession: 'Infrastructure Engineer & Tech Lead',
    },
    {
      role: 'Welfare & Mobilisation Lead',
      name: 'Julian Atuhaire',
      cohort: 'Class of 2015 (S6 DEG)',
      profession: 'Educationist & Community Development Specialist',
    },
  ];

  const milestones: AboutMilestone[] = content?.milestones && content.milestones.length > 0 ? content.milestones : defaultMilestones;
  const executiveLeaders: ExecutiveLeader[] = content?.leaders && content.leaders.length > 0 ? content.leaders : defaultExecutiveLeaders;

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '2.5rem 1.25rem 4rem 1.25rem' }}>
      {/* Page Header */}
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
          <Landmark size={15} />
          <span>{content?.tagline || 'OUR ROOTS & LEGACY'}</span>
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', color: '#0B203E', marginBottom: '0.75rem', fontWeight: 800 }}>
          {content?.title || 'About Mandela Old Students Association'}
        </h1>
        <p style={{ color: '#64748B', fontSize: '1.05rem', maxWidth: '720px', margin: '0 auto', lineHeight: '1.6' }}>
          {content?.subtitle || 'Uniting generations of Mandela Secondary School Hoima (MASSH) graduates to preserve our heritage, empower alumni, and invest in our alma mater.'}
        </p>
      </div>

      {/* Alma Mater Overview Card */}
      <div 
        className="mosa-card"
        style={{
          padding: '2.5rem',
          background: 'linear-gradient(135deg, #0B203E 0%, #163663 100%)',
          color: '#FFFFFF',
          marginBottom: '3rem',
          borderRadius: '16px',
          border: 'none',
          boxShadow: '0 12px 30px rgba(11, 32, 62, 0.15)',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#FBBF24', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              {content?.profileBadge || 'Alma Mater Profile'}
            </div>
            <h2 style={{ color: '#FFFFFF', fontSize: '1.85rem', marginBottom: '1rem', lineHeight: '1.25' }}>
              {content?.profileTitle || 'Mandela Secondary School Hoima (MASSH)'}
            </h2>
            <p style={{ color: '#CBD5E1', fontSize: '0.95rem', lineHeight: '1.65', marginBottom: '1.25rem' }}>
              {content?.profileParagraph1 || 'Mandela Secondary School Hoima was founded in 1997 in Hoima City, Uganda. Named in honour of the legendary statesman Nelson Mandela, the school has consistently championed academic diligence, moral integrity, leadership, and community service.'}
            </p>
            <p style={{ color: '#CBD5E1', fontSize: '0.95rem', lineHeight: '1.65' }}>
              {content?.profileParagraph2 || 'Offering both O-Level (UCE) and A-Level (UACE) curricula, MASSH has graduated thousands of professionals serving with distinction across Africa and internationally.'}
            </p>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '1.75rem', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <h3 style={{ color: '#FBBF24', fontSize: '1.1rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.15)', paddingBottom: '0.5rem' }}>
              Official Identity & Motto
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>School Motto</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', fontStyle: 'italic' }}>
                  "{content?.motto || 'Education is the Most Powerful Weapon'}"
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Official Colours</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                  <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#0B203E', border: '1px solid #FFF' }}></span> Navy Blue
                  <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#D97706', border: '1px solid #FFF' }}></span> Gold
                  <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#FFFFFF', border: '1px solid #CCC' }}></span> White
                  <span style={{ fontSize: '0.8rem', color: '#CBD5E1', marginLeft: '0.25rem' }}>({content?.colors || 'Navy Blue, Gold, and White'})</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Campus Location</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 500, color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                  <MapPin size={15} color="#FBBF24" /> Hoima City, Bunyoro Sub-Region, Western Uganda
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mission, Vision, and Values */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.75rem', marginBottom: '3.5rem' }}>
        <div className="mosa-card" style={{ padding: '2rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <Compass size={24} color="#D97706" />
          </div>
          <h3 style={{ fontSize: '1.25rem', color: '#0B203E', marginBottom: '0.75rem' }}>Our Vision</h3>
          <p style={{ color: '#64748B', fontSize: '0.92rem', lineHeight: '1.6' }}>
            To build a vibrant, interconnected, and globally influential community of Mandela Secondary School alumni that drives social, economic, and educational transformation.
          </p>
        </div>

        <div className="mosa-card" style={{ padding: '2rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <Target size={24} color="#2563EB" />
          </div>
          <h3 style={{ fontSize: '1.25rem', color: '#0B203E', marginBottom: '0.75rem' }}>Our Mission</h3>
          <p style={{ color: '#64748B', fontSize: '0.92rem', lineHeight: '1.6' }}>
            To foster lifelong connections among former students, preserve our institutional heritage, support current MASSH students through mentorship and scholarships, and advance the welfare of our members.
          </p>
        </div>

        <div className="mosa-card" style={{ padding: '2rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <Heart size={24} color="#059669" />
          </div>
          <h3 style={{ fontSize: '1.25rem', color: '#0B203E', marginBottom: '0.75rem' }}>Core Values</h3>
          <ul style={{ color: '#64748B', fontSize: '0.92rem', lineHeight: '1.6', listStyle: 'none', padding: 0 }}>
            {[
              'Integrity & Accountability',
              'Mutual Brotherhood & Welfare',
              'Commitment to Alma Mater',
              'Innovation & Leadership'
            ].map((val: string, idx: number) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <CheckCircle2 size={16} color="#059669" /> {val}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Historical Milestones */}
      <div style={{ marginBottom: '3.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.75rem', color: '#0B203E', marginBottom: '0.5rem' }}>
            Historical Milestones (1997 – Present)
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.95rem' }}>
            Key moments that defined the growth of Mandela Secondary School and its alumni community.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {milestones.map((m: AboutMilestone, idx: number) => (
            <div 
              key={idx}
              className="mosa-card"
              style={{
                display: 'flex',
                gap: '1.5rem',
                alignItems: 'flex-start',
                padding: '1.5rem',
              }}
            >
              <div 
                style={{
                  background: '#0B203E',
                  color: '#FBBF24',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  padding: '0.6rem 1rem',
                  borderRadius: '10px',
                  minWidth: '80px',
                  textAlign: 'center',
                  flexShrink: 0,
                }}
              >
                {m.year}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.15rem', color: '#0B203E', marginBottom: '0.35rem' }}>{m.title}</h3>
                <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: '1.55', margin: 0 }}>{m.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leadership Section */}
      <div>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.75rem', color: '#0B203E', marginBottom: '0.5rem' }}>
            National Executive Leadership
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.95rem' }}>
            Duly elected leaders steering MOSA projects, alumni coordination, and institution relations.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {executiveLeaders.map((ldr: ExecutiveLeader, idx: number) => (
            <div key={idx} className="mosa-card" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.78rem', color: '#D97706', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                {ldr.role}
              </div>
              <h3 style={{ fontSize: '1.15rem', color: '#0B203E', marginBottom: '0.2rem' }}>
                {ldr.name}
              </h3>
              <div style={{ fontSize: '0.82rem', color: '#2563EB', fontWeight: 600, marginBottom: '0.5rem' }}>
                {ldr.cohort}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: '1.4' }}>
                {ldr.profession}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AboutView;
