import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Plus, 
  X, 
  Sparkles, 
  Calendar, 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  Award, 
  Trash2, 
  Maximize2,
  Filter,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { CampusPhoto, PhotoCategory, AuthUser } from '../types';
import { dataService } from '../services/dataService';

interface Props {
  currentUser: AuthUser | null;
  onOpenAuth: () => void;
  onBack?: () => void;
}

export const CampusHeritageGallery: React.FC<Props> = ({ currentUser, onOpenAuth, onBack }) => {
  const [photos, setPhotos] = useState<CampusPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | PhotoCategory>('ALL');
  const [activePhoto, setActivePhoto] = useState<CampusPhoto | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New photo form state
  const [newTitle, setNewTitle] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newCategory, setNewCategory] = useState<PhotoCategory>('CAMPUS_LIFE');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newLocation, setNewLocation] = useState('MASSH Main Campus, Hoima');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const data = await dataService.getCampusPhotos();
      setPhotos(data);
    } catch (err) {
      console.error('Failed to load photos:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPhotos = selectedCategory === 'ALL' 
    ? photos 
    : photos.filter(p => p.category === selectedCategory);

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl || !newTitle) {
      alert('Please provide a title and an image URL.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await dataService.addCampusPhoto({
        title: newTitle,
        caption: newCaption,
        category: newCategory,
        imageUrl: newImageUrl,
        date: newDate || new Date().toISOString().slice(0, 10),
        location: newLocation,
        uploadedBy: currentUser?.email || 'alumni@massh.ac.ug',
        featured: false,
      });

      setPhotos([created, ...photos]);
      setIsAddModalOpen(false);
      // Reset form
      setNewTitle('');
      setNewCaption('');
      setNewImageUrl('');
      setNewDate('');
    } catch (err) {
      console.error(err);
      alert('Failed to add photo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePhoto = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to remove this photo from the gallery?')) return;
    try {
      await dataService.deleteCampusPhoto(id);
      setPhotos(photos.filter(p => p.id !== id));
      if (activePhoto?.id === id) setActivePhoto(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activePhoto) return;
    const currentIndex = filteredPhotos.findIndex(p => p.id === activePhoto.id);
    const nextIndex = (currentIndex + 1) % filteredPhotos.length;
    setActivePhoto(filteredPhotos[nextIndex]);
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activePhoto) return;
    const currentIndex = filteredPhotos.findIndex(p => p.id === activePhoto.id);
    const prevIndex = (currentIndex - 1 + filteredPhotos.length) % filteredPhotos.length;
    setActivePhoto(filteredPhotos[prevIndex]);
  };

  const getCategoryBadge = (cat: PhotoCategory) => {
    switch (cat) {
      case 'FOUNDATION':
        return { label: 'Infrastructural Milestone', color: '#D97706', bg: 'rgba(217, 119, 6, 0.1)' };
      case 'ACADEMICS':
        return { label: 'Science & Academics', color: '#2563EB', bg: 'rgba(37, 99, 235, 0.1)' };
      case 'VIP_VISIT':
        return { label: 'Ministerial & State Visit', color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.1)' };
      case 'ALUMNI_COMMUNITY':
        return { label: 'MOSA Community', color: '#059669', bg: 'rgba(5, 150, 105, 0.1)' };
      default:
        return { label: 'Campus Life', color: '#0B203E', bg: 'rgba(11, 32, 62, 0.08)' };
    }
  };

  return (
    <div className="campus-gallery-section" style={{ marginTop: '2.5rem', marginBottom: '2.5rem' }}>
      
      {/* Section Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-end', 
        flexWrap: 'wrap', 
        gap: '1rem', 
        marginBottom: '1.5rem',
        borderBottom: '2px solid #E2E8F0',
        paddingBottom: '1rem'
      }}>
        <div>
          {onBack && (
            <div style={{ marginBottom: '0.75rem' }}>
              <button
                onClick={onBack}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '8px',
                  background: '#FFFFFF',
                  color: '#0B203E',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={15} />
                <span>Back to Dashboard</span>
              </button>
            </div>
          )}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(217, 119, 6, 0.12)', color: '#D97706', padding: '0.25rem 0.75rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <Sparkles size={14} /> Official School Heritage &amp; Landmark Moments
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0B203E', margin: 0, letterSpacing: '-0.02em' }}>
            MASSH Campus Life &amp; Heritage Gallery
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.9rem', margin: '0.35rem 0 0 0' }}>
            Preserving historic milestones, laboratory inspections, and official visits at Mandela Secondary School Hoima • Motto: <em>"Caring to Achieve"</em>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            id="add-campus-photo-btn"
            onClick={() => setIsAddModalOpen(true)}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: '#0B203E', 
              color: '#FFFFFF', 
              border: 'none', 
              padding: '0.65rem 1.15rem', 
              borderRadius: '10px', 
              fontSize: '0.85rem', 
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
          >
            <Plus size={16} />
            <span>Add Campus Photo</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.75rem' }}>
        {[
          { id: 'ALL', label: `All Photos (${photos.length})` },
          { id: 'FOUNDATION', label: 'Foundation Stone & Milestones' },
          { id: 'ACADEMICS', label: 'Science & Laboratories' },
          { id: 'VIP_VISIT', label: 'Ministerial Delegations' },
          { id: 'CAMPUS_LIFE', label: 'Campus Courtyard & Life' },
          { id: 'ALUMNI_COMMUNITY', label: 'MOSA Welcomes' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id as any)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              fontSize: '0.82rem',
              fontWeight: selectedCategory === cat.id ? 700 : 500,
              background: selectedCategory === cat.id ? '#0B203E' : '#FFFFFF',
              color: selectedCategory === cat.id ? '#FFFFFF' : '#475569',
              border: selectedCategory === cat.id ? '1px solid #0B203E' : '1px solid #CBD5E1',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Photos Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem auto' }} />
          <p style={{ color: '#64748B' }}>Loading campus heritage gallery...</p>
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#F8FAFC', borderRadius: '12px' }}>
          <ImageIcon size={36} color="#94A3B8" style={{ margin: '0 auto 0.5rem auto' }} />
          <p style={{ color: '#64748B' }}>No photos found in this category.</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '1.25rem' 
        }}>
          {filteredPhotos.map((photo) => {
            const badge = getCategoryBadge(photo.category);
            return (
              <div 
                key={photo.id}
                onClick={() => setActivePhoto(photo)}
                style={{ 
                  background: '#FFFFFF', 
                  borderRadius: '14px', 
                  overflow: 'hidden', 
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 20px -5px rgba(11, 32, 62, 0.15)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                }}
              >
                {/* Photo Thumbnail */}
                <div style={{ position: 'relative', width: '100%', height: '220px', overflow: 'hidden', background: '#0F172A' }}>
                  <img 
                    src={photo.imageUrl} 
                    alt={photo.title}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease'
                    }}
                    onError={e => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  
                  {/* Category Pill Over Image */}
                  <span style={{ 
                    position: 'absolute', 
                    top: '10px', 
                    left: '10px', 
                    background: 'rgba(11, 32, 62, 0.85)', 
                    color: '#FDE68A', 
                    fontSize: '0.72rem', 
                    fontWeight: 700, 
                    padding: '0.25rem 0.65rem', 
                    borderRadius: '50px',
                    backdropFilter: 'blur(4px)'
                  }}>
                    {badge.label}
                  </span>

                  {/* Maximize Icon */}
                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    background: 'rgba(0, 0, 0, 0.6)',
                    color: '#FFFFFF',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(4px)'
                  }}>
                    <Maximize2 size={15} />
                  </div>
                </div>

                {/* Card Details */}
                <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ 
                      fontSize: '0.95rem', 
                      fontWeight: 700, 
                      color: '#0B203E', 
                      margin: '0 0 0.4rem 0',
                      lineHeight: 1.35
                    }}>
                      {photo.title}
                    </h4>
                    <p style={{ 
                      fontSize: '0.8rem', 
                      color: '#64748B', 
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.45
                    }}>
                      {photo.caption}
                    </p>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginTop: '0.85rem', 
                    paddingTop: '0.75rem', 
                    borderTop: '1px solid #F1F5F9',
                    fontSize: '0.75rem',
                    color: '#94A3B8'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={13} /> {photo.date || '2026'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <MapPin size={13} /> {photo.location || 'MASSH'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {activePhoto && (
        <div 
          className="modal-backdrop" 
          onClick={() => setActivePhoto(null)} 
          style={{ 
            zIndex: 1300, 
            background: 'rgba(0, 0, 0, 0.88)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '1.5rem'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()} 
            style={{ 
              maxWidth: '960px', 
              width: '100%', 
              background: '#0B203E', 
              borderRadius: '16px', 
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '94vh'
            }}
          >
            {/* Modal Close Button */}
            <button 
              onClick={() => setActivePhoto(null)}
              style={{ 
                position: 'absolute', 
                top: '12px', 
                right: '12px', 
                background: 'rgba(0,0,0,0.6)', 
                border: 'none', 
                color: '#FFFFFF', 
                width: '36px', 
                height: '36px', 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10
              }}
            >
              <X size={18} />
            </button>

            {/* Lightbox Image Stage with Previous / Next Controls */}
            <div style={{ position: 'relative', width: '100%', maxHeight: '62vh', minHeight: '320px', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img 
                src={activePhoto.imageUrl} 
                alt={activePhoto.title}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '62vh', 
                  objectFit: 'contain' 
                }}
              />

              {/* Prev Button */}
              <button 
                onClick={handlePrevPhoto}
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  background: 'rgba(0, 0, 0, 0.65)', 
                  border: 'none', 
                  color: '#FFFFFF', 
                  width: '42px', 
                  height: '42px', 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title="Previous Photo"
              >
                <ChevronLeft size={24} />
              </button>

              {/* Next Button */}
              <button 
                onClick={handleNextPhoto}
                style={{ 
                  position: 'absolute', 
                  right: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  background: 'rgba(0, 0, 0, 0.65)', 
                  border: 'none', 
                  color: '#FFFFFF', 
                  width: '42px', 
                  height: '42px', 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title="Next Photo"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Lightbox Caption & Heritage Context */}
            <div style={{ padding: '1.5rem 1.75rem', background: '#0B203E', color: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.5rem' }}>
                <div>
                  <span style={{ 
                    display: 'inline-block',
                    background: '#D97706', 
                    color: '#FFFFFF', 
                    fontSize: '0.72rem', 
                    fontWeight: 700, 
                    padding: '0.2rem 0.6rem', 
                    borderRadius: '4px',
                    marginBottom: '0.4rem'
                  }}>
                    {getCategoryBadge(activePhoto.category).label}
                  </span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                    {activePhoto.title}
                  </h3>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {currentUser?.role === 'ADMIN' && (
                    <button 
                      onClick={(e) => handleDeletePhoto(activePhoto.id, e)}
                      style={{ 
                        background: 'rgba(239, 68, 68, 0.2)', 
                        border: '1px solid #EF4444', 
                        color: '#F87171', 
                        padding: '0.4rem 0.75rem', 
                        borderRadius: '6px', 
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                      title="Admin: Remove Photo"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  )}
                </div>
              </div>

              <p style={{ fontSize: '0.9rem', color: '#CBD5E1', lineHeight: '1.55', margin: '0.5rem 0 1rem 0' }}>
                {activePhoto.caption}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.8rem', color: '#94A3B8', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.75rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={14} color="#D97706" /> {activePhoto.date ? new Date(activePhoto.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Official Record'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={14} color="#D97706" /> {activePhoto.location || 'Mandela Secondary School Hoima, Bunyoro'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Award size={14} color="#D97706" /> Motto: <em>Caring to Achieve</em>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Add Photo Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)} style={{ zIndex: 1250 }}>
          <div 
            className="modal-content" 
            onClick={e => e.stopPropagation()} 
            style={{ maxWidth: '520px', width: '90%', padding: '2rem', borderRadius: '16px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ImageIcon size={20} color="#D97706" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0B203E', fontWeight: 800 }}>
                  Add Campus Heritage Photo
                </h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: 0, marginBottom: '1.25rem' }}>
              Add a new photograph to the dynamic MASSH gallery. You can specify a local image path (e.g. <code>/images/...</code>) or paste any image URL.
            </p>

            <form onSubmit={handleAddPhoto}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1E293B', marginBottom: '0.35rem' }}>
                  Photo Title *
                </label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Science Fair Presentation at MASSH Main Hall"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1E293B', marginBottom: '0.35rem' }}>
                  Image URL or Path *
                </label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. /images/massh-... or https://..."
                  value={newImageUrl}
                  onChange={e => setNewImageUrl(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                />
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Quick Pick Authentic:</span>
                  <button 
                    type="button" 
                    onClick={() => setNewImageUrl('/images/massh-foundation-stone-unveiled.jpg')} 
                    style={{ fontSize: '0.72rem', background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '0.15rem 0.45rem', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Foundation Stone
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setNewImageUrl('/images/massh-flag-unveiling-ceremony.jpg')} 
                    style={{ fontSize: '0.72rem', background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '0.15rem 0.45rem', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    MASSH Flag
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setNewImageUrl('/images/massh-science-lab-inspection.jpg')} 
                    style={{ fontSize: '0.72rem', background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '0.15rem 0.45rem', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Science Lab
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1E293B', marginBottom: '0.35rem' }}>
                    Category
                  </label>
                  <select 
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as PhotoCategory)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', background: '#FFFFFF' }}
                  >
                    <option value="FOUNDATION">Foundation Stone &amp; Milestone</option>
                    <option value="ACADEMICS">Science &amp; Academics</option>
                    <option value="VIP_VISIT">Ministerial &amp; State Visit</option>
                    <option value="CAMPUS_LIFE">Campus Courtyard &amp; Life</option>
                    <option value="ALUMNI_COMMUNITY">MOSA Community</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1E293B', marginBottom: '0.35rem' }}>
                    Date (Optional)
                  </label>
                  <input 
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1E293B', marginBottom: '0.35rem' }}>
                  Caption / Historical Story
                </label>
                <textarea 
                  rows={3}
                  placeholder="Describe the occasion, dignitaries or students present, and historical significance to MASSH..."
                  value={newCaption}
                  onChange={e => setNewCaption(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  style={{ 
                    padding: '0.65rem 1.5rem', 
                    borderRadius: '8px', 
                    border: 'none', 
                    background: '#D97706', 
                    color: '#FFFFFF', 
                    fontWeight: 700, 
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(217, 119, 6, 0.3)'
                  }}
                >
                  {isSubmitting ? 'Adding...' : 'Add to Heritage Gallery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
