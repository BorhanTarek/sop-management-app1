import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader, Upload, X } from 'lucide-react';
import { safetyNoticeService } from '../../services/services';

const PERMITTED_ROLES = ['station_manager', 'station_master', 'transport_manager', 'driver', 'occ'];

export default function SafetyNoticeEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', content: '', isPublished: false, permittedRoles: [] });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    safetyNoticeService.get(id)
      .then(r => {
        const wi = r.data;
        setForm({
          title: wi.title,
          content: wi.content,
          isPublished: wi.isPublished,
          permittedRoles: wi.permittedRoles || []
        });
        if (wi.imageUrl) {
          setExistingImageUrl(wi.imageUrl);
          setImagePreview(wi.imageUrl);
        }
      })
      .catch(err => {
        setError('Failed to load safety notice');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setError('Only image and PDF files are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      return;
    }

    setError('');
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setExistingImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const togglePermittedRole = (role) => {
    setForm(f => ({
      ...f,
      permittedRoles: f.permittedRoles.includes(role)
        ? f.permittedRoles.filter(r => r !== role)
        : [...f.permittedRoles, role]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and content are required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('content', form.content.trim());
      formData.append('isPublished', form.isPublished);
      formData.append('permittedRoles', JSON.stringify(form.permittedRoles));
      
      if (imageFile) {
        formData.append('image', imageFile);
      } else if (!existingImageUrl && !imagePreview) {
        formData.append('image', ''); 
      }

      await safetyNoticeService.update(id, formData);
      navigate('/admin/safety-notices');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update safety notice.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <Loader size={30} className="spin" style={{ color: 'var(--brand-accent)' }} />
      </div>
    );
  }

  const isPdf = imageFile?.type === 'application/pdf' || 
                existingImageUrl.toLowerCase().endsWith('.pdf') || 
                (imagePreview && imagePreview.startsWith('data:application/pdf'));

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            type="button" 
            className="btn btn-ghost btn-sm" 
            onClick={() => navigate('/admin/safety-notices')}
          >
            <ArrowLeft size={15} />
          </button>
          <div>
            <h1>Edit Safety Notice</h1>
            <p style={{ marginTop: 4, fontSize: '0.85rem' }}>Update safety notice directives, alerts, and illustrations</p>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ 
          background: 'rgba(239,68,68,0.1)', 
          border: '1px solid rgba(239,68,68,0.3)', 
          borderRadius: 'var(--radius-sm)', 
          padding: '10px 14px', 
          color: 'var(--danger)', 
          fontSize: '0.85rem', 
          marginBottom: 20 
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
        {/* Main Content Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Notice Title *</label>
            <input 
              className="form-control" 
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notice Text Details *</label>
            <textarea 
              className="form-control" 
              rows={12}
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              required
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Sidebar Info & Upload Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Target Audience Roles */}
          <div className="card">
            <h3 style={{ marginBottom: 12 }}>Target Audience / Permitted Roles</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PERMITTED_ROLES.map(r => (
                <button 
                  key={r} 
                  type="button"
                  style={{
                    padding: '5px 14px', 
                    borderRadius: 99, 
                    fontSize: '0.8rem', 
                    fontWeight: 700, 
                    cursor: 'pointer',
                    border: `1.5px solid ${form.permittedRoles.includes(r) ? 'var(--brand-accent)' : 'var(--border)'}`,
                    background: form.permittedRoles.includes(r) ? 'rgba(26,158,150,0.1)' : 'transparent',
                    color: form.permittedRoles.includes(r) ? 'var(--brand-accent)' : 'var(--text-muted)',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => togglePermittedRole(r)}
                >
                  {r.replace('_', ' ')}
                </button>
              ))}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
              Select the roles that can view this safety notice in their portal. Admin users can always view all notices.
            </div>
          </div>

          {/* Upload Image Section */}
          <div className="card">
            <h3 style={{ marginBottom: 12 }}>File Attachment / Illustration</h3>
            
            {imagePreview ? (
              <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                {isPdf ? (
                  <iframe 
                    src={imagePreview} 
                    title="PDF Attachment Preview" 
                    style={{ width: '100%', height: 240, border: 'none', background: '#0a0b0d' }}
                  />
                ) : (
                  <img 
                    src={imagePreview} 
                    alt="Selected Preview" 
                    style={{ width: '100%', maxHeight: 220, objectFit: 'contain', background: '#0a0b0d' }} 
                  />
                )}
                <button 
                  type="button" 
                  onClick={removeImage}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: 'rgba(239, 68, 68, 0.85)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: 26,
                    height: 26,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    zIndex: 10
                  }}
                  title="Remove File"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--border)',
                  borderRadius: 10,
                  padding: '36px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'var(--bg-input)',
                  transition: 'border-color 0.15s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand-primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Upload Safety Notice Image or PDF
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  PNG, JPG, JPEG, GIF or PDF up to 5MB
                </div>
              </div>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*,application/pdf" 
              onChange={handleFileChange} 
            />
          </div>

          {/* Publishing controls */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3>Status & Publish</h3>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '4px 0' }}>
              <input 
                type="checkbox" 
                checked={form.isPublished}
                onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))}
                style={{ accentColor: 'var(--brand-primary)', width: 16, height: 16 }}
              />
              <div>
                <span className="form-label" style={{ margin: 0, display: 'block' }}>Published Live</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  If unchecked, it will be hidden as a draft.
                </span>
              </div>
            </label>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
              disabled={saving}
            >
              {saving ? <Loader size={14} className="spin" /> : <Save size={14} />} 
              Save Changes
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
