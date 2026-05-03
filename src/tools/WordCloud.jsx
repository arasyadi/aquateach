import { useState, useEffect, useMemo } from 'react'
import {
  generateRoomCode, joinUrl,
  createRoom, closeRoom,
  useListenRoom, flattenWords,
  getRoom, submitWords,
  hasSubmitted, markSubmitted,
  withTimeout,
} from '../hooks/useRoom'
import { QRCodeSVG } from 'qrcode.react'
import QRModal, { QRClickable } from '../components/QRModal'

const COLORS = ['var(--teal)', 'var(--gold)', '#a78bfa', '#34d399', '#fb923c', '#f472b6', '#60a5fa', '#fbbf24']
const COLORS_HEX = ['#00c8e0', '#ffc847', '#a78bfa', '#34d399', '#fb923c', '#f472b6', '#60a5fa', '#fbbf24']

// ──────────────────────────────────────────────────────────────
// FIX: StudentWrap didefinisikan di LUAR StudentView
// agar tidak di-remount setiap kali state berubah
// ──────────────────────────────────────────────────────────────
const StudentWrap = ({ code, children }) => (
  <div style={{
    minHeight: '100vh', background: 'var(--bg)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '28px 18px', fontFamily: 'var(--font-b)',
  }}>
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
    <div style={{ marginTop: 28, fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>
  ☕ Developed by: Andy Rasyadi
</div>
  </div>
)

// ──────────────────────────────────────────────────────────────
// FIX: CloudChips didefinisikan di LUAR WordCloud
// dependencies diterima via props
// ──────────────────────────────────────────────────────────────
const CloudChips = ({ sortedWords, rotations, maxFreq, big = false }) => (
  <div style={{
    display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center',
    gap: big ? '14px 18px' : '8px 10px',
    padding: big ? '32px' : '16px',
    minHeight: big ? 260 : 130,
  }}>
    {sortedWords.length === 0 ? (
      <div style={{ color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
        <div style={{ fontSize: big ? 56 : 38, marginBottom: 10, opacity: 0.4 }}>☁️</div>
        <div style={{ fontSize: big ? 15 : 12 }}>Menunggu kata dari mahasiswa...</div>
      </div>
    ) : sortedWords.map(([word, freq], i) => {
      const sz  = (big ? 20 : 15) + (freq / maxFreq) * (big ? 46 : 28)
      const hex = COLORS_HEX[i % COLORS_HEX.length]
      const rot = rotations[word] ?? 0
      return (
        <span key={word} style={{
          fontSize: sz, fontFamily: 'var(--font-h)',
          fontWeight: freq > 1 ? 800 : 600, color: '#fff',
          background: hex + '2a', border: `1.5px solid ${hex}60`,
          borderRadius: '10px',
          padding: `${Math.round(sz * 0.22)}px ${Math.round(sz * 0.55)}px`,
          transform: `rotate(${rot}deg)`, display: 'inline-block',
          animation: 'pop 0.35s ease', lineHeight: 1.2,
          backdropFilter: 'blur(4px)',
          transition: 'font-size 0.5s cubic-bezier(.34,1.5,.64,1)',
          cursor: 'default', userSelect: 'none',
        }}>{word}</span>
      )
    })}
  </div>
)

// ──────────────────────────────────────────────────────────────
// FIX: CloudDisplay didefinisikan di LUAR WordCloud
// dependencies diterima via props
// ──────────────────────────────────────────────────────────────
const CloudDisplay = ({ sortedWords, rotations, maxFreq }) => (
  <div className="word-cloud-area">
    {sortedWords.length === 0 ? (
      <div style={{ color: 'var(--muted)', fontSize: 14, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>☁️</div>
        Belum ada kata
      </div>
    ) : sortedWords.map(([word, freq], i) => {
      const size = 14 + (freq / maxFreq) * 32
      return (
        <span key={word} className="cloud-word" style={{
          fontSize: size,
          color: COLORS[i % COLORS.length],
          transform: `rotate(${rotations[word] ?? 0}deg)`,
        }}>{word}</span>
      )
    })}
  </div>
)

// ──────────────────────────────────────────────────────────────
// StudentView – untuk halaman partisipasi mahasiswa
// ──────────────────────────────────────────────────────────────
export function StudentView({ code }) {
  const [status, setStatus]   = useState('loading')
  const [session, setSession] = useState(null)
  const [input, setInput]     = useState('')
  const [errMsg, setErrMsg]   = useState('')

  useEffect(() => {
    if (hasSubmitted(code)) { setStatus('done'); return }

    getRoom(code)
      .then(data => {
        if (!data || !data.active || data.phase === 'closed') {
          setStatus('error')
        } else {
          setSession(data)
          setStatus('input')
        }
      })
      .catch(() => setStatus('error'))
  }, [code])

  const maxWords = session?.maxWords ?? 3

  const submit = async () => {
    const parsed = input.trim().split(/[,\s]+/).filter(w => w.length > 1).slice(0, maxWords)
    if (!parsed.length) return
    setErrMsg('')
    setStatus('submitting')
    try {
      await submitWords(code, parsed)
      markSubmitted(code)
      setStatus('done')
    } catch {
      setErrMsg('Gagal mengirim — periksa koneksi dan coba lagi.')
      setStatus('input')
    }
  }

  if (status === 'loading') return (
    <StudentWrap code={code}>
      <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 48 }}>
        <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 16px' }} />
        Memuat sesi...
      </div>
    </StudentWrap>
  )

  if (status === 'error') return (
    <StudentWrap code={code}>
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
          Kode <b style={{ color: 'var(--white)' }}>{code}</b> tidak valid atau sesi sudah berakhir.
        </div>
      </div>
    </StudentWrap>
  )

  if (status === 'done') return (
    <StudentWrap code={code}>
      <div style={{
        textAlign: 'center', padding: '48px 24px',
        background: 'var(--card)', borderRadius: 'var(--r)',
        border: '1px solid rgba(79,201,126,0.3)',
      }}>
        <div style={{ fontSize: 56, marginBottom: 14 }}>✅</div>
        <div style={{ fontFamily: 'var(--font-h)', fontSize: 22, fontWeight: 800, color: 'var(--success)', marginBottom: 10 }}>
          Kata Terkirim!
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
          Kontribusi Anda sudah masuk ke Word Cloud.<br />
          Lihat hasilnya di layar kelas!
        </div>
      </div>
    </StudentWrap>
  )

  return (
    <StudentWrap code={code}>
      {/* Prompt */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(0,200,224,0.12),rgba(0,200,224,0.03))',
        border: '1px solid rgba(0,200,224,0.3)',
        borderRadius: 'var(--r)', padding: '18px 20px', marginBottom: 16,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 8 }}>
          ☁️ Prompt Word Cloud
        </div>
        <div style={{ fontFamily: 'var(--font-h)', fontSize: 16, fontWeight: 700, lineHeight: 1.6, color: 'var(--white)' }}>
          {session?.prompt}
        </div>
      </div>

      {/* Input */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '18px 20px' }}>
        <div style={{ marginBottom: 18 }}>
          <label style={{
            display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--muted)',
            textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 7,
          }}>
            Kata-kata Anda ✏️
            <span style={{ fontWeight: 400, marginLeft: 6, color: 'var(--muted)' }}>
              (maks {maxWords} kata, pisah koma/spasi)
            </span>
          </label>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Ketik hingga ${maxWords} kata, contoh: laut, ikan, terumbu`}
            rows={3}
            disabled={status === 'submitting'}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) submit() }}
            style={{ width: '100%' }}
          />
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
            Ctrl+Enter untuk kirim &nbsp;·&nbsp;
            Preview:{' '}
            <span style={{ color: 'var(--teal)' }}>
              {input.trim()
                ? input.trim().split(/[,\s]+/).filter(w => w.length > 1).slice(0, maxWords).join(', ') || '—'
                : '—'}
            </span>
          </div>
        </div>

        {errMsg && (
          <div style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 14,
            padding: '10px 14px', background: 'rgba(240,101,101,0.08)', borderRadius: 'var(--r-sm)' }}>
            ⚠️ {errMsg}
          </div>
        )}

        <button
          onClick={submit}
          disabled={!input.trim() || status === 'submitting'}
          style={{
            width: '100%', padding: '15px', borderRadius: 'var(--r-sm)',
            background: (input.trim() && status !== 'submitting') ? 'var(--teal)' : 'var(--surface)',
            color: (input.trim() && status !== 'submitting') ? '#000d14' : 'var(--muted)',
            border: '1px solid transparent',
            fontFamily: 'var(--font-h)', fontWeight: 800, fontSize: 15,
            cursor: (input.trim() && status !== 'submitting') ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}
        >
          {status === 'submitting' ? '⏳ Mengirim...' : '☁️ Kirim Kata'}
        </button>
      </div>
    </StudentWrap>
  )
}

// ──────────────────────────────────────────────────────────────
// Komponen utama WordCloud (dosen)
// ──────────────────────────────────────────────────────────────
function WordCloud() {
  const [phase, setPhase]         = useState('setup')
  const [prompt, setPrompt]       = useState('')
  const [maxWords, setMaxWords]   = useState(3)
  const [input, setInput]         = useState('')
  const [words, setWords]         = useState([])
  const [presentMode, setPresentMode] = useState(false)

  const [liveCode, setLiveCode]       = useState(null)
  const [liveLoading, setLiveLoading] = useState(false)
  const [copied, setCopied]           = useState(false)
  const [liveClosed, setLiveClosed]   = useState(false)
  const [qrOpen, setQrOpen]           = useState(false)

  const { data: roomData } = useListenRoom(liveCode)

  const liveWords = useMemo(() => {
    if (!liveCode || !roomData) return null
    return flattenWords(roomData)
  }, [liveCode, roomData])

  const displayWords = liveWords ?? words

  const wordFreq = useMemo(() => {
    const freq = {}
    displayWords.forEach(w => { const k = w.toLowerCase().trim(); if (k) freq[k] = (freq[k] || 0) + 1 })
    return freq
  }, [displayWords])

  const sortedWords = useMemo(() => Object.entries(wordFreq).sort((a, b) => b[1] - a[1]), [wordFreq])
  const maxFreq = sortedWords.length > 0 ? sortedWords[0][1] : 1

  const rotations = useMemo(() => {
    const map = {}
    sortedWords.forEach(([word]) => {
      let h = 0
      for (let i = 0; i < word.length; i++) h = (h * 31 + word.charCodeAt(i)) & 0xffff
      map[word] = ((h % 20) - 10)
    })
    return map
  }, [sortedWords])

  // ───────── PATCH: Restore session ─────────
  useEffect(() => {
    const saved = localStorage.getItem('aqt_session')
    if (!saved) return
    try {
      const s = JSON.parse(saved)
      if (s.tool !== 'wordcloud') return
      setLiveCode(s.liveCode)
      setPhase(s.phase)
      setPrompt(s.prompt)
      setMaxWords(s.maxWords)

      // Bonus: cek apakah sesi masih aktif di Firebase
      getRoom(s.liveCode).then(data => {
        if (!data || !data.active || data.phase === 'closed') {
          localStorage.removeItem('aqt_session')
          reset()
        }
      }).catch(() => {
        localStorage.removeItem('aqt_session')
        reset()
      })
    } catch {}
  }, [])

  const addWords = () => {
    const parsed = input.trim().split(/[,\s]+/).filter(w => w.length > 1).slice(0, maxWords)
    if (!parsed.length) return
    setWords([...words, ...parsed])
    setInput('')
  }

  const reset = () => {
    // PATCH: hapus session dari localStorage
    localStorage.removeItem('aqt_session')
    setPhase('setup'); setWords([]); setPrompt(''); setInput('')
    setLiveCode(null); setLiveClosed(false); setPresentMode(false)
  }

  // ───────── PATCH: guard + finally ─────────
  const goLive = async () => {
  if (!prompt.trim()) return
  if (liveCode) return
  setLiveLoading(true)
  const code = generateRoomCode()
  try {
    await withTimeout(createRoom(code, { tool: 'wordcloud', prompt, maxWords }))  // ← ubah baris ini
    setLiveCode(code)
    setLiveClosed(false)
    setPhase('collecting')
    setPresentMode(true)
      // PATCH: simpan session ke localStorage
      localStorage.setItem('aqt_session', JSON.stringify({
        tool: 'wordcloud',
        liveCode: code,
        phase: 'collecting',
        prompt,
        maxWords,
      }))
    } catch (e) {
      alert('Gagal membuat sesi live. Cek konfigurasi Firebase.\n\n' + e.message)
    } finally {
      setLiveLoading(false)                 // selalu dipanggil
    }
  }

  const endLive = async () => {
    // PATCH: hapus session dari localStorage
    localStorage.removeItem('aqt_session')
    if (liveCode) await closeRoom(liveCode)
    setLiveClosed(true)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(joinUrl(liveCode))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  /* ── SLIDO-STYLE LIVE PRESENTATION MODE ── */
  if (presentMode && liveCode) {
    return (
      <>
        <QRModal
          open={qrOpen}
          onClose={() => setQrOpen(false)}
          value={joinUrl(liveCode)}
          code={liveCode}
          question={prompt}
          totalVotes={displayWords.length}
        />

        <div style={{
          position: 'fixed', inset: 0, background: '#060d1a', zIndex: 1000,
          display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'var(--font-b)',
        }}>
          {/* top bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '11px 22px', borderBottom: '1px solid rgba(0,200,224,0.13)',
            flexShrink: 0, background: 'rgba(10,21,37,0.95)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>☁️</span>
              <span style={{ fontFamily: 'var(--font-h)', fontWeight: 800, color: 'var(--teal)', fontSize: 14 }}>
                AquaTeach — Word Cloud Live
              </span>
              <span className="badge badge-teal" style={{ display: 'inline-flex', gap: 5, marginLeft: 6 }}>
                <span className="phase-dot phase-dot-active" />
                {displayWords.length} kata · {Object.keys(wordFreq).length} unik
              </span>
              {liveClosed && (
                <span className="badge" style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', marginLeft: 4 }}>
                  🔒 Sesi Ditutup
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {!liveClosed
                ? <button className="btn btn-gold btn-sm" onClick={endLive}>🔒 Tutup Sesi</button>
                : <button className="btn btn-outline btn-sm" onClick={() => { setPresentMode(false); setPhase('results') }}>📋 Lihat Hasil</button>
              }
              <button className="btn btn-ghost btn-sm" onClick={() => setPresentMode(false)}>✕ Keluar</button>
            </div>
          </div>

          {/* body: sidebar + cloud */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

            {/* LEFT sidebar */}
            <div style={{
              width: 286, flexShrink: 0, background: 'rgba(9,18,34,0.97)',
              borderRight: '1px solid rgba(0,200,224,0.1)', display: 'flex',
              flexDirection: 'column', padding: '24px 18px', gap: 18, overflowY: 'auto',
            }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1.8px', marginBottom: 7 }}>
                  Pertanyaan
                </div>
                <div style={{ fontFamily: 'var(--font-h)', fontSize: 13.5, fontWeight: 700, color: 'var(--white)', lineHeight: 1.55 }}>
                  "{prompt}"
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(0,200,224,0.1)' }} />

              {/* QR — CLICKABLE */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1.8px', marginBottom: 10 }}>
                  Scan untuk bergabung
                </div>
                <QRClickable
                  value={joinUrl(liveCode)}
                  size={216}
                  onClick={() => setQrOpen(true)}
                />
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 10 }}>
                  Klik untuk perbesar
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1.8px', marginBottom: 5 }}>
                  Kode Room
                </div>
                <div style={{
                  fontFamily: 'var(--font-h)', fontWeight: 900, fontSize: 30, letterSpacing: 8,
                  color: 'var(--teal)', lineHeight: 1, textShadow: '0 0 24px rgba(0,200,224,0.45)',
                }}>{liveCode}</div>
                <div style={{ fontSize: 9.5, color: 'var(--muted)', marginTop: 5, wordBreak: 'break-all', lineHeight: 1.4 }}>
                  {joinUrl(liveCode)}
                </div>
                <button className="btn btn-outline btn-sm" style={{ marginTop: 9, width: '100%', fontSize: 12 }} onClick={copyLink}>
                  {copied ? '✓ Tersalin!' : '📋 Salin Link'}
                </button>
              </div>

              <div style={{ borderTop: '1px solid rgba(0,200,224,0.1)' }} />

              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'var(--font-h)', fontSize: 44, fontWeight: 900,
                  color: 'var(--teal)', lineHeight: 1, textShadow: '0 0 20px rgba(0,200,224,0.4)',
                }}>{displayWords.length}</div>
                <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 3 }}>kata masuk</div>
              </div>

              {sortedWords[0] && (
                <div style={{
                  background: 'rgba(0,200,224,0.07)', border: '1px solid rgba(0,200,224,0.18)',
                  borderRadius: 10, padding: '10px 12px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>Terpopuler</div>
                  <div style={{ fontFamily: 'var(--font-h)', fontWeight: 800, color: 'var(--teal)', fontSize: 16 }}>
                    "{sortedWords[0][0]}"
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    × {sortedWords[0][1]} responden
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT — Live Word Cloud */}
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '20px', overflow: 'auto',
              backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0,200,224,0.03) 0%, transparent 60%)',
            }}>
              <div style={{ width: '100%', maxWidth: 900 }}>
                <CloudChips sortedWords={sortedWords} rotations={rotations} maxFreq={maxFreq} big />
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  /* ── results present mode (no live) ── */
  if (presentMode && !liveCode) {
    return (
      <div className="present-mode" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <button className="btn btn-outline btn-sm present-close" onClick={() => setPresentMode(false)}>✕ Tutup</button>
        <div style={{ width: '100%', maxWidth: 860, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-h)', fontSize: 30, fontWeight: 800, color: 'var(--teal)', marginBottom: 10 }}>
            ☁️ Word Cloud
          </div>
          <div style={{ fontFamily: 'var(--font-h)', fontSize: 22, fontWeight: 700, color: 'var(--white)', marginBottom: 28, lineHeight: 1.4 }}>
            "{prompt}"
          </div>
          <CloudDisplay sortedWords={sortedWords} rotations={rotations} maxFreq={maxFreq} />
          <div style={{ marginTop: 20, color: 'var(--muted)', fontSize: 13 }}>
            {displayWords.length} kata · {Object.keys(wordFreq).length} kata unik
          </div>
        </div>
      </div>
    )
  }

  /* ── NORMAL UI ── */
  return (
    <>
      <QRModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        value={joinUrl(liveCode ?? '')}
        code={liveCode}
        question={prompt}
        totalVotes={displayWords.length}
      />

      <div className="page-hdr">
        <div className="page-hdr-top">
          <div className="page-hdr-icon">☁️</div>
          <div>
            <h2>Word Cloud</h2>
            <p>Galeri persepsi kolektif — mahasiswa berkontribusi kata, kelas melihat pola bersama</p>
          </div>
        </div>
      </div>

      {/* SETUP */}
      {phase === 'setup' && (
        <div className="card anim-fade-up">
          <div className="form-group">
            <label className="form-label">Pertanyaan / Prompt</label>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
              placeholder='Contoh: "Ketika mendengar kata overfishing, apa yang pertama terlintas?"'
              rows={3} />
          </div>
          <div className="form-group">
            <label className="form-label">Maksimal Kata per Mahasiswa</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2, 3, 5].map(n => (
                <button key={n} onClick={() => setMaxWords(n)}
                  className={`btn ${maxWords === n ? 'btn-teal' : 'btn-outline'} btn-sm`}>
                  {n} kata
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-teal btn-lg" style={{ flex: 1 }}
              onClick={() => setPhase('collecting')} disabled={!prompt.trim()}>
              🖥️ Mulai Manual
            </button>
            <button className="btn btn-lg"
              style={{ flex: 1, background: 'linear-gradient(135deg,#ff4757,#c0392b)', color: '#fff', border: 'none',
                opacity: (!prompt.trim() || liveLoading) ? 0.5 : 1 }}
              onClick={goLive} disabled={!prompt.trim() || liveLoading}>
              {liveLoading ? '⏳ Membuat sesi...' : '🔴 Go Live'}
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 9, lineHeight: 1.6 }}>
            🔴 <strong style={{ color: 'var(--white)' }}>Go Live</strong> → layar presentasi Slido-style langsung terbuka<br />
            🖥️ <strong style={{ color: 'var(--white)' }}>Manual</strong> → input kata langsung di perangkat dosen
          </p>
        </div>
      )}

      {/* COLLECTING */}
      {phase === 'collecting' && (
        <div className="anim-fade-up">
          {liveCode && (
            <div className="card mb-16" style={{ border: '1.5px solid rgba(0,200,224,0.35)', boxShadow: '0 0 20px rgba(0,200,224,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="phase-dot phase-dot-active" style={{ width: 10, height: 10 }} />
                    <span style={{ fontFamily: 'var(--font-h)', fontWeight: 800, color: 'var(--teal)', fontSize: 13 }}>
                      LIVE AKTIF — {liveCode}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {displayWords.length} kata · {Object.keys(wordFreq).length} unik
                  </div>
                </div>
                {/* ───────── PATCH: hapus tombol Buka Presentasi Slido, hanya tutup sesi ───────── */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {!liveClosed
                    ? <button className="btn btn-gold btn-sm" onClick={endLive}>🔒 Tutup Sesi</button>
                    : <span className="badge" style={{ background:'rgba(248,113,113,0.15)', color:'#f87171', border:'1px solid rgba(248,113,113,0.3)', padding:'6px 12px' }}>🔒 Ditutup</span>
                  }
                </div>
              </div>
            </div>
          )}

          <div className="card mb-16">
            <div className="badge badge-teal mb-12" style={{ display: 'inline-flex' }}>
              <span className="phase-dot phase-dot-active" />
              {liveCode ? `LIVE — ${displayWords.length} kata masuk (real-time)` : `${displayWords.length} kata masuk`}
            </div>
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 18, fontWeight: 700, lineHeight: 1.4 }}>
              "{prompt}"
            </div>
          </div>

          <div className="grid-2" style={{ gap: 16 }}>
            <div className="card">
              {liveCode ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: 38, marginBottom: 10 }}>📱</div>
                  <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>
                    Kata masuk otomatis dari HP mahasiswa
                  </div>
                  <div style={{ fontFamily: 'var(--font-h)', fontSize: 36, fontWeight: 800, color: 'var(--teal)', lineHeight: 1 }}>
                    {displayWords.length}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, marginBottom: 16 }}>kata terkumpul</div>
                  <button className="btn btn-teal btn-sm" onClick={() => setPresentMode(true)}>⛶ Buka Presentasi Live</button>
                </div>
              ) : (
                <>
                  <div className="form-label mb-12">Input Kata (pisah koma/spasi)</div>
                  <textarea value={input} onChange={e => setInput(e.target.value)}
                    placeholder={`Contoh: tangkap, laut, ikan (maks ${maxWords} kata)`}
                    rows={3}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addWords() } }}
                  />
                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <button className="btn btn-teal" onClick={addWords} disabled={!input.trim()}>+ Tambah Kata</button>
                    <button className="btn btn-gold" onClick={() => setPhase('results')}>☁️ Tampilkan Cloud</button>
                  </div>
                </>
              )}
            </div>

            <div>
              <div className="form-label mb-12">Preview Real-time</div>
              <CloudDisplay sortedWords={sortedWords} rotations={rotations} maxFreq={maxFreq} />
            </div>
          </div>

          {sortedWords.length > 0 && (
            <div className="card mt-16">
              <div className="form-label mb-12">Kata Terpopuler</div>
              {sortedWords.slice(0, 8).map(([word, freq], i) => (
                <div key={word} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ width: 22, fontSize: 11, color: 'var(--muted)', fontWeight: 700, textAlign: 'right' }}>#{i+1}</span>
                  <span style={{ fontWeight: 700, color: COLORS[i % COLORS.length], minWidth: 90, fontSize: 14 }}>{word}</span>
                  <div className="progress-bar-wrap" style={{ flex: 1 }}>
                    <div className="progress-bar-fill" style={{ width: `${(freq / maxFreq) * 100}%`, background: COLORS_HEX[i % COLORS_HEX.length] }} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 14, color: 'var(--white)', minWidth: 24 }}>{freq}×</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RESULTS */}
      {phase === 'results' && (
        <div className="anim-fade-up">
          {liveCode && (
            <div className="card mb-16">
              <span className="badge" style={{ background:'rgba(248,113,113,0.15)', color:'#f87171', border:'1px solid rgba(248,113,113,0.3)', display:'inline-flex', gap:6 }}>
                🔒 Sesi Ditutup · {liveCode} · {displayWords.length} kata
              </span>
            </div>
          )}
          <div className="card mb-16">
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              "{prompt}"
            </div>
            <CloudDisplay sortedWords={sortedWords} rotations={rotations} maxFreq={maxFreq} />
            <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="badge badge-teal">{displayWords.length} total kata</span>
              <span className="badge badge-gold">{Object.keys(wordFreq).length} kata unik</span>
              {sortedWords[0] && <span className="badge badge-success">🏆 Terpopuler: "{sortedWords[0][0]}"</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-teal" onClick={() => setPresentMode(true)}>⛶ Mode Presentasi</button>
            {!liveCode && <button className="btn btn-outline" onClick={() => setPhase('collecting')}>← Lanjut Kumpulkan</button>}
            <button className="btn btn-ghost" onClick={reset}>🔄 Mulai Baru</button>
          </div>
        </div>
      )}
    </>
  )
}

export default WordCloud
