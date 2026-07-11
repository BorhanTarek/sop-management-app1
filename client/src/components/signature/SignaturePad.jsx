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
      if (typeof sigRef.current.getCanvas === 'function') {
        const canvas = sigRef.current.getCanvas();
        try {
          // Custom canvas trimming to avoid ESM/CJS build issues with external trim-canvas library
          const trimmedCanvas = trimCanvas(canvas);
          base64 = trimmedCanvas.toDataURL('image/png');
        } catch (trimErr) {
          console.warn('Trim canvas fallback active:', trimErr);
          base64 = canvas.toDataURL('image/png');
        }
      } else if (typeof sigRef.current.toDataURL === 'function') {
        base64 = sigRef.current.toDataURL('image/png');
      }
      
      if (!base64) {
        throw new Error('Failed to generate image data URL.');
      }
      
      onSave(base64);
    } catch (err) {
      console.error('Error getting signature image:', err);
      alert('Error saving signature: ' + err.message);
    }
  };

  // Helper to trim empty/transparent space around canvas drawings
  function trimCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
    
    const width = canvas.width;
    const height = canvas.height;
    const pixels = ctx.getImageData(0, 0, width, height);
    const len = pixels.data.length;
    
    let bound = {
      top: null,
      left: null,
      right: null,
      bottom: null
    };
    
    let x, y;
    for (let i = 0; i < len; i += 4) {
      if (pixels.data[i + 3] !== 0) { // check alpha channel (non-transparent)
        x = (i / 4) % width;
        y = Math.floor((i / 4) / width);
        
        if (bound.top === null) bound.top = y;
        
        if (bound.left === null) {
          bound.left = x;
        } else if (x < bound.left) {
          bound.left = x;
        }
        
        if (bound.right === null) {
          bound.right = x;
        } else if (x > bound.right) {
          bound.right = x;
        }
        
        if (bound.bottom === null) {
          bound.bottom = y;
        } else if (y > bound.bottom) {
          bound.bottom = y;
        }
      }
    }
    
    if (bound.top === null || bound.left === null || bound.right === null || bound.bottom === null) {
      return canvas; // blank canvas, return original
    }
    
    const trimmedWidth = bound.right - bound.left + 1;
    const trimmedHeight = bound.bottom - bound.top + 1;
    
    // Add small padding around the signature
    const pad = 6;
    const copy = document.createElement('canvas');
    copy.width = trimmedWidth + (pad * 2);
    copy.height = trimmedHeight + (pad * 2);
    const copyCtx = copy.getContext('2d');
    
    if (copyCtx) {
      copyCtx.drawImage(
        canvas,
        bound.left, bound.top, trimmedWidth, trimmedHeight,
        pad, pad, trimmedWidth, trimmedHeight
      );
      return copy;
    }
    
    return canvas;
  }

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
