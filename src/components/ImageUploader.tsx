import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X, Link, CheckCircle2, RefreshCw } from 'lucide-react';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  required?: boolean;
  helpText?: string;
  placeholderUrl?: string;
}

/**
 * Compresses an image file in-browser using HTML5 Canvas to keep base64 payloads lightweight (~100-250KB).
 */
const compressImageFile = (file: File, maxDim = 1200, quality = 0.82): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Output clean WebP or JPEG base64
        const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mime, quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image for processing'));
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  label = 'Upload Image',
  required = false,
  helpText = 'Upload directly from your device (PNG, JPG, WEBP) or capture with camera',
  placeholderUrl,
}) => {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please choose a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }
    setError(null);
    setIsProcessing(true);
    try {
      const dataUrl = await compressImageFile(file);
      onChange(dataUrl);
    } catch (err) {
      console.error(err);
      setError('Failed to process image file. Please try another image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleClear = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B' }}>
          {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
        </label>

        {/* Mode Toggle: Direct Upload vs External Link */}
        <div style={{ display: 'flex', gap: '0.25rem', background: '#F1F5F9', padding: '2px', borderRadius: '6px' }}>
          <button
            type="button"
            onClick={() => setMode('upload')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.2rem 0.55rem',
              fontSize: '0.72rem',
              fontWeight: mode === 'upload' ? 700 : 500,
              color: mode === 'upload' ? '#0B203E' : '#64748B',
              background: mode === 'upload' ? '#FFFFFF' : 'transparent',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: mode === 'upload' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <Upload size={12} />
            <span>Direct Upload</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('url')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.2rem 0.55rem',
              fontSize: '0.72rem',
              fontWeight: mode === 'url' ? 700 : 500,
              color: mode === 'url' ? '#0B203E' : '#64748B',
              background: mode === 'url' ? '#FFFFFF' : 'transparent',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: mode === 'url' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <Link size={12} />
            <span>Image URL</span>
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileInputChange}
        style={{ display: 'none' }}
      />

      {/* Preview Card If An Image is Set */}
      {value ? (
        <div
          style={{
            position: 'relative',
            borderRadius: '12px',
            border: '1.5px solid #CBD5E1',
            background: '#F8FAFC',
            overflow: 'hidden',
            padding: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '8px',
              overflow: 'hidden',
              background: '#0F172A',
              flexShrink: 0,
              border: '1px solid #E2E8F0',
            }}
          >
            <img
              src={value}
              alt="Uploaded Preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = placeholderUrl || 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=400&q=80';
              }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '180px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#16A34A', fontSize: '0.8rem', fontWeight: 700 }}>
              <CheckCircle2 size={15} />
              <span>Image Attached & Ready</span>
            </div>
            <p style={{ margin: '0.2rem 0 0.5rem 0', fontSize: '0.74rem', color: '#64748B', wordBreak: 'break-all' }}>
              {value.startsWith('data:') ? 'Stored as direct compressed image payload' : value.slice(0, 50) + (value.length > 50 ? '...' : '')}
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
              >
                <RefreshCw size={12} /> Replace
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="btn btn-danger"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
              >
                <X size={12} /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : mode === 'upload' ? (
        /* Direct File Upload Dropzone */
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          style={{
            border: isDragging ? '2px dashed #06B6D4' : '2px dashed #CBD5E1',
            borderRadius: '12px',
            background: isDragging ? '#ECFEFF' : '#F8FAFC',
            padding: '1.75rem 1rem',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {isProcessing ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: '#0B203E' }}>
              <div className="spinner" style={{ width: '28px', height: '28px', margin: '0 auto' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Optimizing and compressing image...</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: '#EFF6FF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Upload size={20} />
              </div>

              <div>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0B203E' }}>
                  Click to upload from device
                </span>
                <span style={{ fontSize: '0.82rem', color: '#64748B' }}> or drag and drop</span>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                Supports camera capture on mobile • PNG, JPG, WEBP (auto-compressed)
              </div>
            </div>
          )}
        </div>
      ) : (
        /* URL Input Fallback */
        <div>
          <input
            type="url"
            placeholder="Paste public image URL (e.g. https://... or /images/...)"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              border: '1.5px solid #CBD5E1',
              fontSize: '0.9rem',
            }}
          />
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.35rem' }}>
            Tip: You can also click "Direct Upload" above to choose photos directly from your phone gallery or files.
          </div>
        </div>
      )}

      {error && (
        <div style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: 600 }}>
          {error}
        </div>
      )}
    </div>
  );
};
