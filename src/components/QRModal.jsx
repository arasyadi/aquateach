// src/components/QRModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Reusable click-to-enlarge QR modal. Drop this into src/components/.
//
// Usage:
//   import QRModal from '../components/QRModal'
//   const [qrOpen, setQrOpen] = useState(false)
//
//   <QRClickable value={joinUrl(liveCode)} onClick={() => setQrOpen(true)} size={200} />
//   <QRModal
//     open={qrOpen}
//     onClose={() => setQrOpen(false)}
//     value={joinUrl(liveCode)}
//     code={liveCode}
//     question="Pernyataan / pertanyaan polling di sini"
//   />
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'

/* ── Clickable QR wrapper ─────────────────────────────────────────────────── */
export function QRClickable({ value, onClick, size = 200, children }) {
  return (
    <div
      onClick={onClick}
      title="Klik untuk perbesar"
      style={{
        cursor: 'zoom-in',
        position: 'relative',
        display: 'inline-block',
      }}
    >
      <div style={{
        background: '#fff',
        padding: '11px',
        borderRadius: '14px',
        border: '3px solid rgba(0,200,224,0.28)',
        display: 'inline-block',
        boxShadow: '0 0 28px rgba(0,200,224,0.22)',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
      }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.04)'
          e.currentTarget.style.boxShadow = '0 0 40px rgba(0,200,224,0.45)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 0 28px rgba(0,200,224,0.22)'
        }}
      >
        <QRCodeSVG value={value} size={size} level="H" />
      </div>
      {/* Zoom hint badge */}
      <div style={{
        position: 'absolute',
        bottom: -6,
        right: -6,
        background: 'var(--teal)',
        color: '#060d1a',
        fontSize: 10,
        fontWeight: 800,
        borderRadius: 99,
        padding: '2px 7px',
        boxShadow: '0 2px 8px rgba(0,200,224,0.4)',
        letterSpacing: '0.5px',
        pointerEvents: 'none',
      }}>
        🔍 PERBESAR
      </div>
      {children}
    </div>
  )
}

/* ── Modal ────────────────────────────────────────────────────────────────── */
export default function QRModal({ open, onClose, value, code, question, totalVotes }) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(4, 10, 22, 0.82)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          zIndex: 2000,
          animation: 'qrBackdropIn 0.22s ease',
        }}
      />

      {/* ── Modal card ── */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2001,
          width: 'min(520px, 92vw)',
          background: 'linear-gradient(160deg, #0a1525 0%, #061120 100%)',
          border: '1.5px solid rgba(0,200,224,0.35)',
          borderRadius: 24,
          boxShadow: '0 0 80px rgba(0,200,224,0.18), 0 32px 64px rgba(0,0,0,0.7)',
          padding: '32px 28px 28px',
          textAlign: 'center',
          animation: 'qrModalIn 0.28s cubic-bezier(0.34, 1.4, 0.64, 1)',
          fontFamily: 'var(--font-b)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 16,
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'var(--muted)',
            borderRadius: 8,
            padding: '4px 10px',
            cursor: 'pointer',
            fontSize: 13,
            fontFamily: 'var(--font-b)',
          }}
        >
          ✕ Tutup
        </button>

        {/* Scan label */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(0,200,224,0.1)',
          border: '1px solid rgba(0,200,224,0.25)',
          borderRadius: 99,
          padding: '5px 14px',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--teal)',
          letterSpacing: '1px',
          marginBottom: 18,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--teal)',
            boxShadow: '0 0 6px var(--teal)',
            animation: 'pulse 1.4s ease infinite',
            flexShrink: 0,
          }} />
          SCAN UNTUK BERGABUNG
        </div>

        {/* Question block */}
        {question && (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 14,
            padding: '14px 18px',
            marginBottom: 24,
            fontFamily: 'var(--font-h)',
            fontSize: 'clamp(13px, 2.5vw, 16px)',
            fontWeight: 700,
            color: 'var(--white)',
            lineHeight: 1.55,
            textAlign: 'left',
          }}>
            <span style={{ color: 'rgba(0,200,224,0.6)', marginRight: 6 }}>"</span>
            {question}
            <span style={{ color: 'rgba(0,200,224,0.6)', marginLeft: 4 }}>"</span>
          </div>
        )}

        {/* Big QR */}
        <div style={{
          display: 'inline-block',
          background: '#fff',
          padding: '16px',
          borderRadius: '18px',
          boxShadow: '0 0 60px rgba(0,200,224,0.35), 0 0 120px rgba(0,200,224,0.1)',
          marginBottom: 22,
        }}>
          <QRCodeSVG value={value} size={240} level="H" />
        </div>

        {/* Room code */}
        <div style={{
          fontFamily: 'var(--font-h)',
          fontWeight: 900,
          fontSize: 38,
          letterSpacing: 10,
          color: 'var(--white)',
          lineHeight: 1,
          marginBottom: 6,
          textShadow: '0 0 28px rgba(0,200,224,0.4)',
        }}>
          {code}
        </div>

        {/* URL */}
        <div style={{
          fontSize: 11,
          color: 'rgba(255,255,255,0.3)',
          wordBreak: 'break-all',
          marginBottom: totalVotes != null ? 16 : 0,
          lineHeight: 1.5,
        }}>
          {value}
        </div>

        {/* Live vote count — optional */}
        {totalVotes != null && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(0,200,224,0.08)',
            border: '1px solid rgba(0,200,224,0.2)',
            borderRadius: 99,
            padding: '7px 18px',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--teal)',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--teal)',
              animation: 'pulse 1.4s ease infinite',
            }} />
            {totalVotes} suara masuk
          </div>
        )}
      </div>

      {/* ── Keyframes injected once ── */}
      <style>{`
        @keyframes qrBackdropIn {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
        @keyframes qrModalIn {
          from { opacity: 0; transform: translate(-50%, -48%) scale(0.88) }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1)    }
        }
      `}</style>
    </>
  )
}
