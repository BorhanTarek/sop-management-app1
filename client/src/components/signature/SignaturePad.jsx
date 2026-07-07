import { useRef, useState } from 'react';
import ReactSignatureCanvas from 'react-signature-canvas';
import { RotateCcw, Check } from 'lucide-react';

/**
 * Reusable digital signature canvas component.
 *
 * Props:
 *  - onSave(base64String) — called with trimmed PNG data URL when user clicks Save
 *  - saving — boolean, shows loading state on the Save button
 *  - label — optional header label string
 */
export default function SignaturePad({ onSave, saving = false, label = 'Draw your signature below' }) {
  const sigRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleClear = () => {
    sigRef.current?.clear();
    setIsEmpty(true);
  };

  const handleEnd = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      setIsEmpty(false);
    }
  };

  const handleSave = () => {
    try {
      if (!sigRef.current || sigRef.current.isEmpty()) return;
      let base64 = '';
      if (typeof sigRef.current.getTrimmedCanvas === 'function') {
        base64 = sigRef.current.getTrimmedCanvas().toDataURL('image/png');
      } else if (typeof sigRef.current.getCanvas === 'function') {
        base64 = sigRef.current.getCanvas().toDataURL('image/png');
      } else {
        base64 = sigRef.current.toDataURL('image/png');
      }
      onSave(base64);
    } catch (err) {
      console.error('Error getting signature image:', err);
      try {
        // Direct fallback on the signature pad instance
        if (sigRef.current && typeof sigRef.current.toDataURL === 'function') {
          const base64 = sigRef.current.toDataURL('image/png');
          onSave(base64);
        } else {
          alert('Could not capture signature image from canvas.');
        }
      } catch (e) {
        alert('Error saving signature: ' + err.message);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {label && (
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
          {label}
        </p>
      )}

      {/* Canvas Area */}
      <div style={{
        border: '2px dashed var(--border)',
        borderRadius: 'var(--radius-md)',
        background: '#ffffff',
        overflow: 'hidden',
        position: 'relative',
        transition: 'border-color 0.2s',
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand-primary)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = isEmpty ? 'var(--border)' : 'var(--brand-primary)'}
      >
        <ReactSignatureCanvas
          ref={sigRef}
          penColor="#082823"
          canvasProps={{
            width: 460,
            height: 180,
            style: { display: 'block', width: '100%', height: 180, touchAction: 'none' },
          }}
          onEnd={handleEnd}
        />

        {/* Watermark hint when empty */}
        {isEmpty && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
            color: 'var(--text-muted)',
            fontSize: '0.78rem',
            fontStyle: 'italic',
          }}>
            ✍️ Sign here
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={handleClear}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
            background: 'var(--bg-hover)', color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
            transition: 'all 0.2s',
          }}
        >
          <RotateCcw size={14} /> Clear
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isEmpty || saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 18px', borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem', fontWeight: 700, cursor: isEmpty ? 'not-allowed' : 'pointer',
            background: isEmpty ? 'var(--border)' : 'linear-gradient(135deg, var(--brand-primary), var(--brand-dark))',
            color: isEmpty ? 'var(--text-muted)' : '#fff',
            border: 'none',
            transition: 'all 0.2s',
            opacity: saving ? 0.7 : 1,
          }}
        >
          <Check size={14} />
          {saving ? 'Saving...' : 'Save Signature'}
        </button>
      </div>
    </div>
  );
}
