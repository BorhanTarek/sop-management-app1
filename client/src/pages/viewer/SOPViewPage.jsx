import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, User, Tag, GitBranch, Edit } from 'lucide-react';
import { sopService } from '../../services/services';
import { useAuthStore } from '../../store/authStore';

function FlowchartViewer({ steps }) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="flowchart-container">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        {steps.map((step, idx) => (
          <div key={step.id || idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 560 }}>
            {/* Ref code badge (left side) */}
            {step.refCode && (
              <div style={{ alignSelf: 'flex-start', marginLeft: '10%', marginBottom: 4 }}>
                <span style={{
                  background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
                  borderRadius: 4, padding: '2px 8px', fontSize: '0.68rem', color: 'var(--info)', fontFamily: 'monospace'
                }}>
                  {step.refCode}
                </span>
              </div>
            )}

            {/* Step node */}
            {step.stepType === 'decision' ? (
              <div style={{
                background: 'var(--bg-card)', border: '2px solid var(--warning)',
                borderRadius: 4, padding: '12px 20px', textAlign: 'center',
                minWidth: 200, maxWidth: 320,
                clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)',
                position: 'relative',
              }}>
                {step.title}
              </div>
            ) : step.stepType === 'reference' ? (
              <div style={{
                background: 'rgba(26,158,150,0.1)', border: '2px solid var(--brand-primary)',
                borderRadius: 'var(--radius-sm)', padding: '10px 24px',
                fontSize: '0.85rem', fontWeight: 500, color: 'var(--brand-accent)',
                textAlign: 'center', minWidth: 180,
              }}>
                📎 {step.title}
              </div>
            ) : (
              <div style={{
                background: 'var(--bg-card)', border: '2px solid var(--brand-primary)',
                borderRadius: 'var(--radius-sm)', padding: '10px 24px',
                fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)',
                textAlign: 'center', minWidth: 200, maxWidth: 360,
              }}>
                {step.title}
                {step.body && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{step.body}</div>}
              </div>
            )}

            {/* Arrow between steps */}
            {idx < steps.length - 1 && (
              <div style={{ width: 2, height: 28, background: 'var(--text-muted)', position: 'relative', flexShrink: 0 }}>
                <div style={{
                  position: 'absolute', bottom: -1, left: '50%', transform: 'translateX(-50%)',
                  width: 0, height: 0,
                  borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
                  borderTop: '7px solid var(--text-muted)',
                }} />
              </div>
            )}
          </div>
        ))}

        {/* Continue button (like the mobile app) */}
        <div style={{ marginTop: 32 }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-dark))',
            color: '#fff', fontWeight: 700, fontSize: '1.1rem',
            padding: '14px 48px', borderRadius: 'var(--radius-md)',
            boxShadow: '0 4px 16px rgba(26,158,150,0.4)',
          }}>
            Continue
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SOPViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isEditor } = useAuthStore();
  const [sop, setSop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sopService.get(id).then(r => setSop(r.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}><div className="loading-spinner" /></div>;
  if (!sop) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <div className="empty-state" style={{ marginTop: 80 }}>
        <div className="empty-state-icon">❌</div>
        <h3>SOP not found</h3>
        <button className="btn btn-primary" onClick={() => navigate('/browse')}>Go Back</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-dark))',
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: '50%', width: 36, height: 36,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer',
        }}>
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem' }}>{sop.docType}</div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem' }}>{sop.title}</div>
        </div>
        {(isAdmin() || isEditor()) && (
          <button onClick={() => navigate(`/admin/sops/${sop.id}/edit`)} style={{
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 'var(--radius-sm)', padding: '6px 12px',
            color: '#fff', fontSize: '0.78rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Edit size={13} /> Edit
          </button>
        )}
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
        {/* Metadata strip */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: '16px 20px',
          display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 24,
        }}>
          {sop.referenceCode && (
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 3 }}>Reference Code</div>
              <code style={{ color: 'var(--brand-accent)', fontSize: '0.85rem' }}>{sop.referenceCode}</code>
            </div>
          )}
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 3 }}>Version</div>
            <span className="badge badge-sop">v{sop.currentVersion}</span>
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 3 }}>Status</div>
            <span className={`badge badge-${sop.status}`}>{sop.status}</span>
          </div>
          {sop.category && (
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 3 }}>Category</div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{sop.category.name}</span>
            </div>
          )}
          {sop.owner && (
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}><User size={10} /> Owner</div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{sop.owner.fullName}</span>
            </div>
          )}
          {sop.publishedAt && (
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={10} /> Published</div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{new Date(sop.publishedAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Flowchart */}
        {sop.steps && sop.steps.length > 0 ? (
          <>
            <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <GitBranch size={16} style={{ color: 'var(--brand-accent)' }} />
              Procedure Flowchart
            </h3>
            <FlowchartViewer steps={sop.steps} />
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No steps defined</h3>
            <p>This SOP has no procedural steps yet.</p>
            {(isAdmin() || isEditor()) && (
              <button className="btn btn-primary btn-sm" onClick={() => navigate(`/admin/sops/${sop.id}/edit`)}>
                <Edit size={13} /> Add Steps
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
