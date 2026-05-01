import { useState, useEffect, useRef, useCallback } from 'react'

/* ─── PRESETS ─────────────────────────────────────────────────── */
const PRESETS = [
  {
    q: 'Menurut Anda, apa yang akan terjadi pada CPUE jika effort penangkapan terus meningkat melampaui MSY?',
    reveal: 'CPUE akan menurun secara non-linear. Akibat hiper-stabilitas, penurunan CPUE mungkin tertunda — stok bisa sudah jauh di bawah Bmsy sebelum nelayan merasakan dampaknya. Pada titik tertentu, terjadi recruitment failure dan collapse.',
    comparePrompt: 'Bandingkan prediksi Anda tadi dengan konsep Schaefer Production Model — apakah kurva yang ada dalam pikiran Anda sesuai?'
  },
  {
    q: 'Jika harga teripang di pasar dunia turun 70% dalam setahun, apa yang akan terjadi pada komunitas nelayan yang selama ini bergantung pada komoditas ini?',
    reveal: 'Dampaknya bersifat bertingkat: (1) nelayan beralih ke spesies alternatif, meningkatkan tekanan pada stok lain; (2) pengepul mengurangi operasi; (3) terjadi defisit pendapatan rumah tangga; (4) beberapa kelompok mungkin beralih ke illegal fishing. Ini mencerminkan fragilitas livelihood berbasis komoditas tunggal.',
    comparePrompt: 'Apakah prediksi Anda mencakup efek cascade ke spesies lain dan aspek sosial-ekonomi rumah tangga nelayan?'
  },
  {
    q: 'Apa yang akan terjadi pada ekosistem pesisir jika seluruh mangrove dalam radius 5 km dari suatu estuari hilang?',
    reveal: 'Mangrove sebagai nursery ground menopang 80% spesies ikan komersil di fase juvenil. Hilangnya mangrove menyebabkan: penurunan rekrutmen ikan, peningkatan sedimentasi, berkurangnya perlindungan garis pantai, dan penurunan produksi detritus sebagai basis food web.',
    comparePrompt: 'Bandingkan dengan konsep ecosystem services — berapa banyak komponen yang Anda cantumkan dalam prediksi awal?'
  }
]

/* ─── STORAGE HELPERS ─────────────────────────────────────────── */
const STORAGE_KEY = (code) => `pq_session_${code}`
const RESP_KEY = (code) => `pq_responses_${code}`

async function saveSession(code, data) {
  try { await window.storage.set(STORAGE_KEY(code), JSON.stringify(data), true) } catch {}
}
async function loadSession(code) {
  try {
    const r = await window.storage.get(STORAGE_KEY(code), true)
    return r ? JSON.parse(r.value) : null
  } catch { return null }
}
async function saveResponses(code, list) {
  try { await window.storage.set(RESP_KEY(code), JSON.stringify(list), true) } catch {}
}
async function loadResponses(code) {
  try {
    const r = await window.storage.get(RESP_KEY(code), true)
    return r ? JSON.parse(r.value) : []
  } catch { return [] }
}
async function addResponse(code, entry) {
  const list = await loadResponses(code)
  list.push(entry)
  await saveResponses(code, list)
  return list
}
function genCode() {
  const words = ['IKAN', 'LAUT', 'BIRU', 'KARANG', 'OMBAK', 'BAKAU']
  return words[Math.floor(Math.random() * words.length)] + '-' + Math.floor(1000 + Math.random() * 9000)
}

/* ─── COLOURS (compatible with AquaLearn CSS vars, with fallbacks) */
const C = {
  navy:   'var(--navy, #0a1628)',
  card:   'var(--card, #0f2044)',
  surf:   'var(--surface, #0d1b35)',
  teal:   'var(--teal, #00c8e0)',
  gold:   'var(--gold, #f59e0b)',
  coral:  'var(--coral, #f87171)',
  white:  'var(--white, #e8f4f8)',
  muted:  'var(--muted, #6b8fa8)',
  border: 'var(--border, rgba(0,200,224,0.12))',
  r:      'var(--r, 14px)',
  rsm:    'var(--r-sm, 8px)',
  fnh:    'var(--font-h, "Exo 2", sans-serif)',
}

