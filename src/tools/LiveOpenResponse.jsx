// ================================================================
// src/tools/LiveOpenResponse.jsx
// Mentimeter-style Live Open Response
// – Presenter view: setup → live feed → reveal
// – Student view: join via ?join=CODE, submit response live
// ================================================================

import { useState, useEffect, useRef } from 'react'
import { FB_URL, fbGet, fbPut, fbPost, fbPatch, fbListen } from '../firebase'

const IS_FB_CONFIGURED = !FB_URL.includes('YOUR_PROJECT_ID')

// ── Constants ────────────────────────────────────────────────────

const CARD_COLORS = [
  { bg: 'rgba(0,200,224,0.10)',   border: 'rgba(0,200,224,0.30)',   accent: 'var(--teal)' },
  { bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.30)', accent: '#a78bfa'     },
  { bg: 'rgba(255,200,71,0.10)',  border: 'rgba(255,200,71,0.28)',  accent: 'var(--gold)' },
  { bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.28)',  accent: '#34d399'     },
  { bg: 'rgba(251,146,60,0.10)',  border: 'rgba(251,146,60,0.28)',  accent: '#fb923c'     },
  { bg: 'rgba(244,114,182,0.10)', border: 'rgba(244,114,182,0.28)', accent: '#f472b6'     },
  { bg: 'rgba(96,165,250,0.10)',  border: 'rgba(96,165,250,0.28)',  accent: '#60a5fa'     },
]

const PRESETS = [
  {
    q: 'Menurut Anda, apa yang akan terjadi pada CPUE jika effort penangkapan terus meningkat melampaui MSY?',
    reveal: 'CPUE akan menurun secara non-linear. Akibat hiper-stabilitas, penurunan CPUE mungkin tertunda — stok bisa sudah jauh di bawah Bmsy sebelum nelayan merasakan dampaknya. Pada titik tertentu, terjadi recruitment failure dan collapse.',
    comparePrompt: 'Bandingkan prediksi Anda tadi dengan konsep Schaefer Production Model — apakah kurva yang ada dalam pikiran Anda sesuai?',
  },
  {
    q: 'Jika harga teripang di pasar dunia turun 70% dalam setahun, apa yang akan terjadi pada komunitas nelayan yang bergantung pada komoditas ini?',
    reveal: 'Dampaknya bersifat bertingkat: (1) nelayan beralih ke spesies alternatif; (2) pengepul mengurangi operasi; (3) defisit pendapatan rumah tangga; (4) beberapa kelompok mungkin beralih ke illegal fishing. Ini mencerminkan fragilitas livelihood berbasis komoditas tunggal.',
    comparePrompt: 'Apakah prediksi Anda mencakup efek cascade ke spesies lain dan aspek sosial-ekonomi rumah tangga nelayan?',
  },
  {
    q: 'Apa yang akan terjadi pada ekosistem pesisir jika seluruh mangrove dalam radius 5 km dari suatu estuari hilang?',
    reveal: 'Mangrove sebagai nursery ground menopang ~80% spesies ikan komersil di fase juvenil. Hilangnya mangrove menyebabkan penurunan rekrutmen ikan, peningkatan sedimentasi, berkurangnya perlindungan terhadap abrasi, dan hilangnya basis detritus food web.',
    comparePrompt: 'Bandingkan dengan konsep ecosystem services — berapa banyak komponen yang Anda cantumkan dalam prediksi awal?',
  },
]

// ── Helpers ──────────────────────────────────────────────────────

