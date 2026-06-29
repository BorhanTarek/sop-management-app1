import { Plus, Trash2, ArrowUp, ArrowDown, CheckCircle, XCircle } from 'lucide-react';

// ─── Step type metadata ────────────────────────────────────────────────
const STEP_TYPES = ['action', 'decision', 'reference'];
const STEP_META = {
  action:    { label: 'Action',    icon: '▬', color: '#1a9e96', borderColor: 'var(--brand-primary)' },
  decision:  { label: 'Decision',  icon: '◇', color: '#f59e0b', borderColor: '#f59e0b' },
  reference: { label: 'Reference', icon: '📎', color: '#818cf8', borderColor: '#818cf8' },
};

// ─── WI Code badge input ───────────────────────────────────────────────
// Renders the Work Instruction input with a teal badge prefix (like the flowchart image).
// Used inside branch sub-steps for decision steps.
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
// Each branch sub-step has its OWN WI code — the WI code moves here for decision steps.
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
        {/* WI Code lives here, at the branch sub-step level */}
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
  // ── helpers ──
  const newStep = (type = 'action') => ({
    id: Date.now() + Math.random(),
    title: '',
    body: '',
    stepType: type,
    // Decision steps never carry a top-level refCode — WI codes live on their branch sub-steps
    refCode: '',
    sortOrder: steps.length,
    yesBranch: [],
    noBranch: [],
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
            // Decision steps: clear the top-level WI refCode — it moves to each branch sub-step
            refCode: newType === 'decision' ? '' : st.refCode,
          }
        : st
    ));

  // Branch helpers
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

  // ── render ──
  return (
    <div className="step-builder">
      {steps.map((step, idx) => {
        const meta      = STEP_META[step.stepType] || STEP_META.action;
        const isDecision = step.stepType === 'decision';

        return (
          <div key={step.id ?? idx} className={`step-card step-card--${step.stepType}`}>
            {/* Card header: number + type toggle + move/delete actions */}
            <div className="step-card-header">
              <span className="step-card-num" style={{ background: meta.color }}>
                {isDecision ? '◇' : idx + 1}
              </span>

              {/* Type toggle pills */}
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

              {/* Move / delete */}
              <div className="step-card-actions">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => moveStep(idx, -1)} title="Move up"><ArrowUp size={12} /></button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => moveStep(idx, 1)} title="Move down"><ArrowDown size={12} /></button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => removeStep(idx)} title="Remove step"><Trash2 size={12} /></button>
              </div>
            </div>

            {/* Card body: main inputs */}
            <div className="step-card-body">
              {isDecision ? (
                /*
                 * DECISION STEP
                 * ─────────────────────────────────────────────────────────────
                 * The top-level card only holds the QUESTION text.
                 * There is NO WI refCode here — WI codes belong exclusively
                 * to each individual sub-step inside the Yes / No branch panels.
                 *
                 * Data shape:
                 *   { stepType: 'decision', title: '...', refCode: null,
                 *     branchData: JSON.stringify({
                 *       yesBranch: [{ title, body, refCode: 'WI-RTM-XXX' }],
                 *       noBranch:  [{ title, body, refCode: 'WI-RTM-D14' }]
                 *     })
                 *   }
                 */
                <>
                  {/* Decision question — no WI field */}
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
                        ℹ️ Work Instruction codes are assigned per branch sub-step below — not on the decision question itself
                      </div>
                    </div>
                  </div>

                  {/* Yes / No branch panels — each sub-step has its own WI code */}
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
              ) : (
                /*
                 * ACTION / REFERENCE STEP
                 * ─────────────────────────────────────────────────────────────
                 * WI refCode is attached directly to this step card.
                 *
                 * Data shape:
                 *   { stepType: 'action', title: '...', refCode: 'WI-RTM-H11', body: '...' }
                 */
                <>
                  <div className="action-step-main-row">
                    <input
                      className="form-control"
                      placeholder={step.stepType === 'reference' ? 'Reference document title *' : 'Step title *'}
                      value={step.title}
                      onChange={e => updateStep(idx, 'title', e.target.value)}
                    />
                    {/* WI Code directly on the step card for action/reference steps */}
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
                </>
              )}
            </div>
          </div>
        );
      })}

      {/* Add step buttons */}
      <div className="step-add-row">
        <button type="button" className="btn btn-secondary" onClick={() => addStep('action')}>
          <Plus size={13} /> Action Step
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
