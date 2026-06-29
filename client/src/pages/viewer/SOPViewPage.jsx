import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, User, GitBranch, Edit, CheckCircle, XCircle } from 'lucide-react';
import { sopService } from '../../services/services';
import { useAuthStore } from '../../store/authStore';

/* ═══════════════════════════════════════════════════════════════════════════
   FLOWCHART PRIMITIVES
   ═══════════════════════════════════════════════════════════════════════════ */

/* Measures a div's rendered width and re-measures on resize */
function useContainerWidth() {
  const ref = useRef(null);
  const [w, setW] = useState(550); // sensible default fallback
  useEffect(() => {
    if (!ref.current) return;
    const update = () => {
      if (ref.current) setW(ref.current.offsetWidth);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/* ── Straight vertical connector line (no arrow tip) ───────────────────── */
function VLine({ color = '#4b5563', lineH = 24 }) {
  return (
    <div style={{ width: 2, height: lineH, background: color, flexShrink: 0, userSelect: 'none' }} />
  );
}

/* ── Teal WI badge (left-attached to a step card) ──────────────── */
function WIBadge({ code, radius = '6px 0 0 6px' }) {
  if (!code) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', flexShrink: 0, userSelect: 'none' }}>
      <div style={{
        background: '#0d9488', color: '#fff',
        fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.07em',
        padding: '0 8px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: radius,
        flexShrink: 0,
      }}>WI</div>
      <div style={{
        background: 'rgba(13,148,136,0.12)',
        borderTop: '1.5px solid rgba(13,148,136,0.35)',
        borderRight: '1.5px solid rgba(13,148,136,0.35)',
        borderBottom: '1.5px solid rgba(13,148,136,0.35)',
        borderLeft: 'none',
        color: '#2dd4bf',
        fontSize: '0.72rem', fontWeight: 700, fontFamily: 'monospace',
        padding: '0 10px',
        display: 'flex', alignItems: 'center',
        whiteSpace: 'nowrap', flexShrink: 0,
        borderRadius: '0 6px 6px 0',
      }}>{code}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ACTION / REFERENCE NODE
   ─ WI badge is left-fused to the card so it looks like one connected unit
   ═══════════════════════════════════════════════════════════════════════════ */
function ActionNode({ step }) {
  const hasWI  = !!step.refCode;
  const isRef  = step.stepType === 'reference';
  const border = isRef ? '#818cf8' : '#0d9488';
  const hoverShadow = isRef ? 'rgba(129,140,248,0.2)' : 'rgba(13,148,136,0.2)';

  return (
    <div
      className="flowchart-step-card-hover"
      style={{
        display: 'flex', alignItems: 'stretch',
        width: '100%', maxWidth: 460, margin: '0 auto',
        borderRadius: '8px',
        transition: 'all 0.2s ease',
      }}
    >
      {/* WI badge fused on left */}
      {hasWI && <WIBadge code={step.refCode} />}

      {/* Card */}
      <div style={{
        flex: 1,
        background: 'var(--bg-card)',
        border: `2.5px solid ${border}`,
        borderRadius: hasWI ? '0 8px 8px 0' : '8px',
        padding: '14px 24px',
        textAlign: 'center',
        fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.45,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}>
        {isRef && '📎 '}{step.title}
        {step.body && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 5, fontWeight: 400 }}>
            {step.body}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   BRANCH SUB-STEP  (inside a Yes / No panel)
   ═══════════════════════════════════════════════════════════════════════════ */
function BranchStep({ step, idx, isLast, borderColor }) {
  const hasWI = !!step.refCode;
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {/* WI badge or letter circle */}
        {hasWI ? (
          <WIBadge code={step.refCode} radius="5px 0 0 5px" />
        ) : (
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: 'var(--bg-hover)', border: '1.5px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)',
            flexShrink: 0, alignSelf: 'center', marginRight: 8,
          }}>{String.fromCharCode(65 + idx)}</div>
        )}

        {/* Step card */}
        <div style={{
          flex: 1,
          background: 'var(--bg-base)',
          border: `1.5px solid ${borderColor}`,
          borderRadius: hasWI ? '0 6px 6px 0' : '6px',
          padding: '10px 14px',
          fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4,
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        }}>
          {step.title}
          {step.body && (
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 3, fontWeight: 400 }}>{step.body}</div>
          )}
        </div>
      </div>

      {/* Tiny connector between sub-steps */}
      {!isLast && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3px 0' }}>
          <div style={{ width: 1.5, height: 10, background: 'var(--border)' }} />
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DECISION BLOCK
   ─ Diamond  →  SVG branching lines  →  Yes/No panels  →  SVG merge lines
   ═══════════════════════════════════════════════════════════════════════════ */
function DecisionBlock({ step, uid }) {
  const [boxRef, W] = useContainerWidth();

  let yes = [], no = [];
  if (step.branchData) {
    try { const bd = JSON.parse(step.branchData); yes = bd.yesBranch || []; no = bd.noBranch || []; } catch (_) {}
  }

  // Calculate dynamic diamond dimensions based on title text length
  const charCount = step.title ? step.title.length : 20;
  const dW = Math.min(260, 160 + Math.max(0, charCount - 25) * 1.8);
  const dH = dW * 0.65; // keep nice aspect ratio

  /* Layout constants (all in px) */
  const cx    = W / 2;        // center x
  const yesCx = W * 0.25;    // center of yes (left) branch column
  const noCx  = W * 0.75;    // center of no  (right) branch column

  const yLine = 15 + dH / 2;  // Y coordinate of horizontal branch line
  const yEnd  = yLine + 65;   // Y coordinate where vertical lines end
  const BH    = yEnd + 5;     // Total height of SVG
  const MH    = 56;           // merge-connector SVG height
  const GREY  = '#4b5563';
  const yesC  = '#22c55e';
  const noC   = '#ef4444';

  /* Unique marker IDs to avoid collision when multiple decisions exist */
  const yID = `ya${uid}`;
  const nID = `na${uid}`;
  const tID = `ta${uid}`;

  // Calculate midpoint for Yes/No pill labels on horizontal SVG line
  const yesLabelX = ((cx - dW / 2) + yesCx) / 2;
  const noLabelX  = ((cx + dW / 2) + noCx) / 2;

  // Calculate text dimensions to fit perfectly inside the diamond
  const textW = dW - 30;
  const textH = dH * 0.65;
  const textX = cx - textW / 2;
  const textY = 15 + (dH - textH) / 2;

  return (
    <div ref={boxRef} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {/* ── Diamond and branch lines SVG ────────────────────────── */}
      {W > 0 && (
        <svg
          width={W} height={BH}
          style={{ display: 'block', flexShrink: 0, overflow: 'visible' }}
        >
          <defs>
            {/* Arrowhead markers */}
            <marker id={yID} markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
              <path d="M0,1 L7,4 L0,7 Z" fill={yesC} />
            </marker>
            <marker id={nID} markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
              <path d="M0,1 L7,4 L0,7 Z" fill={noC} />
            </marker>
            <marker id={tID} markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
              <path d="M0,1 L7,4 L0,7 Z" fill={GREY} />
            </marker>
          </defs>

          {/* Incoming vertical arrow pointing into the top tip of the diamond (cx, 15) */}
          <line x1={cx} y1={0} x2={cx} y2={12} stroke={GREY} strokeWidth="2" markerEnd={`url(#${tID})`} />

          {/* Diamond path (rotated square): Top (cx, 15), Right (cx + dW/2, yLine), Bottom (cx, 15 + dH), Left (cx - dW/2, yLine) */}
          <polygon
            points={`${cx},15 ${cx + dW / 2},${yLine} ${cx},${15 + dH} ${cx - dW / 2},${yLine}`}
            fill="var(--bg-card)"
            stroke="#f59e0b"
            strokeWidth="2.5"
            style={{ filter: 'drop-shadow(0px 4px 12px rgba(245,158,11,0.22))' }}
          />

          {/* Text inside the diamond (HTML inside SVG foreignObject for perfect wrapping/centering) */}
          <foreignObject x={textX} y={textY} width={textW} height={textH}>
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)',
              textAlign: 'center', lineHeight: 1.35,
              padding: '0 6px', wordBreak: 'break-word',
              userSelect: 'none',
            }}>
              {step.title}
            </div>
          </foreignObject>

          {/* Yes branch line (Green): exits Left vertex -> goes left to yesCx -> goes down to yEnd */}
          <path
            d={`M ${cx - dW / 2} ${yLine} L ${yesCx} ${yLine} L ${yesCx} ${yEnd - 2}`}
            fill="none"
            stroke={yesC}
            strokeWidth="2"
            markerEnd={`url(#${yID})`}
          />

          {/* No branch line (Red): exits Right vertex -> goes right to noCx -> goes down to yEnd */}
          <path
            d={`M ${cx + dW / 2} ${yLine} L ${noCx} ${yLine} L ${noCx} ${yEnd - 2}`}
            fill="none"
            stroke={noC}
            strokeWidth="2"
            markerEnd={`url(#${nID})`}
          />

          {/* "Yes" pill badge placed exactly on TOP of the horizontal segment */}
          <foreignObject x={yesLabelX - 18} y={yLine - 25} width={36} height={20}>
            <div style={{
              background: 'rgba(34,197,94,0.16)',
              border: '1.5px solid #22c55e',
              borderRadius: '5px',
              color: '#22c55e',
              fontSize: '0.72rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              userSelect: 'none',
            }}>
              Yes
            </div>
          </foreignObject>

          {/* "No" pill badge placed exactly on TOP of the horizontal segment */}
          <foreignObject x={noLabelX - 18} y={yLine - 25} width={36} height={20}>
            <div style={{
              background: 'rgba(239,68,68,0.16)',
              border: '1.5px solid #ef4444',
              borderRadius: '5px',
              color: '#ef4444',
              fontSize: '0.72rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              userSelect: 'none',
            }}>
              No
            </div>
          </foreignObject>
        </svg>
      )}
      {/* Height placeholder while W is being measured */}
      {W === 0 && <div style={{ height: BH, width: '100%' }} />}

      {/* ── Yes / No Branch Panels ────────────────────────────── */}
      <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'stretch' }}>

        {/* Yes panel */}
        <div style={{
          background: 'rgba(34,197,94,0.04)',
          border: '1.5px solid rgba(34,197,94,0.3)',
          borderRadius: 12, padding: 14,
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12,
                        color: '#22c55e', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.06em' }}>
            <CheckCircle size={13} /> YES PATH
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: 8 }}>
            {yes.length === 0
              ? <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 0' }}>No steps defined</div>
              : yes.map((bs, i) => <BranchStep key={i} step={bs} idx={i} isLast={i === yes.length - 1} borderColor="rgba(34,197,94,0.25)" />)
            }
          </div>
        </div>

        {/* No panel */}
        <div style={{
          background: 'rgba(239,68,68,0.04)',
          border: '1.5px solid rgba(239,68,68,0.3)',
          borderRadius: 12, padding: 14,
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12,
                        color: '#ef4444', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.06em' }}>
            <XCircle size={13} /> NO PATH
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: 8 }}>
            {no.length === 0
              ? <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 0' }}>No steps defined</div>
              : no.map((bs, i) => <BranchStep key={i} step={bs} idx={i} isLast={i === no.length - 1} borderColor="rgba(239,68,68,0.25)" />)
            }
          </div>
        </div>
      </div>

      {/* ── Merge-connector SVG ─────────────────────────────────── */}
      {W > 0 && (
        <svg
          width={W} height={MH}
          style={{ display: 'block', flexShrink: 0, overflow: 'visible' }}
        >
          {/* Left arm from Yes column center */}
          <path
            d={`M ${yesCx} 0 L ${yesCx} 22 L ${cx} 22`}
            fill="none" stroke={GREY} strokeWidth="2" strokeLinejoin="round"
          />
          {/* Right arm from No column center */}
          <path
            d={`M ${noCx} 0 L ${noCx} 22 L ${cx} 22`}
            fill="none" stroke={GREY} strokeWidth="2" strokeLinejoin="round"
          />
          {/* Stem down with arrow tip */}
          <line x1={cx} y1={22} x2={cx} y2={46} stroke={GREY} strokeWidth="2" />
          <polygon
            points={`${cx - 5},44 ${cx + 5},44 ${cx},52`}
            fill={GREY}
          />
        </svg>
      )}
      {W === 0 && <div style={{ height: MH, width: '100%' }} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FLOWCHART ORCHESTRATOR
   ═══════════════════════════════════════════════════════════════════════════ */
function FlowchartViewer({ steps }) {
  if (!steps || steps.length === 0) return null;

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 20, padding: '36px 24px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      overflowX: 'auto',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: 550, // ensures the flowchart maintaining structure on mobile
        margin: '0 auto',
      }}>
        {steps.map((step, idx) => {
          const prevIsDecision = idx > 0 && steps[idx - 1].stepType === 'decision';
          const isDecision     = step.stepType === 'decision';

          return (
            <div key={step.id || idx} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/*
                Draw a VLine BEFORE this step, UNLESS:
                  • it's the first step (nothing above)
                  • the previous step was a decision block (that block already
                    drew its own merge-connector with arrowhead at the bottom)
              */}
              {idx > 0 && !prevIsDecision && (
                <VLine lineH={30} />
              )}

              {isDecision
                ? <DecisionBlock step={step} uid={step.id ?? idx} />
                : <ActionNode step={step} />
              }
            </div>
          );
        })}

        {/* ── Final Continue button ─────────────────────────────── */}
        {/* If last step was NOT a decision, draw the exit arrow */}
        {steps[steps.length - 1]?.stepType !== 'decision' && (
          <VLine color="var(--brand-primary)" lineH={26} />
        )}
        <div style={{ marginTop: 8 }}>
          <button
            onClick={() => {}}
            style={{
              background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-dark))',
              color: '#fff', fontWeight: 700, fontSize: '1rem',
              padding: '14px 64px', borderRadius: 12,
              border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(26,158,150,0.45)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1.5px)';
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(26,158,150,0.6)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(26,158,150,0.45)';
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
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
