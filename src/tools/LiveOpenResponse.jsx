// ================================================================
// src/tools/LiveOpenResponse.jsx
// Mentimeter-style Live Open Response
// – Presenter view : setup → live → reveal
// – Student view   : join via ?join=CODE, submit response live
// Structure follows WordCloud.jsx pattern
// ================================================================

import { useState, useEffect, useMemo } from 'react'
import {
  generateRoomCode, joinUrl,
  createRoom, closeRoom,
  useListenRoom,
  getRoom, submitResponse,
  flattenResponses,
} from '../hooks/useRoom'
import QRModal, { QRClickable } from '../components/QRModal'

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

const fmtTime = (ts) =>
  new Date(ts).toLocaleTimeString('id', { hour: '2-digit', minute: '2-digit' })

// ── Shared student wrapper (moved outside to prevent focus loss) ─
function StudentWrap({ code, children }) {
  return (
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
    </div>
  )
}

// ================================================================
// STUDENT JOIN VIEW — rendered by App.jsx when ?join=CODE found
// ================================================================
export function StudentJoinView({ code }) {
  const [status, setStatus] = useState('loading') // loading | input | submitting | done | error
  const [session, setSession] = useState(null)
  const [name, setName]       = useState('')
  const [text, setText]       = useState('')
  const [errMsg, setErrMsg]   = useState('')

  useEffect(() => {
    getRoom(code)
      .then((data) => {
        if (!data || !data.question || !data.active || data.phase === 'closed') {
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
      await submitResponse(code, {
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
          Kode <b style={{ color: 'var(--white)' }}>{code}</b> tidak valid,<br />
          atau sesi sudah berakhir.
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
    </StudentWrap>
  )

  // status === 'input' | 'submitting'
  return (
    <StudentWrap code={code}>
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
          {session?.question}
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
    </StudentWrap>
  )
}

// ================================================================
// RESPONSE CARD — reused in live feed and reveal grid
// ================================================================
function ResponseCard({ response, index, big = false }) {
  const col = CARD_COLORS[index % CARD_COLORS.length]
  return (
    <div style={{
      background: col.bg,
      border: `1px solid ${col.border}`,
      borderLeft: `3px solid ${col.accent}`,
      borderRadius: 'var(--r-sm)',
      padding: big ? '16px 20px' : '12px 16px',
      transition: 'box-shadow 0.2s',
    }}>
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
// MAIN PRESENTER COMPONENT (default export)
// Structure follows WordCloud.jsx
// ================================================================
function LiveOpenResponse() {
  const [phase, setPhase]         = useState('setup') // setup | live | reveal
  const [question, setQuestion]   = useState('')
  const [reveal, setReveal]       = useState('')
  const [comparePrompt, setCompare] = useState('')
  const [presentMode, setPresentMode] = useState(false)

  const [liveCode, setLiveCode]       = useState(null)
  const [liveLoading, setLiveLoading] = useState(false)
  const [copied, setCopied]           = useState(false)
  const [liveClosed, setLiveClosed]   = useState(false)
  const [qrOpen, setQrOpen]           = useState(false)

  const { data: roomData } = useListenRoom(liveCode)

  const responses = useMemo(() => {
    if (!liveCode || !roomData) return []
    return flattenResponses(roomData)
  }, [liveCode, roomData])

  // ── Actions ────────────────────────────────────────────────────

  const goLive = async () => {
    if (!question.trim() || !reveal.trim()) return
    setLiveLoading(true)
    const code = generateRoomCode()
    try {
      await createRoom(code, {
        tool: 'liveresp',
        question: question.trim(),
        reveal: reveal.trim(),
        comparePrompt: comparePrompt.trim(),
        status: 'live',
      })
      setLiveCode(code)
      setLiveClosed(false)
      setPhase('live')
      setPresentMode(true)
    } catch (e) {
      alert('Gagal membuat sesi live. Cek konfigurasi Firebase.\n\n' + e.message)
    }
    setLiveLoading(false)
  }

  const doReveal = async () => {
    if (liveCode) await closeRoom(liveCode).catch(() => {})
    setLiveClosed(true)
    setPhase('reveal')
  }

  const reset = () => {
    setPhase('setup')
    setQuestion('')
    setReveal('')
    setCompare('')
    setLiveCode(null)
    setLiveClosed(false)
    setPresentMode(false)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(joinUrl(liveCode))
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  // ── PRESENT MODE (fullscreen overlay — live & reveal phases) ────
  if (presentMode && liveCode) {
    return (
      <>
        <QRModal
          open={qrOpen}
          onClose={() => setQrOpen(false)}
          value={joinUrl(liveCode)}
          code={liveCode}
          question={question}
          totalVotes={responses.length}
        />

        <div style={{
          position: 'fixed', inset: 0, background: '#060d1a', zIndex: 1000,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          fontFamily: 'var(--font-b)',
        }}>
          {/* ── Top bar ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '11px 22px', borderBottom: '1px solid rgba(167,139,250,0.15)',
            flexShrink: 0, background: 'rgba(10,21,37,0.95)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>🔮</span>
              <span style={{ fontFamily: 'var(--font-h)', fontWeight: 800, color: '#a78bfa', fontSize: 14 }}>
                AquaTeach — Live Open Response
              </span>
              <span className="badge" style={{
                background: 'rgba(167,139,250,0.12)', color: '#a78bfa',
                border: '1px solid rgba(167,139,250,0.3)',
                display: 'inline-flex', gap: 5, marginLeft: 6,
              }}>
                {phase === 'live' && <span className="phase-dot phase-dot-active" />}
                {responses.length} respons
              </span>
              {liveClosed && (
                <span className="badge" style={{
                  background: 'rgba(248,113,113,0.15)', color: '#f87171',
                  border: '1px solid rgba(248,113,113,0.3)', marginLeft: 4,
                }}>
                  🔒 Sesi Ditutup
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {phase === 'live' && (
                <button className="btn btn-gold btn-sm" onClick={doReveal}
                  disabled={responses.length === 0}>
                  💡 Ungkap Penjelasan
                </button>
              )}
              {phase === 'reveal' && (
                <button className="btn btn-outline btn-sm" onClick={() => { setPresentMode(false) }}>
                  📋 Lihat Hasil
                </button>
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => setPresentMode(false)}>
                ✕ Keluar
              </button>
            </div>
          </div>

          {/* ── Body ── */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

            {/* LEFT sidebar */}
            <div style={{
              width: 286, flexShrink: 0, background: 'rgba(9,18,34,0.97)',
              borderRight: '1px solid rgba(167,139,250,0.1)',
              display: 'flex', flexDirection: 'column',
              padding: '24px 18px', gap: 18, overflowY: 'auto',
            }}>
              {/* Question */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1.8px', marginBottom: 7 }}>
                  Pertanyaan
                </div>
                <div style={{ fontFamily: 'var(--font-h)', fontSize: 13.5, fontWeight: 700, color: 'var(--white)', lineHeight: 1.55 }}>
                  "{question}"
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(167,139,250,0.1)' }} />

              {/* QR — clickable */}
              {phase === 'live' && (
                <>
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
                      Kode Sesi
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-h)', fontWeight: 900, fontSize: 30,
                      letterSpacing: 8, color: '#a78bfa', lineHeight: 1,
                      textShadow: '0 0 24px rgba(167,139,250,0.45)',
                    }}>
                      {liveCode}
                    </div>
                    <div style={{ fontSize: 9.5, color: 'var(--muted)', marginTop: 5, wordBreak: 'break-all', lineHeight: 1.4 }}>
                      {joinUrl(liveCode)}
                    </div>
                    <button className="btn btn-outline btn-sm"
                      style={{ marginTop: 9, width: '100%', fontSize: 12 }}
                      onClick={copyLink}>
                      {copied ? '✓ Tersalin!' : '📋 Salin Link'}
                    </button>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(167,139,250,0.1)' }} />
                </>
              )}

              {/* Response counter */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'var(--font-h)', fontSize: 44, fontWeight: 900,
                  color: '#a78bfa', lineHeight: 1,
                  textShadow: '0 0 20px rgba(167,139,250,0.4)',
                }}>
                  {responses.length}
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 3 }}>
                  {phase === 'live' ? 'respons masuk' : 'total respons'}
                </div>
              </div>
            </div>

            {/* RIGHT — Live feed or Reveal */}
            <div style={{
              flex: 1, padding: '28px 32px', overflowY: 'auto',
              backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(167,139,250,0.03) 0%, transparent 60%)',
            }}>
              {/* LIVE: scrolling response feed */}
              {phase === 'live' && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 14 }}>
                    Live Feed
                  </div>
                  {responses.length === 0 ? (
                    <div style={{
                      textAlign: 'center', padding: '72px 20px',
                      background: 'rgba(167,139,250,0.04)',
                      borderRadius: 'var(--r)', border: '1px dashed rgba(167,139,250,0.2)',
                      color: 'var(--muted)',
                    }}>
                      <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>📡</div>
                      <div style={{ fontSize: 14, marginBottom: 6 }}>Menunggu respons mahasiswa...</div>
                      <div style={{ fontSize: 11 }}>Minta mereka scan QR atau ketik kode di browser HP</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {responses.map((r, i) => <ResponseCard key={r.id} response={r} index={i} big />)}
                    </div>
                  )}
                </>
              )}

              {/* REVEAL: scientific explanation + all cards */}
              {phase === 'reveal' && (
                <>
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
                        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
                          {comparePrompt}
                        </div>
                      </>
                    )}
                  </div>

                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 12 }}>
                    Semua Respons Mahasiswa ({responses.length})
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 10,
                  }}>
                    {responses.map((r, i) => <ResponseCard key={r.id} response={r} index={i} big />)}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </>
    )
  }

  // ── NORMAL UI ────────────────────────────────────────────────────
  return (
    <>
      <QRModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        value={joinUrl(liveCode ?? '')}
        code={liveCode}
        question={question}
        totalVotes={responses.length}
      />

      <div className="page-hdr">
        <div className="page-hdr-top">
          <div className="page-hdr-icon">🔮</div>
          <div>
            <h2>Live Open Response</h2>
            <p>Mahasiswa kirim prediksi dari HP masing-masing — muncul langsung di layar kelas</p>
          </div>
        </div>
      </div>

      {/* ── SETUP ─────────────────────────────────────────────────── */}
      {phase === 'setup' && (
        <div className="anim-fade-up">
          {/* Preset picker */}
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

          {/* Form */}
          <div className="card mb-16">
            <div className="form-group">
              <label className="form-label">Pertanyaan Prediksi</label>
              <textarea value={question} onChange={e => setQuestion(e.target.value)}
                placeholder="Apa yang akan terjadi jika... / Menurut Anda, bagaimana..."
                rows={3} />
            </div>
            <div className="form-group">
              <label className="form-label">
                Penjelasan Ilmiah
                <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 11, marginLeft: 6 }}>
                  (diungkap setelah semua mahasiswa submit)
                </span>
              </label>
              <textarea value={reveal} onChange={e => setReveal(e.target.value)}
                placeholder="Penjelasan ilmiah yang dibandingkan dengan prediksi mahasiswa..."
                rows={4} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                Prompt Refleksi
                <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 11, marginLeft: 6 }}>
                  (opsional)
                </span>
              </label>
              <textarea value={comparePrompt} onChange={e => setCompare(e.target.value)}
                placeholder="Pertanyaan untuk memandu mahasiswa membandingkan prediksi dengan kenyataan..."
                rows={2} />
            </div>
          </div>

          <button
            className="btn btn-lg btn-block"
            style={{
              background: 'linear-gradient(135deg,#a78bfa,#7c3aed)',
              color: '#fff', border: 'none',
              opacity: (!question.trim() || !reveal.trim() || liveLoading) ? 0.5 : 1,
            }}
            onClick={goLive}
            disabled={!question.trim() || !reveal.trim() || liveLoading}>
            {liveLoading ? '⏳ Membuat sesi...' : '🔴 Go Live'}
          </button>
        </div>
      )}

      {/* ── LIVE (normal view behind present mode) ────────────────── */}
      {phase === 'live' && (
        <div className="anim-fade-up">
          {/* Live status bar */}
          <div className="card mb-16" style={{ border: '1.5px solid rgba(167,139,250,0.35)', boxShadow: '0 0 20px rgba(167,139,250,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className="phase-dot phase-dot-active" style={{ width: 10, height: 10 }} />
                  <span style={{ fontFamily: 'var(--font-h)', fontWeight: 800, color: '#a78bfa', fontSize: 13 }}>
                    LIVE AKTIF — {liveCode}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {responses.length} respons masuk
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-sm" style={{ background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color:'#fff', border:'none' }}
                  onClick={() => setPresentMode(true)}>
                  ⛶ Buka Presentasi Live
                </button>
                <button className="btn btn-gold btn-sm" onClick={doReveal} disabled={responses.length === 0}>
                  💡 Ungkap Penjelasan
                </button>
              </div>
            </div>
          </div>

          {/* Question display */}
          <div className="card mb-16" style={{
            background: 'linear-gradient(135deg, rgba(167,139,250,0.10), rgba(167,139,250,0.02))',
            borderColor: 'rgba(167,139,250,0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
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
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', alignSelf: 'flex-start' }}>
                Cara Bergabung
              </div>
              <QRClickable
                value={joinUrl(liveCode)}
                size={190}
                onClick={() => setQrOpen(true)}
              />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Kode Sesi
                </div>
                <div style={{ fontFamily: 'var(--font-h)', fontSize: 30, fontWeight: 800, letterSpacing: '6px', color: '#a78bfa' }}>
                  {liveCode}
                </div>
              </div>
              <button onClick={copyLink} className="btn btn-outline btn-sm btn-block" style={{ fontSize: 11 }}>
                {copied ? '✅ Link disalin!' : '🔗 Salin Link Join'}
              </button>
              <div style={{
                width: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8, padding: '10px 12px',
                background: 'rgba(79,201,126,0.08)',
                borderRadius: 'var(--r-sm)', border: '1px solid rgba(79,201,126,0.25)',
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)', animation: 'pulse 1.5s ease infinite' }} />
                <span style={{ fontFamily: 'var(--font-h)', fontWeight: 800, color: 'var(--white)', fontSize: 20 }}>
                  {responses.length}
                </span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>respons masuk</span>
              </div>
            </div>

            {/* Live feed */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>
                Live Feed
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto', paddingRight: 2 }}>
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

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-gold btn-lg" onClick={doReveal} disabled={responses.length === 0}>
              💡 Ungkap Penjelasan Ilmiah
            </button>
            <button className="btn btn-ghost" onClick={reset}>✕ Akhiri Sesi</button>
          </div>
        </div>
      )}

      {/* ── REVEAL ───────────────────────────────────────────────── */}
      {phase === 'reveal' && (
        <div className="anim-fade-up">
          {liveCode && (
            <div className="card mb-16">
              <span className="badge" style={{
                background: 'rgba(248,113,113,0.15)', color: '#f87171',
                border: '1px solid rgba(248,113,113,0.3)',
                display: 'inline-flex', gap: 6,
              }}>
                🔒 Sesi Ditutup · {liveCode} · {responses.length} respons
              </span>
            </div>
          )}

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

          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>
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
            <button className="btn btn-sm" style={{ background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color:'#fff', border:'none' }}
              onClick={() => setPresentMode(true)}>
              ⛶ Mode Presentasi
            </button>
            <button className="btn btn-ghost" onClick={reset}>🔄 Sesi Baru</button>
          </div>
        </div>
      )}
    </>
  )
}

export default LiveOpenResponse