const genCode = () => {
  // 6-char uppercase code, exclude ambiguous chars (0/O, 1/I)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

const qrUrl = (text, size = 190) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&bgcolor=0f1e35&color=00c8e0&qzone=2&margin=0`

const fmtTime = (ts) =>
  new Date(ts).toLocaleTimeString('id', { hour: '2-digit', minute: '2-digit' })

// ================================================================
// STUDENT JOIN VIEW — rendered by App.jsx when ?join=CODE found
// ================================================================
export function StudentJoinView({ code }) {
  const [status, setStatus]   = useState('loading') // loading | input | submitting | done | error
  const [session, setSession] = useState(null)
  const [name, setName]       = useState('')
  const [text, setText]       = useState('')
  const [errMsg, setErrMsg]   = useState('')

  useEffect(() => {
    fbGet(`sessions/${code}`)
      .then((data) => {
        if (!data || !data.question || data.phase === 'closed') {
          setStatus('error')
        } else {
          setSession(data)
          setStatus('input')
        }
      })
      .catch(() => setStatus('error'))
  }, [code])

  const submit = async () => {
    if (!text.trim()) return
    setErrMsg('')
    setStatus('submitting')
    try {
      await fbPost(`sessions/${code}/responses`, {
        name: name.trim() || 'Anonim',
        text: text.trim(),
        time: Date.now(),
      })
      setStatus('done')
    } catch {
      setErrMsg('Gagal mengirim — periksa koneksi dan coba lagi.')
      setStatus('input')
    }
  }

  // ── Shared wrapper ──
  const Wrap = ({ children }) => (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '28px 18px', fontFamily: 'var(--font-b)',
    }}>
      {/* Branding */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 36, marginBottom: 6 }}>🐟</div>
        <div style={{ fontFamily: 'var(--font-h)', fontWeight: 800, fontSize: 20, color: 'var(--teal)' }}>
          AquaTeach
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
          Kode Sesi:&ensp;
          <span style={{ fontWeight: 700, color: 'var(--white)', fontFamily: 'monospace', fontSize: 15, letterSpacing: 2 }}>
            {code}
          </span>
        </div>
      </div>
      <div style={{ width: '100%', maxWidth: 460 }}>{children}</div>
    </div>
  )

  if (status === 'loading') return (
    <Wrap>
      <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 48 }}>
        <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 16px' }} />
        Memuat sesi...
      </div>
    </Wrap>
  )

  if (status === 'error') return (
    <Wrap>
      <div style={{
        textAlign: 'center', padding: '40px 24px',
        background: 'var(--card)', borderRadius: 'var(--r)',
        border: '1px solid rgba(240,101,101,0.3)',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
        <div style={{ fontFamily: 'var(--font-h)', fontWeight: 700, color: 'var(--danger)', marginBottom: 8 }}>
          Sesi tidak ditemukan
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
          Kode <b style={{ color: 'var(--white)' }}>{code}</b> tidak valid,<br />
          atau sesi sudah berakhir.
        </div>
      </div>
    </Wrap>
  )

  if (status === 'done') return (
    <Wrap>
      <div style={{
        textAlign: 'center', padding: '48px 24px',
        background: 'var(--card)', borderRadius: 'var(--r)',
        border: '1px solid rgba(79,201,126,0.3)',
      }}>
        <div style={{ fontSize: 56, marginBottom: 14 }}>✅</div>
        <div style={{ fontFamily: 'var(--font-h)', fontSize: 22, fontWeight: 800, color: 'var(--success)', marginBottom: 10 }}>
          Prediksi Terkirim!
        </div>
        <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 24 }}>
          Jawaban Anda sudah diterima oleh dosen.<br />
          Tunggu ungkapan penjelasan ilmiahnya di layar bersama.
        </div>
        {session?.question && (
          <div style={{
            padding: '14px 16px', background: 'var(--surface)',
            borderRadius: 'var(--r-sm)', fontSize: 13,
            color: 'var(--muted)', lineHeight: 1.6, textAlign: 'left',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
              Pertanyaan
            </div>
            {session.question}
          </div>
        )}
      </div>
    </Wrap>
  )

  // status === 'input' | 'submitting'
  return (
    <Wrap>
      {/* Question card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(167,139,250,0.13), rgba(167,139,250,0.03))',
        border: '1px solid rgba(167,139,250,0.32)',
        borderRadius: 'var(--r)', padding: '20px 22px', marginBottom: 16,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: '#a78bfa',
          textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 10,
        }}>
          🔮 Pertanyaan dari Dosen
        </div>
        <div style={{
          fontFamily: 'var(--font-h)', fontSize: 17, fontWeight: 700,
          lineHeight: 1.6, color: 'var(--white)',
        }}>
          {session.question}
        </div>
      </div>

      {/* Form */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--r)', padding: '20px 22px',
      }}>
        <div style={{ marginBottom: 14 }}>
          <label style={{
            display: 'block', fontSize: 10, fontWeight: 700,
            color: 'var(--muted)', textTransform: 'uppercase',
            letterSpacing: '1px', marginBottom: 7,
          }}>
            Nama (opsional)
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nama Anda..."
            disabled={status === 'submitting'}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{
            display: 'block', fontSize: 10, fontWeight: 700,
            color: 'var(--muted)', textTransform: 'uppercase',
            letterSpacing: '1px', marginBottom: 7,
          }}>
            Prediksi / Jawaban Anda ✏️
          </label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Tuliskan prediksi Anda di sini..."
            rows={5}
            disabled={status === 'submitting'}
            style={{ width: '100%' }}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) submit() }}
          />
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
            Ctrl+Enter untuk kirim
          </div>
        </div>

        {errMsg && (
          <div style={{
            fontSize: 13, color: 'var(--danger)', marginBottom: 14,
            padding: '10px 14px', background: 'rgba(240,101,101,0.08)',
            borderRadius: 'var(--r-sm)',
          }}>
            ⚠️ {errMsg}
          </div>
        )}

        <button
          onClick={submit}
          disabled={!text.trim() || status === 'submitting'}
          style={{
            width: '100%', padding: '15px',
            borderRadius: 'var(--r-sm)',
            background: (text.trim() && status !== 'submitting') ? 'var(--teal)' : 'var(--surface)',
            color: (text.trim() && status !== 'submitting') ? '#000d14' : 'var(--muted)',
            border: '1px solid transparent',
            fontFamily: 'var(--font-h)', fontWeight: 800, fontSize: 15,
            cursor: (text.trim() && status !== 'submitting') ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}
        >
          {status === 'submitting' ? '⏳ Mengirim...' : '🚀 Kirim Prediksi'}
        </button>
      </div>
    </Wrap>
  )
}

// ================================================================
// RESPONSE CARD — reused in live feed and reveal grid
// ================================================================
function ResponseCard({ response, index, big = false }) {
  const col = CARD_COLORS[index % CARD_COLORS.length]
  return (
    <div
      style={{
        background: col.bg,
        border: `1px solid ${col.border}`,
        borderLeft: `3px solid ${col.accent}`,
        borderRadius: 'var(--r-sm)',
        padding: big ? '16px 20px' : '12px 16px',
        animation: response.isNew ? 'slideInDown 0.45s cubic-bezier(0.22,1,0.36,1)' : 'none',
        transition: 'box-shadow 0.2s',
      }}
    >
      <div style={{
        fontSize: 11, fontWeight: 700, color: col.accent,
        marginBottom: 7, display: 'flex', alignItems: 'center', gap: 6,
      }}>
        🎓 {response.name}
        {response.time && (
          <span style={{ color: 'var(--muted)', fontWeight: 400, marginLeft: 4 }}>
            · {fmtTime(response.time)}
          </span>
        )}
      </div>
      <div style={{ fontSize: big ? 15 : 13, lineHeight: 1.7, color: 'var(--white)' }}>
        {response.text}
      </div>
    </div>
  )
}

// ================================================================
// PRESENT MODE OVERLAY
// ================================================================
function PresentOverlay({ phase, question, sessionCode, joinUrl, responses, reveal, comparePrompt, onClose }) {
  return (
    <div className="present-mode">
      <button className="btn btn-outline btn-sm present-close" onClick={onClose}>✕ Tutup</button>

      <div style={{ maxWidth: 1000, margin: '0 auto', width: '100%', padding: '28px 16px' }}>
        {/* Tool label + code */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          fontFamily: 'var(--font-h)', marginBottom: 22,
        }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--teal)' }}>🔮 Live Open Response</span>
          {sessionCode && (
            <span style={{
              padding: '4px 14px', background: 'rgba(0,200,224,0.12)',
              border: '1px solid rgba(0,200,224,0.3)', borderRadius: 20,
              fontSize: 13, fontWeight: 700, color: 'var(--teal)', letterSpacing: 2,
              fontFamily: 'monospace',
            }}>
              {sessionCode}
            </span>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--muted)' }}>
            {responses.length} respons
          </span>
        </div>

        {/* Question */}
        <div style={{
          fontFamily: 'var(--font-h)', fontSize: 22, fontWeight: 700, lineHeight: 1.5,
          background: 'var(--card)', borderRadius: 'var(--r)', padding: '22px 28px',
          border: '1px solid var(--border)', marginBottom: 28,
        }}>
          {question}
        </div>

        {/* LIVE phase */}
        {phase === 'live' && (
          <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr', gap: 28, alignItems: 'start' }}>
            {/* QR panel */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                padding: 10, background: 'var(--card)', borderRadius: 'var(--r)',
                border: '1px solid var(--border)', display: 'inline-block', marginBottom: 12,
              }}>
                <img src={qrUrl(joinUrl, 190)} alt="QR Code" width={190} height={190}
                  style={{ display: 'block', borderRadius: 4 }} />
              </div>
              <div style={{
                fontFamily: 'var(--font-h)', fontSize: 30, fontWeight: 800,
                letterSpacing: '6px', color: 'var(--teal)', marginBottom: 6,
              }}>
                {sessionCode}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Scan atau ketik kode</div>
              <div style={{
                marginTop: 16, padding: '10px 14px',
                background: 'var(--surface)', borderRadius: 'var(--r-sm)',
                border: '1px solid var(--border)', display: 'inline-flex',
                alignItems: 'center', gap: 8,
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--success)',
                  boxShadow: '0 0 8px var(--success)',
                  animation: 'pulse 1.5s ease infinite',
                }} />
                <span style={{ fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 18 }}>
                  {responses.length}
                </span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>respons</span>
              </div>
            </div>

            {/* Live feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 480, overflowY: 'auto' }}>
              {responses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)', fontSize: 14 }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>📡</div>
                  Menunggu respons pertama...
                </div>
              ) : (
                responses.map((r, i) => <ResponseCard key={r.id} response={r} index={i} big />)
              )}
            </div>
          </div>
        )}

        {/* REVEAL phase */}
        {phase === 'reveal' && (
          <div>
            <div style={{
              background: 'linear-gradient(135deg, rgba(0,200,224,0.12), rgba(0,200,224,0.02))',
              border: '1px solid rgba(0,200,224,0.3)',
              borderRadius: 'var(--r)', padding: '22px 28px', marginBottom: 24,
            }}>
              <div style={{ fontWeight: 700, color: 'var(--teal)', marginBottom: 12, fontSize: 16 }}>
                💡 Penjelasan Ilmiah
              </div>
              <div style={{ fontSize: 16, lineHeight: 1.85 }}>{reveal}</div>
              {comparePrompt && (
                <>
                  <div style={{ borderTop: '1px solid var(--border)', margin: '18px 0' }} />
                  <div style={{ fontWeight: 700, color: 'var(--gold)', marginBottom: 8, fontSize: 13 }}>
                    🔄 Refleksi & Perbandingan
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>{comparePrompt}</div>
                </>
              )}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 12,
            }}>
              {responses.map((r, i) => <ResponseCard key={r.id} response={r} index={i} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ================================================================
// MAIN PRESENTER COMPONENT (default export)
// ================================================================
function LiveOpenResponse() {
  const [phase, setPhase]           = useState('setup') // setup | live | reveal
  const [question, setQuestion]     = useState('')
  const [reveal, setReveal]         = useState('')
  const [comparePrompt, setCompare] = useState('')
  const [sessionCode, setCode]      = useState('')
  const [responses, setResponses]   = useState([])
  const [presentMode, setPresent]   = useState(false)
  const [copied, setCopied]         = useState(false)
  const [fbReady, setFbReady] = useState(IS_FB_CONFIGURED)
  const [starting, setStarting]     = useState(false)

  const listenerRef = useRef(null)
  const seenIds     = useRef(new Set())

  const joinUrl = sessionCode
    ? `${window.location.origin}${window.location.pathname}?join=${sessionCode}`
    : ''


  const stopListener = () => {
    if (listenerRef.current) { listenerRef.current(); listenerRef.current = null }
    seenIds.current.clear()
  }

  const startSession = async () => {
    if (!question.trim() || !reveal.trim()) return
    setStarting(true)
    const code = genCode()
    setCode(code)
    setResponses([])
    seenIds.current.clear()
    try {
      await fbPut(`sessions/${code}`, {
        question:      question.trim(),
        reveal:        reveal.trim(),
        comparePrompt: comparePrompt.trim(),
        phase:         'live',
        createdAt:     Date.now(),
      })

      // Start real-time SSE listener on responses subtree
      listenerRef.current = fbListen(`sessions/${code}/responses`, (path, data) => {
        if (path === '/') {
          // Initial full snapshot
          if (data) {
            const arr = Object.entries(data)
              .map(([id, v]) => ({ id, ...v, isNew: false }))
              .sort((a, b) => b.time - a.time)
            arr.forEach(r => seenIds.current.add(r.id))
            setResponses(arr)
          }
        } else if (data) {
          // Single new child pushed
          const id = path.replace('/', '')
          if (!seenIds.current.has(id)) {
            seenIds.current.add(id)
            const entry = { id, ...data, isNew: true }
            setResponses(prev => [entry, ...prev])
            // Remove animation flag after 700ms
            setTimeout(() => {
              setResponses(prev => prev.map(r => r.id === id ? { ...r, isNew: false } : r))
            }, 700)
          }
        }
      })

      setPhase('live')
    } catch (err) {
      console.error('Firebase error:', err)
      setFbReady(false)
    } finally {
      setStarting(false)
    }
  }

  const doReveal = async () => {
    stopListener()
    // Mark session as closed so no new submissions accepted
    if (sessionCode) {
      await fbPatch(`sessions/${sessionCode}`, { phase: 'closed' }).catch(() => {})
    }
    setPhase('reveal')
  }

  const resetSession = async () => {
    stopListener()
    if (sessionCode) {
      // Clean up session data
      await fbPatch(`sessions/${sessionCode}`, { phase: 'closed' }).catch(() => {})
    }
    setPhase('setup')
    setCode('')
    setResponses([])
    setPresent(false)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(joinUrl)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500) })
  }

  useEffect(() => () => stopListener(), [])

  // ── Render ──────────────────────────────────────────────────────
  return (
    <>
      {presentMode && (
        <PresentOverlay
          phase={phase}
          question={question}
          sessionCode={sessionCode}
          joinUrl={joinUrl}
          responses={responses}
          reveal={reveal}
          comparePrompt={comparePrompt}
          onClose={() => setPresent(false)}
        />
      )}

      {/* Header */}
      <div className="page-hdr">
        <div className="page-hdr-top">
          <div className="page-hdr-icon">🔮</div>
          <div>
            <h2>Live Open Response</h2>
            <p>Mahasiswa kirim prediksi dari HP masing-masing — muncul langsung di layar kelas</p>
          </div>
        </div>
      </div>

      {/* ── SETUP ── */}
      {phase === 'setup' && (
        <div className="anim-fade-up">
          {!fbReady && <FirebaseWarning />}

          <div className="card mb-16">
            <div className="form-label mb-12">Contoh Pertanyaan MSP</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PRESETS.map((p, i) => (
                <button key={i} className="btn btn-outline btn-sm"
                  onClick={() => { setQuestion(p.q); setReveal(p.reveal); setCompare(p.comparePrompt) }}>
                  Contoh {i + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="card mb-16">
            <div className="form-group">
              <label className="form-label">Pertanyaan Prediksi</label>
              <textarea value={question} onChange={e => setQuestion(e.target.value)}
                placeholder="Apa yang akan terjadi jika... / Menurut Anda, bagaimana..." rows={3} />
            </div>
            <div className="form-group">
              <label className="form-label">Penjelasan Ilmiah
                <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 11, marginLeft: 6 }}>
                  (diungkap setelah semua mahasiswa submit)
                </span>
              </label>
              <textarea value={reveal} onChange={e => setReveal(e.target.value)}
                placeholder="Penjelasan ilmiah yang dibandingkan dengan prediksi mahasiswa..." rows={4} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Prompt Refleksi
                <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 11, marginLeft: 6 }}>(opsional)</span>
              </label>
              <textarea value={comparePrompt} onChange={e => setCompare(e.target.value)}
                placeholder="Pertanyaan untuk memandu mahasiswa membandingkan prediksi dengan kenyataan..." rows={2} />
            </div>
          </div>

          <button className="btn btn-teal btn-lg btn-block" onClick={startSession}
            disabled={!question.trim() || !reveal.trim() || !fbReady || starting}>
            {starting ? '⏳ Membuat sesi...' : '🚀 Mulai Sesi Live'}
          </button>
        </div>
      )}

      {/* ── LIVE ── */}
      {phase === 'live' && (
        <div className="anim-fade-up">
          {/* Active question */}
          <div className="card mb-16" style={{
            background: 'linear-gradient(135deg, rgba(167,139,250,0.12), rgba(167,139,250,0.03))',
            borderColor: 'rgba(167,139,250,0.3)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)', animation: 'pulse 1.5s ease infinite' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                Sesi Aktif · {responses.length} respons masuk
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 18, fontWeight: 700, lineHeight: 1.55 }}>
              {question}
            </div>
          </div>

          {/* Two-column: join panel + live feed */}
          <div style={{ display: 'grid', gridTemplateColumns: '264px 1fr', gap: 16, marginBottom: 16 }}>
            {/* Join panel */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: 'var(--muted)',
                textTransform: 'uppercase', letterSpacing: '1px', alignSelf: 'flex-start',
              }}>
                Cara Bergabung
              </div>

              {/* QR */}
              <div style={{
                padding: 8, background: 'var(--surface)',
                borderRadius: 'var(--r-sm)', border: '1px solid var(--border)',
              }}>
                <img src={qrUrl(joinUrl)} alt="QR Code bergabung"
                  width={190} height={190} style={{ display: 'block', borderRadius: 4 }} />
              </div>

              {/* Session code */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Kode Sesi
                </div>
                <div style={{
                  fontFamily: 'var(--font-h)', fontSize: 30, fontWeight: 800,
                  letterSpacing: '6px', color: 'var(--teal)',
                }}>
                  {sessionCode}
                </div>
              </div>

              {/* Copy link */}
              <button onClick={copyLink} className="btn btn-outline btn-sm btn-block" style={{ fontSize: 11 }}>
                {copied ? '✅ Link disalin!' : '🔗 Salin Link Join'}
              </button>

              {/* Live counter */}
              <div style={{
                width: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8, padding: '10px 12px',
                background: 'rgba(79,201,126,0.08)',
                borderRadius: 'var(--r-sm)', border: '1px solid rgba(79,201,126,0.25)',
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--success)', boxShadow: '0 0 6px var(--success)',
                  animation: 'pulse 1.5s ease infinite',
                }} />
                <span style={{ fontFamily: 'var(--font-h)', fontWeight: 800, color: 'var(--white)', fontSize: 20 }}>
                  {responses.length}
                </span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>respons masuk</span>
              </div>
            </div>

            {/* Live feed */}
            <div>
              <div style={{
                fontSize: 10, fontWeight: 700, color: 'var(--muted)',
                textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12,
              }}>
                Live Feed
              </div>

              <div style={{
                display: 'flex', flexDirection: 'column', gap: 8,
                maxHeight: 400, overflowY: 'auto', paddingRight: 2,
              }}>
                {responses.length === 0 ? (
                  <div style={{
                    textAlign: 'center', padding: '52px 20px',
                    background: 'var(--surface)', borderRadius: 'var(--r)',
                    border: '1px dashed var(--border)', color: 'var(--muted)',
                  }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>📡</div>
                    <div style={{ fontSize: 13, marginBottom: 6 }}>Menunggu respons mahasiswa...</div>
                    <div style={{ fontSize: 11 }}>Minta mereka scan QR atau ketik link di browser HP</div>
                  </div>
                ) : (
                  responses.map((r, i) => <ResponseCard key={r.id} response={r} index={i} />)
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-gold btn-lg" onClick={doReveal} disabled={responses.length === 0}>
              💡 Ungkap Penjelasan Ilmiah
            </button>
            <button className="btn btn-teal" onClick={() => setPresent(true)}>
              ⛶ Mode Presentasi
            </button>
            <button className="btn btn-ghost" onClick={resetSession}>
              ✕ Akhiri Sesi
            </button>
          </div>
        </div>
      )}

      {/* ── REVEAL ── */}
      {phase === 'reveal' && (
        <div className="anim-fade-up">
          <div className="card mb-16" style={{
            background: 'linear-gradient(135deg, rgba(0,200,224,0.1), rgba(0,200,224,0.02))',
            borderColor: 'rgba(0,200,224,0.3)',
          }}>
            <div style={{ fontWeight: 700, color: 'var(--teal)', marginBottom: 12, fontSize: 15 }}>
              💡 Penjelasan Ilmiah
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.85, marginBottom: comparePrompt ? 20 : 0 }}>
              {reveal}
            </div>
            {comparePrompt && (
              <>
                <div className="divider" />
                <div style={{ fontWeight: 700, color: 'var(--gold)', marginBottom: 8, fontSize: 13 }}>
                  🔄 Refleksi & Perbandingan
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>{comparePrompt}</div>
              </>
            )}
          </div>

          <div style={{
            fontSize: 10, fontWeight: 700, color: 'var(--muted)',
            textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12,
          }}>
            Semua Respons Mahasiswa ({responses.length})
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: 10, marginBottom: 20,
          }}>
            {responses.map((r, i) => <ResponseCard key={r.id} response={r} index={i} />)}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-teal" onClick={() => setPresent(true)}>⛶ Mode Presentasi</button>
            <button className="btn btn-ghost" onClick={resetSession}>🔄 Sesi Baru</button>
          </div>
        </div>
      )}
    </>
  )
}

// ── Firebase config warning ──────────────────────────────────────
function FirebaseWarning() {
  return (
    <div style={{
      background: 'rgba(240,101,101,0.08)', border: '1px solid rgba(240,101,101,0.3)',
      borderRadius: 'var(--r)', padding: '14px 18px', marginBottom: 16, fontSize: 13,
    }}>
      <div style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: 8 }}>
        ⚠️ Firebase belum dikonfigurasi
      </div>
      <div style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
        Buka <code style={{ color: 'var(--white)' }}>src/firebase.js</code> dan ganti{' '}
        <code style={{ color: 'var(--white)' }}>FB_URL</code> dengan Database URL project Firebase Anda.
        Lalu set Database Rules agar <code style={{ color: 'var(--white)' }}>/sessions</code> bisa read &amp; write.
      </div>
    </div>
  )
}

export default LiveOpenResponse
