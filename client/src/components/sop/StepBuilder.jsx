import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, CheckCircle, XCircle, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';

// ─── Step type metadata ────────────────────────────────────────────────
const STEP_TYPES = ['action', 'safety_critical', 'decision', 'reference'];
const STEP_META = {
  action:          { label: 'Action',          icon: '▬',  color: '#1a9e96' },
  safety_critical: { label: 'Safety Critical', icon: '⚠',  color: '#dc2626' },
  decision:        { label: 'Decision',        icon: '◇',  color: '#f59e0b' },
  reference:       { label: 'Reference',       icon: '📎', color: '#818cf8' },
};

/* ══════════════════════════════════════════════════════════════════════
   INTERACTIVE BADGE MANAGER
   Each attentionPoint / safetyPoint is an object: { text: string }
   Badges are auto-sequenced: P1, P2, P3 ... / S1, S2, S3 ...
   Clicking a badge in ADMIN mode expands an inline text editor.
   ══════════════════════════════════════════════════════════════════════ */
function BadgeManager({ type, items, onChange }) {
  // 'expanded' tracks which badge index is currently open (-1 = none)
  const [expanded, setExpanded] = useState(-1);
  const textareaRef = useRef(null);

  const isAttention = type === 'attention';
  const prefix      = isAttention ? 'P' : 'S';
  const accentColor = isAttention ? '#16a34a' : '#dc2626';
  const accentAlpha = isAttention ? 'rgba(22,163,74,' : 'rgba(220,38,38,';
  const label       = isAttention ? 'Point of Attention' : 'Safety Point';

  const addBadge = () => {
    const next = [...(items || []), { text: '' }];
    onChange(next);
    // Auto-open the new badge's editor
    setExpanded(next.length - 1);
  };

  const removeBadge = (idx) => {
    const next = (items || []).filter((_, i) => i !== idx);
    onChange(next);
    setExpanded(e => (e >= next.length ? next.length - 1 : e));
  };

  const updateText = (idx, text) => {
    const next = (items || []).map((b, i) => i === idx ? { ...b, text } : b);
    onChange(next);
  };

  const toggleExpand = (idx) => {
    setExpanded(e => (e === idx ? -1 : idx));
  };

  // Auto-focus textarea when a badge is expanded
  useEffect(() => {
    if (expanded >= 0 && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [expanded]);

  const list = items || [];

  return (
    <div className="badge-manager">
      {/* Header row: label + Add button */}
      <div className="badge-manager-header">
        <span className="badge-manager-title" style={{ color: accentColor }}>
          {label}
          {list.length > 0 && (
            <span className="badge-manager-count">{list.length}</span>
          )}
        </span>
        <button
          type="button"
          className="badge-manager-add"
          style={{ color: accentColor, borderColor: `${accentAlpha}0.4)` }}
          onClick={addBadge}
          title={`Add ${label}`}
        >
          <Plus size={10} />
          Add {prefix}
        </button>
      </div>

      {/* Badge list */}
      {list.length > 0 && (
        <div className="badge-manager-list">
          {list.map((badge, idx) => {
            const isOpen = expanded === idx;
            const badgeLabel = `${prefix}${idx + 1}`;

            return (
              <div key={idx} className={`badge-item${isOpen ? ' badge-item--open' : ''}`}>
                {/* Badge pill row */}
                <div className="badge-item-row">
                  {/* Clickable pill */}
                  <button
                    type="button"
                    className="badge-pill"
                    style={{
                      background: isOpen ? accentColor : `${accentAlpha}0.12)`,
                      borderColor: accentColor,
                      color: isOpen ? '#fff' : accentColor,
                      boxShadow: isOpen ? `0 2px 10px ${accentAlpha}0.4)` : 'none',
                    }}
                    onClick={() => toggleExpand(idx)}
                    title={isOpen ? `Collapse ${badgeLabel}` : `Edit ${badgeLabel}`}
                  >
                    {badgeLabel}
                    {isOpen
                      ? <ChevronUp size={9} style={{ marginLeft: 3 }} />
                      : <ChevronDown size={9} style={{ marginLeft: 3 }} />
                    }
                  </button>

                  {/* Text preview (collapsed) */}
                  {!isOpen && badge.text && (
                    <span className="badge-preview-text">
                      {badge.text.length > 55 ? badge.text.slice(0, 55) + '…' : badge.text}
                    </span>
                  )}
                  {!isOpen && !badge.text && (
                    <span className="badge-preview-empty">Click to add description…</span>
                  )}

                  {/* Remove button */}
                  <button
                    type="button"
                    className="badge-remove"
                    onClick={() => removeBadge(idx)}
                    title={`Remove ${badgeLabel}`}
                  >
                    <Trash2 size={10} />
                  </button>
                </div>

                {/* Expandable text editor */}
                {isOpen && (
                  <div
                    className="badge-editor"
                    style={{
                      borderColor: `${accentAlpha}0.35)`,
                      background: `${accentAlpha}0.04)`,
                    }}
                  >
                    <div className="badge-editor-label" style={{ color: accentColor }}>
                      {badgeLabel} Description
                    </div>
                    <textarea
                      ref={textareaRef}
                      className="badge-editor-textarea"
                      placeholder={`Describe what operators must do or observe for ${badgeLabel}…`}
                      value={badge.text || ''}
                      onChange={e => updateText(idx, e.target.value)}
                      rows={3}
                      style={{
                        borderColor: `${accentAlpha}0.25)`,
                      }}
                    />
                    <div className="badge-editor-footer">
                      <span className="badge-char-count">
                        {(badge.text || '').length} chars
                      </span>
                      <button
                        type="button"
                        className="badge-editor-done"
                        style={{ color: accentColor, borderColor: `${accentAlpha}0.35)` }}
                        onClick={() => setExpanded(-1)}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   COMBINED SAFETY BADGE PANEL  (used in action + safety_critical steps)
   ══════════════════════════════════════════════════════════════════════ */
function SafetyBadgePanel({ attentionPoints, safetyPoints, onChange }) {
  return (
    <div className="safety-badge-panel">
      <BadgeManager
        type="attention"
        items={attentionPoints || []}
        onChange={items => onChange('attentionPoints', items)}
      />
      <BadgeManager
        type="safety"
        items={safetyPoints || []}
        onChange={items => onChange('safetyPoints', items)}
      />
    </div>
  );
}

// ─── WI Code badge input ───────────────────────────────────────────────
function WICodeInput({ value, onChange, placeholder = 'RTM-D14' }) {
  return (
    <div className="wi-code-input-wrap">
      <span className="wi-code-prefix">WI</span>
      <input
        className="form-control wi-code-field"
        placeholder={placeholder}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

// ─── Sub-step row inside a Yes/No branch panel ─────────────────────────
function BranchStepRow({ step, idx, onChange, onRemove }) {
  return (
    <div className="branch-step-row">
      <span className="branch-step-letter">{String.fromCharCode(65 + idx)}</span>
      <div className="branch-step-fields">
        <input
          className="form-control"
          placeholder="Step title *"
          value={step.title || ''}
          onChange={e => onChange(idx, 'title', e.target.value)}
        />
        <input
          className="form-control"
          placeholder="Description (optional)"
          value={step.body || ''}
          onChange={e => onChange(idx, 'body', e.target.value)}
          style={{ marginTop: 5 }}
        />
        <WICodeInput
          value={step.refCode}
          onChange={val => onChange(idx, 'refCode', val)}
          placeholder="e.g. RTM-D14 (optional)"
        />
      </div>
      <button type="button" className="btn btn-danger btn-sm" onClick={() => onRemove(idx)} title="Remove step">
        <Trash2 size={11} />
      </button>
    </div>
  );
}

// ─── Branch panel (Yes or No) ──────────────────────────────────────────
function BranchPanel({ type, steps, onAddStep, onChangeStep, onRemoveStep }) {
  const isYes = type === 'yes';
  return (
    <div className={`branch-panel branch-panel--${type}`}>
      <div className="branch-panel-header">
        {isYes
          ? <CheckCircle size={13} style={{ color: '#22c55e' }} />
          : <XCircle size={13} style={{ color: '#ef4444' }} />
        }
        <span>{isYes ? 'Yes Path' : 'No Path'}</span>
        <span className="branch-step-count">{steps.length} step{steps.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="branch-panel-steps">
        {steps.length === 0 && (
          <div className="branch-empty">No steps yet — click below to add one</div>
        )}
        {steps.map((bs, bi) => (
          <BranchStepRow
            key={bs.id ?? bi}
            step={bs}
            idx={bi}
            onChange={onChangeStep}
            onRemove={onRemoveStep}
          />
        ))}
        <button type="button" className="btn-branch-add" onClick={onAddStep}>
          <Plus size={11} /> Add Step
        </button>
      </div>
    </div>
  );
}

// ─── Main StepBuilder component ────────────────────────────────────────
export default function StepBuilder({ steps, setSteps }) {
  const newStep = (type = 'action') => ({
    id: Date.now() + Math.random(),
    title: '',
    body: '',
    stepType: type,
    refCode: '',
    sortOrder: steps.length,
    yesBranch: [],
    noBranch: [],
    attentionPoints: [],
    safetyPoints: [],
  });

  const addStep = (type) => setSteps(s => [...s, newStep(type)]);

  const updateStep = (idx, key, val) =>
    setSteps(s => s.map((st, i) => (i === idx ? { ...st, [key]: val } : st)));

  const removeStep = (idx) => setSteps(s => s.filter((_, i) => i !== idx));

  const moveStep = (idx, dir) => {
    const swap = idx + dir;
    if (swap < 0 || swap >= steps.length) return;
    const arr = [...steps];
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
    setSteps(arr);
  };

  const changeType = (idx, newType) =>
    setSteps(s => s.map((st, i) =>
      i === idx
        ? {
            ...st,
            stepType: newType,
            yesBranch: st.yesBranch || [],
            noBranch: st.noBranch || [],
            refCode: newType === 'decision' ? '' : st.refCode,
            attentionPoints: st.attentionPoints || [],
            safetyPoints: st.safetyPoints || [],
          }
        : st
    ));

  const addBranchStep = (stepIdx, branch) =>
    setSteps(s => s.map((st, i) => {
      if (i !== stepIdx) return st;
      const bs = { id: Date.now() + Math.random(), title: '', body: '', stepType: 'action', refCode: '' };
      return { ...st, [branch]: [...(st[branch] || []), bs] };
    }));

  const updateBranchStep = (stepIdx, branch, bi, key, val) =>
    setSteps(s => s.map((st, i) => {
      if (i !== stepIdx) return st;
      const updated = (st[branch] || []).map((bs, j) => j === bi ? { ...bs, [key]: val } : bs);
      return { ...st, [branch]: updated };
    }));

  const removeBranchStep = (stepIdx, branch, bi) =>
    setSteps(s => s.map((st, i) => {
      if (i !== stepIdx) return st;
      return { ...st, [branch]: (st[branch] || []).filter((_, j) => j !== bi) };
    }));

  return (
    <div className="step-builder">
      {steps.map((step, idx) => {
        const meta       = STEP_META[step.stepType] || STEP_META.action;
        const isDecision = step.stepType === 'decision';
        const isSafety   = step.stepType === 'safety_critical';

        return (
          <div key={step.id ?? idx} className={`step-card step-card--${step.stepType}`}>
            {/* ── Card header ── */}
            <div className="step-card-header">
              <span className="step-card-num" style={{ background: meta.color }}>
                {isDecision ? '◇' : isSafety ? '⚠' : idx + 1}
              </span>

              <div className="step-type-toggle">
                {STEP_TYPES.map(t => {
                  const m = STEP_META[t];
                  const active = step.stepType === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      className={`step-type-btn${active ? ' active' : ''}`}
                      style={active ? {
                        background: m.color,
                        borderColor: m.color,
                        color: t === 'decision' ? '#000' : '#fff',
                      } : {}}
                      onClick={() => changeType(idx, t)}
                      title={`Switch to ${m.label} step`}
                    >
                      {m.icon} {m.label}
                    </button>
                  );
                })}
              </div>

              <div className="step-card-actions">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => moveStep(idx, -1)} title="Move up"><ArrowUp size={12} /></button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => moveStep(idx, 1)} title="Move down"><ArrowDown size={12} /></button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => removeStep(idx)} title="Remove step"><Trash2 size={12} /></button>
              </div>
            </div>

            {/* ── Card body ── */}
            <div className="step-card-body">
              {isDecision ? (
                /* ── DECISION ── */
                <>
                  <div className="decision-question-row">
                    <span className="decision-diamond-icon">◇</span>
                    <div style={{ flex: 1 }}>
                      <input
                        className="form-control decision-title-input"
                        placeholder="Decision question, e.g. Any item blocking the door rail?"
                        value={step.title}
                        onChange={e => updateStep(idx, 'title', e.target.value)}
                      />
                      <div className="decision-wi-notice">
                        ℹ️ Work Instruction codes are assigned per branch sub-step below
                      </div>
                    </div>
                  </div>
                  <div className="decision-branches">
                    <BranchPanel
                      type="yes"
                      steps={step.yesBranch || []}
                      onAddStep={() => addBranchStep(idx, 'yesBranch')}
                      onChangeStep={(bi, key, val) => updateBranchStep(idx, 'yesBranch', bi, key, val)}
                      onRemoveStep={bi => removeBranchStep(idx, 'yesBranch', bi)}
                    />
                    <BranchPanel
                      type="no"
                      steps={step.noBranch || []}
                      onAddStep={() => addBranchStep(idx, 'noBranch')}
                      onChangeStep={(bi, key, val) => updateBranchStep(idx, 'noBranch', bi, key, val)}
                      onRemoveStep={bi => removeBranchStep(idx, 'noBranch', bi)}
                    />
                  </div>
                </>
              ) : isSafety ? (
                /* ── SAFETY CRITICAL ── */
                <>
                  <div className="safety-critical-banner">
                    <ShieldAlert size={16} />
                    <span>SAFETY CRITICAL ACTION — Failure to comply may cause injury or system damage</span>
                  </div>
                  <div className="action-step-main-row">
                    <input
                      className="form-control"
                      placeholder="Safety critical step title *"
                      value={step.title}
                      onChange={e => updateStep(idx, 'title', e.target.value)}
                    />
                    <WICodeInput
                      value={step.refCode}
                      onChange={val => updateStep(idx, 'refCode', val)}
                      placeholder="RTM-H11 (optional)"
                    />
                  </div>
                  <input
                    className="form-control"
                    placeholder="Description / consequence (optional)"
                    value={step.body || ''}
                    onChange={e => updateStep(idx, 'body', e.target.value)}
                    style={{ marginTop: 8 }}
                  />
                  <SafetyBadgePanel
                    attentionPoints={step.attentionPoints || []}
                    safetyPoints={step.safetyPoints || []}
                    onChange={(key, val) => updateStep(idx, key, val)}
                  />
                </>
              ) : (
                /* ── ACTION / REFERENCE ── */
                <>
                  <div className="action-step-main-row">
                    <input
                      className="form-control"
                      placeholder={step.stepType === 'reference' ? 'Reference document title *' : 'Step title *'}
                      value={step.title}
                      onChange={e => updateStep(idx, 'title', e.target.value)}
                    />
                    <WICodeInput
                      value={step.refCode}
                      onChange={val => updateStep(idx, 'refCode', val)}
                      placeholder="RTM-H11 (optional)"
                    />
                  </div>
                  <input
                    className="form-control"
                    placeholder="Description (optional)"
                    value={step.body || ''}
                    onChange={e => updateStep(idx, 'body', e.target.value)}
                    style={{ marginTop: 8 }}
                  />
                  <SafetyBadgePanel
                    attentionPoints={step.attentionPoints || []}
                    safetyPoints={step.safetyPoints || []}
                    onChange={(key, val) => updateStep(idx, key, val)}
                  />
                </>
              )}
            </div>
          </div>
        );
      })}

      {/* ── Add step buttons ── */}
      <div className="step-add-row">
        <button type="button" className="btn btn-secondary" onClick={() => addStep('action')}>
          <Plus size={13} /> Action Step
        </button>
        <button type="button" className="btn btn-secondary step-add-btn--safety" onClick={() => addStep('safety_critical')}>
          <Plus size={13} /> ⚠ Safety Critical
        </button>
        <button type="button" className="btn btn-secondary step-add-btn--decision" onClick={() => addStep('decision')}>
          <Plus size={13} /> ◇ Decision
        </button>
        <button type="button" className="btn btn-secondary step-add-btn--reference" onClick={() => addStep('reference')}>
          <Plus size={13} /> 📎 Reference
        </button>
      </div>
    </div>
  );
}