/* ─── AVATAR COLOURS for response cards ──────────────────────── */
const CARD_PALETTES = [
  { bg: 'rgba(0,200,224,0.12)',  accent: '#00c8e0' },
  { bg: 'rgba(245,158,11,0.12)', accent: '#f59e0b' },
  { bg: 'rgba(167,139,250,0.12)',accent: '#a78bfa' },
  { bg: 'rgba(52,211,153,0.12)', accent: '#34d399' },
  { bg: 'rgba(248,113,113,0.12)',accent: '#f87171' },
  { bg: 'rgba(96,165,250,0.12)', accent: '#60a5fa' },
]

/* ════════════════════════════════════════════════════════════════
   STUDENT VIEW
═══════════════════════════════════════════════════════════════ */
function StudentView({ onBack }) {
  const [codeInput, setCodeInput] = useState('')
  const [session, setSession] = useState(null)
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [step, setStep] = useState('join') // join | predict | done
  const [joining, setJoining] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState('')

  const join = async () => {
    setErr(''); setJoining(true)
    const code = codeInput.trim().toUpperCase()
    const s = await loadSession(code)
    setJoining(false)
    if (!s || !s.active) { setErr('Kode tidak ditemukan atau sesi belum aktif.'); return }
    setSession({ ...s, code })
    setStep('predict')
  }

  const submit = async () => {
    if (!text.trim()) return
    setSubmitting(true)
    await addResponse(session.code, {
      name: name.trim() || 'Anonim',
      text: text.trim(),
      time: new Date().toLocaleTimeString('id'),
      id: Date.now()
    })
    setSubmitting(false)
    setStep('done')
  }

  const s = { fontFamily: C.fnh }

  return (
    <div style={{ minHeight: '100vh', background: C.navy, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, ...s }}>
      {/* Back */}
      <button onClick={onBack} style={{ position: 'absolute', top: 16, left: 16, background: 'none', border: `1px solid ${C.border}`, color: C.muted, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12 }}>
        ← Kembali
      </button>

      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔮</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.teal, letterSpacing: '-0.5px' }}>AquaLearn Live</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Prediksi & Eksplorasi Ilmiah</div>
        </div>

        {/* JOIN */}
        {step === 'join' && (
          <div style={{ background: C.card, borderRadius: 16, padding: 28, border: `1px solid ${C.border}` }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: C.white, marginBottom: 20 }}>Masukkan Kode Sesi</div>
            <input
              value={codeInput} onChange={e => setCodeInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && join()}
              placeholder="Contoh: LAUT-4721"
              style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.surf, color: C.white, fontSize: 22, fontWeight: 800, letterSpacing: 4, textAlign: 'center', outline: 'none', fontFamily: 'monospace', marginBottom: 12 }}
            />
            {err && <div style={{ color: C.coral, fontSize: 12, marginBottom: 12, textAlign: 'center' }}>{err}</div>}
            <button onClick={join} disabled={!codeInput.trim() || joining}
              style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: joining ? C.muted : C.teal, color: C.navy, fontWeight: 800, fontSize: 15, cursor: joining ? 'default' : 'pointer', transition: 'all 0.2s', fontFamily: C.fnh }}>
              {joining ? 'Mencari sesi...' : 'Gabung Sesi →'}
            </button>
          </div>
        )}

        {/* PREDICT */}
        {step === 'predict' && session && (
          <div style={{ background: C.card, borderRadius: 16, padding: 28, border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.teal, textTransform: 'uppercase', letterSpacing: 2 }}>Pertanyaan Prediksi</div>
              <div style={{ fontSize: 11, color: C.muted, background: C.surf, padding: '3px 10px', borderRadius: 20 }}>{session.code}</div>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.6, color: C.white, marginBottom: 24, padding: '16px', background: 'rgba(0,200,224,0.06)', borderRadius: 10, borderLeft: `3px solid ${C.teal}` }}>
              {session.question}
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, fontWeight: 600 }}>Nama (opsional)</div>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Nama Anda..."
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surf, color: C.white, fontSize: 13, outline: 'none', fontFamily: C.fnh }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, fontWeight: 600 }}>Prediksi Anda <span style={{ color: C.coral }}>*</span></div>
              <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Tuliskan prediksi Anda dengan jelas..." rows={5}
                style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 8, border: `1.5px solid ${text ? C.teal : C.border}`, background: C.surf, color: C.white, fontSize: 14, lineHeight: 1.6, outline: 'none', resize: 'vertical', fontFamily: C.fnh, transition: 'border-color 0.2s' }} />
            </div>
            <button onClick={submit} disabled={!text.trim() || submitting}
              style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: text.trim() ? C.teal : C.muted, color: C.navy, fontWeight: 800, fontSize: 15, cursor: text.trim() ? 'pointer' : 'default', fontFamily: C.fnh, transition: 'all 0.2s' }}>
              {submitting ? 'Mengirim...' : '🚀 Kirim Prediksi'}
            </button>
          </div>
        )}

        {/* DONE */}
        {step === 'done' && (
          <div style={{ background: C.card, borderRadius: 16, padding: 40, border: `1px solid ${C.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
            <div style={{ fontWeight: 800, fontSize: 20, color: C.teal, marginBottom: 8 }}>Prediksi Terkirim!</div>
            <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
              Prediksi Anda sudah masuk ke sesi dosen.<br />Tunggu penjelasan ilmiah dari dosen.
            </div>
            <button onClick={() => { setText(''); setName(''); setStep('predict') }}
              style={{ marginTop: 24, padding: '10px 24px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'none', color: C.muted, fontSize: 13, cursor: 'pointer', fontFamily: C.fnh }}>
              Kirim lagi
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   RESPONSE CARD (animated)
═══════════════════════════════════════════════════════════════ */
function ResponseCard({ entry, index, isNew }) {
  const pal = CARD_PALETTES[index % CARD_PALETTES.length]
  const [show, setShow] = useState(false)
  useEffect(() => { const t = setTimeout(() => setShow(true), 30); return () => clearTimeout(t) }, [])

  return (
    <div style={{
      background: pal.bg,
      border: `1px solid ${pal.accent}33`,
      borderLeft: `3px solid ${pal.accent}`,
      borderRadius: 10,
      padding: '12px 16px',
      opacity: show ? 1 : 0,
      transform: show ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.97)',
      transition: 'opacity 0.4s ease, transform 0.4s ease',
      position: 'relative',
    }}>
      {isNew && (
        <div style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%', background: pal.accent, animation: 'pulse 1.5s ease infinite' }} />
      )}
      <div style={{ fontSize: 11, fontWeight: 700, color: pal.accent, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>🎓</span> {entry.name}
        <span style={{ marginLeft: 'auto', color: C.muted, fontWeight: 400 }}>{entry.time}</span>
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.7, color: C.white, fontFamily: C.fnh }}>{entry.text}</div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   MAIN TEACHER COMPONENT
═══════════════════════════════════════════════════════════════ */
function PredictionQuestion() {
  const [mode, setMode] = useState('teacher') // teacher | student
  const [phase, setPhase] = useState('setup') // setup | live | reveal
  const [question, setQuestion] = useState('')
  const [reveal, setReveal] = useState('')
  const [comparePrompt, setComparePrompt] = useState('')
  const [sessionCode, setSessionCode] = useState('')
  const [responses, setResponses] = useState([])
  const [prevCount, setPrevCount] = useState(0)
  const [presented, setPresented] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const pollRef = useRef(null)
  const wallRef = useRef(null)

  // ── POLLING ──────────────────────────────────────────────────
  const poll = useCallback(async (code) => {
    const list = await loadResponses(code)
    setResponses(prev => {
      if (list.length > prev.length) {
        setPrevCount(prev.length)
        if (wallRef.current) setTimeout(() => wallRef.current?.scrollTo({ top: wallRef.current.scrollHeight, behavior: 'smooth' }), 100)
      }
      return list
    })
  }, [])

  useEffect(() => {
    if (phase === 'live' && sessionCode) {
      poll(sessionCode)
      pollRef.current = setInterval(() => poll(sessionCode), 2000)
      return () => clearInterval(pollRef.current)
    }
    return () => clearInterval(pollRef.current)
  }, [phase, sessionCode, poll])

  // ── ACTIONS ──────────────────────────────────────────────────
  const startSession = async () => {
    if (!question.trim() || !reveal.trim()) return
    const code = genCode()
    setSessionCode(code)
    setResponses([])
    setPrevCount(0)
    setPresented(false)
    await saveSession(code, { question: question.trim(), active: true, created: Date.now() })
    await saveResponses(code, [])
    setPhase('live')
  }

  const endSession = async () => {
    if (sessionCode) await saveSession(sessionCode, { question, active: false })
    clearInterval(pollRef.current)
    setPhase('setup')
    setSessionCode('')
    setResponses([])
  }

  const loadPreset = (i) => {
    setQuestion(PRESETS[i].q); setReveal(PRESETS[i].reveal); setComparePrompt(PRESETS[i].comparePrompt)
  }

  // ── STUDENT MODE ─────────────────────────────────────────────
  if (mode === 'student') return <StudentView onBack={() => setMode('teacher')} />

  // ── FULLSCREEN PRESENT ────────────────────────────────────────
  if (fullscreen) return (
    <div style={{ position: 'fixed', inset: 0, background: C.navy, zIndex: 1000, display: 'flex', flexDirection: 'column', fontFamily: C.fnh, overflow: 'hidden' }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}} @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}`}</style>

      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 28px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 22 }}>🔮</span>
          <span style={{ fontWeight: 800, fontSize: 16, color: C.teal }}>Prediction Question</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: C.card, borderRadius: 8, padding: '6px 16px', border: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, display: 'block' }}>Kode Sesi</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 18, color: C.teal, letterSpacing: 3 }}>{sessionCode}</span>
          </div>
          <div style={{ background: C.card, borderRadius: 8, padding: '6px 16px', border: `1px solid ${C.border}`, minWidth: 70, textAlign: 'center' }}>
            <span style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, display: 'block' }}>Respons</span>
            <span style={{ fontWeight: 900, fontSize: 20, color: responses.length > 0 ? C.gold : C.muted }}>{responses.length}</span>
          </div>
          <button onClick={() => setFullscreen(false)} style={{ background: 'none', border: `1px solid ${C.border}`, color: C.muted, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontFamily: C.fnh }}>
            ✕ Keluar
          </button>
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden' }}>
        {/* Left: Question + Reveal */}
        <div style={{ width: '42%', padding: 32, display: 'flex', flexDirection: 'column', gap: 20, borderRight: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ background: 'rgba(0,200,224,0.06)', borderRadius: 12, padding: 24, border: `1px solid rgba(0,200,224,0.15)`, flex: 'none' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.teal, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>🔮 Pertanyaan</div>
            <div style={{ fontWeight: 700, fontSize: 20, lineHeight: 1.6, color: C.white }}>{question}</div>
          </div>

          {!presented ? (
            <button onClick={() => setPresented(true)} disabled={responses.length === 0}
              style={{ padding: '16px', borderRadius: 12, border: 'none', background: responses.length > 0 ? C.gold : C.muted, color: C.navy, fontWeight: 800, fontSize: 16, cursor: responses.length > 0 ? 'pointer' : 'default', fontFamily: C.fnh, transition: 'all 0.2s' }}>
              💡 Ungkap Penjelasan Ilmiah
            </button>
          ) : (
            <div style={{ background: 'rgba(0,200,224,0.08)', borderRadius: 12, padding: 20, border: `1px solid rgba(0,200,224,0.2)`, overflowY: 'auto' }}>
              <div style={{ fontWeight: 700, color: C.teal, marginBottom: 10, fontSize: 14 }}>💡 Penjelasan Ilmiah</div>
              <div style={{ fontSize: 14, lineHeight: 1.8, color: C.white, marginBottom: comparePrompt ? 16 : 0 }}>{reveal}</div>
              {comparePrompt && <>
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14, marginTop: 4 }}>
                  <div style={{ fontWeight: 700, color: C.gold, fontSize: 12, marginBottom: 6 }}>🔄 Refleksi</div>
                  <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>{comparePrompt}</div>
                </div>
              </>}
            </div>
          )}
        </div>

        {/* Right: Live wall */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px 0', flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'pulse 1.5s ease infinite' }} />
              LIVE — Prediksi Masuk
            </div>
          </div>
          <div ref={wallRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 24px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {responses.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.muted, textAlign: 'center', gap: 12 }}>
                <div style={{ fontSize: 40, animation: 'float 3s ease infinite' }}>🌊</div>
                <div style={{ fontSize: 14 }}>Menunggu prediksi mahasiswa...</div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>Minta mahasiswa buka AquaLearn → Prediction Question</div>
              </div>
            ) : responses.map((r, i) => (
              <ResponseCard key={r.id || i} entry={r} index={i} isNew={i >= prevCount} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  // ── TEACHER NORMAL VIEW ───────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        .pq-card-hover:hover{border-color:var(--teal,#00c8e0)!important;transition:border-color 0.2s}
      `}</style>

      <div className="page-hdr">
        <div className="page-hdr-top">
          <div className="page-hdr-icon">🔮</div>
          <div>
            <h2>Prediction Question</h2>
            <p>Mahasiswa berprediksi secara live — bandingkan dengan penjelasan ilmiah</p>
          </div>
        </div>
      </div>

      {/* ── SETUP ── */}
      {phase === 'setup' && (
        <div style={{ animation: 'slideUp 0.3s ease' }}>
          {/* Presets */}
          <div className="card mb-16">
            <div className="form-label mb-12">Contoh Pertanyaan MSP</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PRESETS.map((p, i) => (
                <button key={i} className="btn btn-outline btn-sm" onClick={() => loadPreset(i)}>Contoh {i + 1}</button>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="card mb-16">
            <div className="form-group">
              <label className="form-label">Pertanyaan Prediksi</label>
              <textarea value={question} onChange={e => setQuestion(e.target.value)}
                placeholder="Apa yang akan terjadi jika..." rows={3} />
            </div>
            <div className="form-group">
              <label className="form-label">Penjelasan Ilmiah <span style={{ color: C.muted, fontWeight: 400, fontSize: 11 }}>(diungkap setelah diskusi)</span></label>
              <textarea value={reveal} onChange={e => setReveal(e.target.value)}
                placeholder="Jawaban yang akan dibandingkan dengan prediksi mahasiswa..." rows={4} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Prompt Refleksi <span style={{ color: C.muted, fontWeight: 400, fontSize: 11 }}>(opsional)</span></label>
              <textarea value={comparePrompt} onChange={e => setComparePrompt(e.target.value)}
                placeholder="Pertanyaan untuk memandu mahasiswa membandingkan prediksi dengan kenyataan..." rows={2} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-teal btn-lg" onClick={startSession}
              disabled={!question.trim() || !reveal.trim()}>
              🚀 Buka Sesi Live
            </button>
            <button className="btn btn-outline" onClick={() => setMode('student')}>
              📱 Coba Tampilan Mahasiswa
            </button>
          </div>
        </div>
      )}

      {/* ── LIVE ── */}
      {phase === 'live' && (
        <div style={{ animation: 'slideUp 0.3s ease' }}>
          {/* Session banner */}
          <div style={{ background: 'linear-gradient(135deg, rgba(0,200,224,0.12), rgba(0,200,224,0.04))', border: `1px solid rgba(0,200,224,0.25)`, borderRadius: 14, padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'pulse 1.5s ease infinite', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#34d399', fontWeight: 700 }}>SESI AKTIF</span>
            </div>
            <div>
              <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>Kode Sesi</div>
              <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 24, color: C.teal, letterSpacing: 4, lineHeight: 1.2 }}>{sessionCode}</div>
            </div>
            <div style={{ fontSize: 12, color: C.muted, flex: 1, minWidth: 200 }}>
              Minta mahasiswa buka AquaLearn → Prediction Question → Masukkan kode ini
            </div>
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setMode('student')}>📱 Tampilan Mahasiswa</button>
              <button className="btn btn-teal btn-sm" onClick={() => setFullscreen(true)}>⛶ Layar Penuh</button>
            </div>
          </div>

          {/* Question */}
          <div className="card mb-16" style={{ background: 'rgba(167,139,250,0.08)', borderColor: 'rgba(167,139,250,0.2)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>🔮 Pertanyaan Aktif</div>
            <div style={{ fontFamily: C.fnh, fontSize: 18, fontWeight: 700, lineHeight: 1.5, color: C.white }}>{question}</div>
          </div>

          {/* Two-column: wall + control */}
          <div className="grid-2" style={{ gap: 16, alignItems: 'start' }}>
            {/* Live Wall */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div className="form-label" style={{ margin: 0 }}>
                  Prediksi Masuk <span style={{ color: C.teal, fontWeight: 900, fontSize: 18 }}>{responses.length}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#34d399' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'pulse 1.5s ease infinite' }} />
                  Memperbarui setiap 2 detik
                </div>
              </div>
              <div ref={wallRef} style={{ maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {responses.length === 0 ? (
                  <div style={{ padding: '48px 20px', textAlign: 'center', background: C.surf, borderRadius: 12, border: `1px dashed ${C.border}`, color: C.muted, fontSize: 13 }}>
                    <div style={{ fontSize: 32, marginBottom: 10, animation: 'float 3s ease infinite' }}>🌊</div>
                    Menunggu prediksi mahasiswa...
                  </div>
                ) : responses.map((r, i) => (
                  <ResponseCard key={r.id || i} entry={r} index={i} isNew={i >= prevCount} />
                ))}
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {!presented ? (
                <button className="btn btn-gold btn-lg btn-block" onClick={() => setPresented(true)} disabled={responses.length === 0}>
                  💡 Ungkap Penjelasan Ilmiah
                </button>
              ) : (
                <div className="card" style={{ background: 'rgba(0,200,224,0.08)', borderColor: 'rgba(0,200,224,0.2)', padding: 20 }}>
                  <div style={{ fontWeight: 700, color: C.teal, marginBottom: 10, fontSize: 14 }}>💡 Penjelasan Ilmiah</div>
                  <div style={{ fontSize: 13, lineHeight: 1.8, color: C.white, marginBottom: comparePrompt ? 16 : 0 }}>{reveal}</div>
                  {comparePrompt && <>
                    <div className="divider" />
                    <div style={{ fontWeight: 700, color: C.gold, marginBottom: 6, fontSize: 12 }}>🔄 Refleksi</div>
                    <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>{comparePrompt}</div>
                  </>}
                </div>
              )}

              <div style={{ background: C.surf, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Statistik Sesi</div>
                {[
                  ['Total Prediksi', responses.length],
                  ['Rata-rata kata', responses.length > 0 ? Math.round(responses.reduce((s, r) => s + r.text.split(' ').length, 0) / responses.length) : '—'],
                  ['Paling baru', responses.length > 0 ? responses[responses.length - 1].time : '—']
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                    <span style={{ color: C.muted }}>{label}</span>
                    <span style={{ color: C.white, fontWeight: 700 }}>{val}</span>
                  </div>
                ))}
              </div>

              <button className="btn btn-ghost btn-block" onClick={endSession}>✕ Tutup Sesi</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default PredictionQuestion
