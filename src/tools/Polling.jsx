import { useState, useMemo, useEffect } from 'react'
import {
  generateRoomCode, joinUrl,
  createRoom, closeRoom,
  useListenRoom, countVotes,
  submitVote,
  hasSubmitted, markSubmitted,
  getRoom,
  withTimeout,   // ← tambahan
} from '../hooks/useRoom'
import { QRCodeSVG } from 'qrcode.react'
import QRModal, { QRClickable } from '../components/QRModal'

const COLORS     = ['var(--teal)', 'var(--gold)', '#a78bfa', '#fb923c', '#34d399', '#f472b6']
const COLORS_HEX = ['#00c8e0',    '#ffc847',     '#a78bfa', '#fb923c', '#34d399', '#f472b6']

function Polling() {
  const [phase, setPhase]             = useState('setup')
  const [question, setQuestion]       = useState('')
  const [options, setOptions]         = useState(['', ''])
  const [votes, setVotes]             = useState([])
  const [presentMode, setPresentMode] = useState(false)

  const [liveCode, setLiveCode]       = useState(null)
  const [liveLoading, setLiveLoading] = useState(false)
  const [copied, setCopied]           = useState(false)
  const [liveClosed, setLiveClosed]   = useState(false)
  const [qrOpen, setQrOpen]           = useState(false)

  // ── PATCH: restore sesi dari localStorage saat mount ──────────────
  useEffect(() => {
    const saved = localStorage.getItem('aqt_session')
    if (!saved) return
    try {
      const s = JSON.parse(saved)
      if (s.tool !== 'polling') return
      setLiveCode(s.liveCode)
      setPhase(s.phase)
      setQuestion(s.question)
      setOptions(Object.values(s.options))
      setVotes(new Array(Object.values(s.options).length).fill(0))
      // ── Bonus: cek apakah sesi masih aktif di Firebase ──────
      getRoom(s.liveCode).then(data => {
        if (!data || !data.active || data.phase === 'closed') {
          localStorage.removeItem('aqt_session')
          setPhase('setup')
          setQuestion('')
          setOptions(['', ''])
          setVotes([])
          setLiveCode(null)
          setLiveClosed(false)
          setPresentMode(false)
        }
      }).catch(() => {
        localStorage.removeItem('aqt_session')
      })
    } catch {}
  }, [])

  const { data: roomData } = useListenRoom(liveCode)

  const validOptions = options.filter(o => o.trim())

  const liveVotes = useMemo(() => {
    if (!liveCode || !roomData) return null
    return countVotes(roomData, validOptions.length)
  }, [liveCode, roomData, validOptions.length])

  const displayVotes = liveVotes ?? votes
  const totalVotes   = displayVotes.reduce((a, b) => a + b, 0)
  const topIdx       = displayVotes.length > 0 ? displayVotes.indexOf(Math.max(...displayVotes)) : 0

  const addOption    = () => { if (options.length < 6) setOptions([...options, '']) }
  const removeOption = (i) => { if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i)) }
  const updateOption = (i, val) => setOptions(options.map((o, idx) => idx === i ? val : o))

  const start = () => {
    if (!question.trim() || validOptions.length < 2) return
    setVotes(new Array(options.length).fill(0))
    setPhase('voting')
  }

  const vote = (i) => {
    if (phase !== 'voting' || liveCode) return
    setVotes(votes.map((v, idx) => idx === i ? v + 1 : v))
  }

  const reset = () => {
    setPhase('setup'); setQuestion(''); setOptions(['', '']); setVotes([])
    setLiveCode(null); setLiveClosed(false)
    localStorage.removeItem('aqt_session')
  }

  const goLive = async () => {
    if (!question.trim() || validOptions.length < 2) return
    if (liveCode) return                    // ← guard: sudah live, jangan buat baru
    setLiveLoading(true)
    const code = generateRoomCode()
    const optObject = {}
    validOptions.forEach((o, i) => { optObject[i] = o })
    try {
      await withTimeout(createRoom(code, { tool: 'polling', question, options: optObject }))
      setVotes(new Array(options.length).fill(0))
      setLiveCode(code)
      setLiveClosed(false)
      setPhase('voting')
      setPresentMode(true)
      localStorage.setItem('aqt_session', JSON.stringify({
        tool: 'polling',
        liveCode: code,
        phase: 'voting',
        question,
        options: optObject,
      }))
    } catch (e) {
      alert('Gagal membuat sesi live. Pastikan Firebase sudah dikonfigurasi.\n\n' + e.message)
    } finally {
      setLiveLoading(false)                 // ← selalu terpanggil, berhasil atau gagal
    }
  }

  const endLive = async () => {
    if (liveCode) await closeRoom(liveCode)
    setLiveClosed(true)
    localStorage.removeItem('aqt_session')
  }

  const copyLink = () => {
    navigator.clipboard.writeText(joinUrl(liveCode))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Slido-style fullscreen (Live) ─────────────────────────────────────────
  if (presentMode && liveCode) {
    return (
      <>
        <QRModal
          open={qrOpen}
          onClose={() => setQrOpen(false)}
          value={joinUrl(liveCode)}
          code={liveCode}
          question={question}
          totalVotes={totalVotes}
        />

        <div style={{
          position: 'fixed', inset: 0, background: '#060d1a', zIndex: 1000,
          display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'var(--font-b)',
        }}>
          {/* Top bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '11px 22px', borderBottom: '1px solid rgba(0,200,224,0.13)',
            flexShrink: 0, background: 'rgba(10,21,37,0.95)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>📊</span>
              <span style={{ fontFamily: 'var(--font-h)', fontWeight: 800, color: 'var(--teal)', fontSize: 14 }}>
                AquaTeach — Live Polling
              </span>
              <span className="badge badge-teal" style={{ display: 'inline-flex', gap: 5, marginLeft: 6 }}>
                <span className="phase-dot phase-dot-active" />
                {totalVotes} suara masuk
              </span>
              {liveClosed && (
                <span className="badge" style={{
                  background: 'rgba(248,113,113,0.15)', color: '#f87171',
                  border: '1px solid rgba(248,113,113,0.3)', marginLeft: 4,
                }}>🔒 Sesi Ditutup</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {!liveClosed
                ? <button className="btn btn-gold btn-sm" onClick={endLive}>🔒 Tutup Voting</button>
                : <button className="btn btn-outline btn-sm" onClick={() => { setPresentMode(false); setPhase('results') }}>
                    📋 Lihat Hasil
                  </button>
              }
              <button className="btn btn-ghost btn-sm" onClick={() => setPresentMode(false)}>✕ Keluar</button>
            </div>
          </div>

          {/* Body: sidebar + chart */}
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
                  "{question}"
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
                }}>{totalVotes}</div>
                <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 3 }}>suara masuk</div>
              </div>

              {totalVotes > 0 && (
                <div style={{
                  background: 'rgba(0,200,224,0.07)', border: '1px solid rgba(0,200,224,0.18)',
                  borderRadius: 10, padding: '10px 12px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>Terdepan</div>
                  <div style={{ fontFamily: 'var(--font-h)', fontWeight: 800, color: COLORS_HEX[topIdx % COLORS_HEX.length], fontSize: 15 }}>
                    {String.fromCharCode(65 + topIdx)}. "{validOptions[topIdx]}"
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    {displayVotes[topIdx]} suara · {Math.round((displayVotes[topIdx] / totalVotes) * 100)}%
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT — bar chart */}
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '32px 48px', overflow: 'auto',
              backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0,200,224,0.03) 0%, transparent 60%)',
            }}>
              <div style={{ width: '100%', maxWidth: 860 }}>
                {validOptions.map((opt, i) => {
                  const pct   = totalVotes > 0 ? Math.round((displayVotes[i] / totalVotes) * 100) : 0
                  const isTop = i === topIdx && totalVotes > 0
                  const hex   = COLORS_HEX[i % COLORS_HEX.length]
                  return (
                    <div key={i} style={{ marginBottom: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {isTop && <span style={{ fontSize: 20 }}>🏆</span>}
                          <div style={{
                            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                            background: hex + '22', color: hex, fontWeight: 900,
                            fontFamily: 'var(--font-h)', fontSize: 15,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>{String.fromCharCode(65 + i)}</div>
                          <span style={{
                            fontFamily: 'var(--font-h)', fontWeight: 700,
                            fontSize: 'clamp(14px, 2vw, 20px)', color: 'var(--white)',
                          }}>{opt}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexShrink: 0 }}>
                          <span style={{
                            fontFamily: 'var(--font-h)', fontWeight: 900,
                            fontSize: 'clamp(22px, 3.5vw, 38px)', color: hex, lineHeight: 1,
                          }}>{pct}%</span>
                          <span style={{ fontSize: 13, color: 'var(--muted)' }}>{displayVotes[i] ?? 0}</span>
                        </div>
                      </div>
                      <div style={{
                        background: 'rgba(255,255,255,0.06)', borderRadius: 99, height: 28, overflow: 'hidden',
                        border: isTop ? `1.5px solid ${hex}55` : '1px solid rgba(255,255,255,0.08)',
                        boxShadow: isTop ? `0 0 18px ${hex}30` : 'none',
                      }}>
                        <div style={{
                          height: '100%', width: `${pct}%`, borderRadius: 99,
                          background: `linear-gradient(90deg, ${hex}99, ${hex})`,
                          transition: 'width 0.6s cubic-bezier(0.34, 1.3, 0.64, 1)',
                          boxShadow: isTop ? `0 0 12px ${hex}88` : 'none',
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  // ── Present mode (non-live / hasil) ──────────────────────────────────────
  if (presentMode && !liveCode) {
    return (
      <div className="present-mode" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <button className="btn btn-outline btn-sm present-close" onClick={() => setPresentMode(false)}>✕ Tutup</button>
        <div style={{ maxWidth: 820, width: '100%' }}>
          <div style={{ fontFamily: 'var(--font-h)', fontSize: 28, fontWeight: 800, color: 'var(--teal)', textAlign: 'center', marginBottom: 10 }}>
            📊 Live Polling
          </div>
          <div style={{
            fontFamily: 'var(--font-h)', fontSize: 20, fontWeight: 700, lineHeight: 1.55,
            textAlign: 'center', marginBottom: 32, color: 'var(--white)',
            background: 'var(--card)', borderRadius: 'var(--r)', padding: '20px 28px',
            border: '1px solid var(--border)',
          }}>"{question}"</div>
          {validOptions.map((opt, i) => {
            const pct   = totalVotes > 0 ? Math.round((displayVotes[i] / totalVotes) * 100) : 0
            const isTop = i === topIdx && totalVotes > 0
            const hex   = COLORS_HEX[i % COLORS_HEX.length]
            return (
              <div key={i} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {isTop && <span style={{ fontSize: 18 }}>🏆</span>}
                    <div style={{
                      width: 32, height: 32, borderRadius: 6, flexShrink: 0,
                      background: hex + '22', color: hex, fontWeight: 800,
                      fontFamily: 'var(--font-h)', fontSize: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{String.fromCharCode(65 + i)}</div>
                    <span style={{ fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 17, color: 'var(--white)' }}>{opt}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-h)', fontWeight: 900, fontSize: 28, color: hex }}>{pct}%</span>
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>{displayVotes[i] ?? 0} suara</span>
                  </div>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.06)', borderRadius: 99, height: 20, overflow: 'hidden',
                  border: `1px solid ${isTop ? hex + '44' : 'rgba(255,255,255,0.07)'}`,
                }}>
                  <div style={{
                    height: '100%', width: `${pct}%`, borderRadius: 99,
                    background: `linear-gradient(90deg, ${hex}88, ${hex})`,
                    transition: 'width 0.5s cubic-bezier(0.34,1.3,0.64,1)',
                  }} />
                </div>
              </div>
            )
          })}
          <div style={{ textAlign: 'center', marginTop: 24, color: 'var(--muted)', fontSize: 13 }}>
            {totalVotes} total suara · {validOptions.length} opsi
          </div>
        </div>
      </div>
    )
  }

  // ── LivePanel (voting phase normal UI) ───────────────────────────────────
  const LivePanel = () => (
    <div className="card anim-fade-up" style={{
      border: '1.5px solid rgba(0,200,224,0.35)', boxShadow: '0 0 20px rgba(0,200,224,0.08)', marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <QRClickable
            value={joinUrl(liveCode)}
            size={200}
            onClick={() => setQrOpen(true)}
          />
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 12 }}>
            Klik untuk perbesar
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span className="phase-dot phase-dot-active" style={{ width: 10, height: 10 }} />
            <span style={{ fontFamily: 'var(--font-h)', fontWeight: 800, color: 'var(--teal)', fontSize: 13 }}>SESI LIVE AKTIF</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>KODE ROOM</div>
          <div style={{
            fontFamily: 'var(--font-h)', fontWeight: 900, fontSize: 34,
            letterSpacing: 6, color: 'var(--white)', lineHeight: 1, marginBottom: 8,
          }}>{liveCode}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12, wordBreak: 'break-all' }}>{joinUrl(liveCode)}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-teal btn-sm" onClick={() => setPresentMode(true)}>⛶ Buka Presentasi Slido</button>
            <button className="btn btn-outline btn-sm" onClick={copyLink}>{copied ? '✓ Tersalin!' : '📋 Salin Link'}</button>
            {!liveClosed
              ? <button className="btn btn-gold btn-sm" onClick={endLive}>🔒 Tutup Voting</button>
              : <span className="badge" style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', padding: '6px 12px' }}>🔒 Ditutup</span>
            }
          </div>
        </div>
        <div style={{ textAlign: 'center', minWidth: 64 }}>
          <div style={{ fontFamily: 'var(--font-h)', fontSize: 40, fontWeight: 900, color: 'var(--teal)', lineHeight: 1 }}>{totalVotes}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>suara masuk</div>
        </div>
      </div>
    </div>
  )

  const ResultsView = () => (
    <div>
      {validOptions.map((opt, i) => {
        const pct   = totalVotes > 0 ? Math.round((displayVotes[i] / totalVotes) * 100) : 0
        const isTop = i === topIdx && totalVotes > 0
        return (
          <div key={i} className="option-row" style={isTop ? { borderColor: 'rgba(0,200,224,0.4)', boxShadow: '0 0 12px var(--teal-glow)' } : {}}>
            <div className="option-row-bar" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${COLORS_HEX[i%COLORS_HEX.length]}22, ${COLORS_HEX[i%COLORS_HEX.length]}11` }} />
            <div className="option-row-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {isTop && <span style={{ fontSize: 18 }}>🏆</span>}
                <div style={{
                  width: 32, height: 32, borderRadius: 6,
                  background: COLORS_HEX[i%COLORS_HEX.length]+'22',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: COLORS_HEX[i%COLORS_HEX.length], fontWeight: 800, fontFamily: 'var(--font-h)', fontSize: 14, flexShrink: 0,
                }}>{String.fromCharCode(65 + i)}</div>
                <span className="option-row-text">{opt}</span>
              </div>
              <div className="option-row-votes">
                <span className="option-count">{displayVotes[i] ?? 0} suara</span>
                <span className="option-pct" style={{ color: COLORS[i%COLORS.length] }}>{pct}%</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <>
      <QRModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        value={joinUrl(liveCode ?? '')}
        code={liveCode}
        question={question}
        totalVotes={totalVotes}
      />

      <div className="page-hdr">
        <div className="page-hdr-top">
          <div className="page-hdr-icon">📊</div>
          <div>
            <h2>Live Polling</h2>
            <p>Kumpulkan suara kelas secara real-time untuk mengukur pendapat atau prior knowledge</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {['setup', 'voting', 'results'].map((p, i) => (
          <div key={p} className={`phase-chip ${phase === p ? 'phase-active' : 'phase-setup'}`}>
            <span className={`phase-dot ${phase === p ? 'phase-dot-active' : 'phase-dot-setup'}`} />
            {i + 1}. {p === 'setup' ? 'Setup' : p === 'voting' ? 'Voting' : 'Hasil'}
          </div>
        ))}
        {liveCode && (
          <span className="badge badge-teal" style={{ display: 'inline-flex', gap: 6, marginLeft: 'auto' }}>
            <span className="phase-dot phase-dot-active" /> LIVE · {liveCode}
          </span>
        )}
      </div>

      {/* SETUP */}
      {phase === 'setup' && (
        <div className="card anim-fade-up">
          <div className="form-group">
            <label className="form-label">Pertanyaan Polling</label>
            <textarea value={question} onChange={e => setQuestion(e.target.value)}
              placeholder="Contoh: Menurut Anda, faktor utama penyebab overfishing adalah..." rows={3} />
          </div>
          <div className="form-group">
            <label className="form-label">Opsi Jawaban</label>
            {options.map((opt, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <div style={{
                  width: 32, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: COLORS_HEX[i%COLORS_HEX.length]+'22', borderRadius: 6,
                  color: COLORS_HEX[i%COLORS_HEX.length], fontWeight: 800, fontFamily: 'var(--font-h)', fontSize: 14, flexShrink: 0,
                }}>{String.fromCharCode(65 + i)}</div>
                <input type="text" value={opt} onChange={e => updateOption(i, e.target.value)}
                  placeholder={`Opsi ${String.fromCharCode(65 + i)}`} style={{ flex: 1 }} />
                {options.length > 2 && (
                  <button className="btn btn-ghost btn-sm" onClick={() => removeOption(i)} style={{ padding: '6px 10px' }}>✕</button>
                )}
              </div>
            ))}
            {options.length < 6 && <button className="btn btn-outline btn-sm mt-8" onClick={addOption}>+ Tambah Opsi</button>}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-teal btn-lg" style={{ flex: 1 }} onClick={start}
              disabled={!question.trim() || validOptions.length < 2}>🖥️ Mulai Manual</button>
            <button className="btn btn-lg"
              style={{ flex: 1, background: 'linear-gradient(135deg,#ff4757,#c0392b)', color: '#fff', border: 'none',
                opacity: (!question.trim() || validOptions.length < 2 || liveLoading) ? 0.5 : 1 }}
              onClick={goLive} disabled={!question.trim() || validOptions.length < 2 || liveLoading}>
              {liveLoading ? '⏳ Membuat...' : '🔴 Go Live'}
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8, lineHeight: 1.6 }}>
            🔴 <strong style={{ color: 'var(--white)' }}>Go Live</strong> → layar presentasi Slido-style langsung terbuka · 
            🖥️ <strong style={{ color: 'var(--white)' }}>Manual</strong> → klik langsung di perangkat dosen
          </p>
        </div>
      )}

      {/* VOTING */}
      {phase === 'voting' && (
        <div className="anim-fade-up">
          {liveCode && <LivePanel />}
          <div className="card mb-16">
            <div className="badge badge-teal mb-12" style={{ display: 'inline-flex' }}>
              <span className="phase-dot phase-dot-active" />
              {liveCode ? `LIVE — ${totalVotes} suara masuk (real-time)` : `LIVE — ${totalVotes} suara masuk`}
            </div>
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 20, fontWeight: 700, lineHeight: 1.4 }}>{question}</div>
            <p className="text-muted fs-13 mt-12">
              {liveCode ? 'Mahasiswa voting dari HP via QR di atas. Suara masuk otomatis ↑' : 'Klik opsi untuk menambah suara:'}
            </p>
          </div>
          <div className="card">
            {!liveCode && (
              <div style={{ marginBottom: 16 }}>
                {validOptions.map((opt, i) => (
                  <div key={i} className="option-row clickable" onClick={() => vote(i)}>
                    <div className="option-row-content">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 6,
                          background: COLORS_HEX[i%COLORS_HEX.length]+'22',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: COLORS_HEX[i%COLORS_HEX.length], fontWeight: 800, fontFamily: 'var(--font-h)',
                        }}>{String.fromCharCode(65 + i)}</div>
                        <span className="option-row-text">{opt}</span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-h)', fontSize: 22, fontWeight: 800, color: COLORS[i%COLORS.length] }}>
                        {displayVotes[i] ?? 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {liveCode && (
              <div style={{ marginBottom: 16 }}>
                <div className="form-label mb-12">Distribusi Suara Real-time</div>
                <ResultsView />
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {!liveCode && <button className="btn btn-gold" onClick={() => setPhase('results')}>📊 Tampilkan Hasil</button>}
              {liveCode && liveClosed && <button className="btn btn-gold" onClick={() => setPhase('results')}>📊 Lihat Hasil</button>}
              {liveCode && !liveClosed && <button className="btn btn-teal" onClick={() => setPresentMode(true)}>⛶ Buka Presentasi Slido</button>}
              <button className="btn btn-outline" onClick={reset}>Reset</button>
            </div>
          </div>
        </div>
      )}

      {/* RESULTS */}
      {phase === 'results' && (
        <div className="anim-fade-up">
          {liveCode && (
            <div className="card mb-16">
              <span className="badge" style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', display: 'inline-flex', gap: 6 }}>
                🔒 Sesi Ditutup · {liveCode} · {totalVotes} suara
              </span>
            </div>
          )}
          <div className="card mb-16">
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{question}</div>
            <div style={{ marginBottom: 16 }}>
              <span className="badge badge-teal">{totalVotes} total suara</span>{' '}
              <span className="badge badge-gold">{validOptions.length} opsi</span>
              {totalVotes > 0 && <>{' '}<span className="badge badge-success">🏆 "{validOptions[topIdx]}"</span></>}
            </div>
            <ResultsView />
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-teal" onClick={() => setPresentMode(true)}>⛶ Mode Presentasi</button>
            {!liveCode && <button className="btn btn-outline" onClick={() => setPhase('voting')}>← Kembali Voting</button>}
            <button className="btn btn-ghost" onClick={reset}>🔄 Polling Baru</button>
          </div>
        </div>
      )}
    </>
  )
}

// ── StudentView (untuk halaman partisipan) ───────────────────────────
export function StudentView({ code }) {
  const [status, setStatus]   = useState(hasSubmitted(code) ? 'done' : 'loading')
  const { data: roomData, loading, error } = useListenRoom(code)
  const [picked, setPicked]   = useState(null)
  const [errMsg, setErrMsg]   = useState('')

  useEffect(() => {
    if (loading || status === 'done') return
    if (error || !roomData) { setStatus('error'); return }
    if (!roomData.active || roomData.phase === 'closed') { setStatus('closed'); return }
    if (status === 'loading') setStatus('input')
  }, [loading, roomData, error, status])

  const submit = async () => {
    if (picked === null) return
    setErrMsg('')
    setStatus('submitting')
    try {
      await submitVote(code, picked)
      markSubmitted(code)
      setStatus('done')
    } catch {
      setErrMsg('Gagal mengirim — periksa koneksi dan coba lagi.')
      setStatus('input')
    }
  }

  const options = roomData?.options
    ? Object.values(roomData.options)
    : []

  const COLORS_HEX = ['#00c8e0','#ffc847','#a78bfa','#fb923c','#34d399','#f472b6']

  const Wrap = ({ children }) => (
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

  if (status === 'loading') return (
    <Wrap>
      <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 48 }}>
        <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 16px' }} />
        Memuat polling...
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
          Kode <b style={{ color: 'var(--white)' }}>{code}</b> tidak valid atau sesi sudah berakhir.
        </div>
      </div>
    </Wrap>
  )

  if (status === 'closed') return (
    <Wrap>
      <div style={{
        textAlign: 'center', padding: '40px 24px',
        background: 'var(--card)', borderRadius: 'var(--r)',
        border: '1px solid rgba(255,200,71,0.3)',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
        <div style={{ fontFamily: 'var(--font-h)', fontWeight: 700, color: 'var(--gold)', marginBottom: 8 }}>
          Sesi Telah Ditutup
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
          Dosen sudah menutup polling ini.
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
          Suara Terkirim!
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
          Jawaban Anda sudah tercatat.<br />
          Tunggu hasil polling di layar kelas.
        </div>
      </div>
    </Wrap>
  )

  return (
    <Wrap>
      <div style={{
        background: 'linear-gradient(135deg,rgba(0,200,224,0.12),rgba(0,200,224,0.03))',
        border: '1px solid rgba(0,200,224,0.3)',
        borderRadius: 'var(--r)', padding: '18px 20px', marginBottom: 16,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 8 }}>
          📊 Pertanyaan Polling
        </div>
        <div style={{ fontFamily: 'var(--font-h)', fontSize: 16, fontWeight: 700, lineHeight: 1.6, color: 'var(--white)' }}>
          {roomData?.question}
        </div>
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '18px 20px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>
          Pilih satu jawaban
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
          {options.map((opt, i) => {
            const hex = COLORS_HEX[i % COLORS_HEX.length]
            const isSelected = picked === i
            return (
              <button
                key={i}
                onClick={() => setPicked(i)}
                disabled={status === 'submitting'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px', borderRadius: 'var(--r-sm)',
                  background: isSelected ? hex + '22' : 'var(--surface)',
                  border: `2px solid ${isSelected ? hex : 'var(--border)'}`,
                  color: 'var(--white)', cursor: 'pointer',
                  transition: 'all 0.15s', textAlign: 'left',
                  boxShadow: isSelected ? `0 0 12px ${hex}33` : 'none',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 6, flexShrink: 0,
                  background: hex + '33', color: hex,
                  fontFamily: 'var(--font-h)', fontWeight: 800, fontSize: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {String.fromCharCode(65 + i)}
                </div>
                <span style={{ fontWeight: isSelected ? 700 : 400, fontSize: 14 }}>{opt}</span>
                {isSelected && <span style={{ marginLeft: 'auto', color: hex, fontSize: 18 }}>✓</span>}
              </button>
            )
          })}
        </div>

        {errMsg && (
          <div style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 14,
            padding: '10px 14px', background: 'rgba(240,101,101,0.08)', borderRadius: 'var(--r-sm)' }}>
            ⚠️ {errMsg}
          </div>
        )}

        <button
          onClick={submit}
          disabled={picked === null || status === 'submitting'}
          style={{
            width: '100%', padding: '15px',
            borderRadius: 'var(--r-sm)',
            background: (picked !== null && status !== 'submitting') ? 'var(--teal)' : 'var(--surface)',
            color: (picked !== null && status !== 'submitting') ? '#000d14' : 'var(--muted)',
            border: '1px solid transparent',
            fontFamily: 'var(--font-h)', fontWeight: 800, fontSize: 15,
            cursor: (picked !== null && status !== 'submitting') ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}
        >
          {status === 'submitting' ? '⏳ Mengirim...' : '🗳️ Kirim Suara'}
        </button>
      </div>
    </Wrap>
  )
}

export default Polling
