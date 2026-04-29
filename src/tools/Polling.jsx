import { useState, useMemo } from 'react'
import {
  generateRoomCode, joinUrl, qrUrl,
  createRoom, closeRoom,
  useListenRoom, countVotes,
} from '../hooks/useRoom'
import { QRCodeSVG } from 'qrcode.react'

const COLORS = ['var(--teal)', 'var(--gold)', '#a78bfa', '#fb923c', '#34d399', '#f472b6']

function Polling() {
  const [phase, setPhase]             = useState('setup')
  const [question, setQuestion]       = useState('')
  const [options, setOptions]         = useState(['', ''])
  const [votes, setVotes]             = useState([])
  const [presentMode, setPresentMode] = useState(false)

  // Live mode state
  const [liveCode, setLiveCode]       = useState(null)
  const [liveLoading, setLiveLoading] = useState(false)
  const [copied, setCopied]           = useState(false)
  const [liveClosed, setLiveClosed]   = useState(false)   // ← BARU

  const { data: roomData } = useListenRoom(liveCode)

  const validOptions = options.filter(o => o.trim())

  const liveVotes = useMemo(() => {
    if (!liveCode || !roomData) return null
    return countVotes(roomData, validOptions.length)
  }, [liveCode, roomData, validOptions.length])

  const displayVotes = liveVotes ?? votes
  const totalVotes   = displayVotes.reduce((a, b) => a + b, 0)

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
    setLiveCode(null); setLiveClosed(false)   // ← reset liveClosed juga
  }

  const goLive = async () => {
    if (!question.trim() || validOptions.length < 2) return
    setLiveLoading(true)
    const code = generateRoomCode()
    const optObject = {}
    validOptions.forEach((o, i) => { optObject[i] = o })
    try {
      await createRoom(code, { tool: 'polling', question, options: optObject })
      setVotes(new Array(options.length).fill(0))
      setLiveCode(code)
      setLiveClosed(false)
      setPhase('voting')
    } catch (e) {
      alert('Gagal membuat sesi live. Pastikan Firebase sudah dikonfigurasi.\n\n' + e.message)
    }
    setLiveLoading(false)
  }

  // ↓ DIUBAH: endLive tidak langsung ganti phase, hanya tutup room
  const endLive = async () => {
    if (liveCode) await closeRoom(liveCode)
    setLiveClosed(true)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(joinUrl(liveCode))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ─── LivePanel (mengikuti gaya OpinionLine) ───────────────────────────────
  const LivePanel = () => (
    <div className="card anim-fade-up" style={{
      border: '1.5px solid rgba(0,200,224,0.35)',
      boxShadow: '0 0 20px rgba(0,200,224,0.08)',
      marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>

        {/* QR besar — sama persis dengan OpinionLine */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: '#fff',
            padding: '11px',
            borderRadius: '14px',
            border: '3px solid rgba(0,200,224,0.28)',
            display: 'inline-block',
            boxShadow: '0 0 28px rgba(0,200,224,0.22)',
          }}>
            <QRCodeSVG value={joinUrl(liveCode)} size={200} level="H" />
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>Scan untuk bergabung</div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span className="phase-dot phase-dot-active" style={{ width: 10, height: 10 }} />
            <span style={{ fontFamily: 'var(--font-h)', fontWeight: 800, color: 'var(--teal)', fontSize: 13 }}>
              SESI LIVE AKTIF
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>KODE ROOM</div>
          <div style={{
            fontFamily: 'var(--font-h)', fontWeight: 900, fontSize: 34,
            letterSpacing: 6, color: 'var(--white)', lineHeight: 1, marginBottom: 8,
          }}>{liveCode}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12, wordBreak: 'break-all' }}>
            {joinUrl(liveCode)}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-outline btn-sm" onClick={copyLink}>
              {copied ? '✓ Tersalin!' : '📋 Salin Link'}
            </button>
            {/* ↓ DIUBAH: pakai liveClosed seperti OpinionLine */}
            {!liveClosed
              ? <button className="btn btn-gold btn-sm" onClick={endLive}>🔒 Tutup Voting</button>
              : <span className="badge" style={{
                  background: 'rgba(248,113,113,0.15)', color: '#f87171',
                  border: '1px solid rgba(248,113,113,0.3)', padding: '6px 12px',
                }}>🔒 Ditutup</span>
            }
          </div>
        </div>

        {/* Total suara */}
        <div style={{ textAlign: 'center', minWidth: 64 }}>
          <div style={{
            fontFamily: 'var(--font-h)', fontSize: 40, fontWeight: 900,
            color: 'var(--teal)', lineHeight: 1,
          }}>{totalVotes}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>suara masuk</div>
        </div>

      </div>
    </div>
  )

  const ResultsView = ({ isPresent }) => (
    <div style={isPresent ? { padding: '40px', maxWidth: 800, margin: '0 auto', width: '100%' } : {}}>
      {isPresent && (
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-h)', fontSize: 28, fontWeight: 800, color: 'var(--teal)', marginBottom: 12 }}>📊 Hasil Polling</div>
          <div style={{ fontFamily: 'var(--font-h)', fontSize: 26, fontWeight: 700, color: 'var(--white)', lineHeight: 1.4 }}>{question}</div>
        </div>
      )}
      <div className="stat-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 24 }}>
        <div className="stat-chip"><div className="stat-chip-num">{totalVotes}</div><div className="stat-chip-label">Total Suara</div></div>
        <div className="stat-chip"><div className="stat-chip-num" style={{ color: 'var(--gold)' }}>{validOptions.length}</div><div className="stat-chip-label">Opsi</div></div>
      </div>
      {validOptions.map((opt, i) => {
        const pct   = totalVotes > 0 ? Math.round((displayVotes[i] / totalVotes) * 100) : 0
        const isTop = displayVotes[i] === Math.max(...displayVotes) && totalVotes > 0
        return (
          <div key={i} className="option-row" style={isTop ? { borderColor: 'rgba(0,200,224,0.4)', boxShadow: '0 0 12px var(--teal-glow)' } : {}}>
            <div className="option-row-bar" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${COLORS[i%COLORS.length]}22, ${COLORS[i%COLORS.length]}11)` }} />
            <div className="option-row-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {isTop && <span style={{ fontSize: 18 }}>🏆</span>}
                <span className="option-row-text" style={{ fontSize: isPresent ? 17 : 14 }}>{opt}</span>
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
      {/* ─── Present Mode (mengikuti gaya OpinionLine) ─────────────────────── */}
      {presentMode && phase === 'results' && (
        <div className="present-mode" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <button className="btn btn-outline btn-sm present-close" onClick={() => setPresentMode(false)}>
            ✕ Tutup
          </button>
          <div style={{ maxWidth: 840, width: '100%', textAlign: 'center' }}>
            <div style={{
              fontFamily: 'var(--font-h)', fontSize: 28, fontWeight: 800,
              color: 'var(--teal)', marginBottom: 16,
            }}>📊 Live Polling</div>

            {/* QR di present mode saat live — BARU, mengikuti OpinionLine */}
            {liveCode && (
              <div style={{
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                gap: 28, marginBottom: 28, flexWrap: 'wrap',
              }}>
                <div style={{
                  background: '#fff', padding: '11px', borderRadius: '14px',
                  display: 'inline-block',
                  boxShadow: '0 0 32px rgba(0,200,224,0.3)',
                }}>
                  <QRCodeSVG value={joinUrl(liveCode)} size={190} level="H" />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Kode Room</div>
                  <div style={{
                    fontFamily: 'var(--font-h)', fontWeight: 900, fontSize: 34,
                    letterSpacing: 7, color: 'var(--teal)', marginBottom: 10,
                  }}>{liveCode}</div>
                  <span className="badge badge-teal" style={{ display: 'inline-flex' }}>
                    <span className="phase-dot phase-dot-active" /> {totalVotes} suara masuk
                  </span>
                </div>
              </div>
            )}

            {/* Pertanyaan */}
            <div style={{
              fontFamily: 'var(--font-h)', fontSize: 22, fontWeight: 700, lineHeight: 1.55,
              marginBottom: 32, color: 'var(--white)',
              background: 'var(--card)', borderRadius: 'var(--r)', padding: '24px',
              border: '1px solid var(--border)',
            }}>"{question}"</div>

            <ResultsView isPresent />
          </div>
        </div>
      )}

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
                <div style={{ width: 32, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS[i%COLORS.length]+'22', borderRadius: 6, color: COLORS[i%COLORS.length], fontWeight: 800, fontFamily: 'var(--font-h)', fontSize: 14, flexShrink: 0 }}>
                  {String.fromCharCode(65+i)}
                </div>
                <input type="text" value={opt} onChange={e => updateOption(i, e.target.value)} placeholder={`Opsi ${String.fromCharCode(65+i)}`} style={{ flex: 1 }} />
                {options.length > 2 && <button className="btn btn-ghost btn-sm" onClick={() => removeOption(i)} style={{ padding: '6px 10px' }}>✕</button>}
              </div>
            ))}
            {options.length < 6 && <button className="btn btn-outline btn-sm mt-8" onClick={addOption}>+ Tambah Opsi</button>}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-teal btn-lg" style={{ flex: 1 }} onClick={start}
              disabled={!question.trim() || validOptions.length < 2}>🖥️ Mulai Manual</button>
            <button className="btn btn-lg" style={{ flex: 1, background: 'linear-gradient(135deg,#ff4757,#c0392b)', color:'#fff', border:'none', opacity: (!question.trim() || validOptions.length < 2 || liveLoading) ? 0.5 : 1 }}
              onClick={goLive} disabled={!question.trim() || validOptions.length < 2 || liveLoading}>
              {liveLoading ? '⏳ Membuat...' : '🔴 Go Live'}
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
            🔴 Go Live → mahasiswa vote dari HP via QR / link · 🖥️ Manual → klik langsung di perangkat dosen
          </p>
        </div>
      )}

      {phase === 'voting' && (
        <div className="anim-fade-up">
          {liveCode && <LivePanel />}
          <div className="card mb-16">
            <div style={{ marginBottom: 16 }}>
              <div className="badge badge-teal mb-12" style={{ display: 'inline-flex' }}>
                <span className="phase-dot phase-dot-active" />
                {liveCode ? `LIVE — ${totalVotes} suara masuk (real-time)` : `LIVE — ${totalVotes} suara masuk`}
              </div>
              <div style={{ fontFamily: 'var(--font-h)', fontSize: 20, fontWeight: 700, lineHeight: 1.4 }}>{question}</div>
            </div>
            <p className="text-muted fs-13">
              {liveCode ? 'Mahasiswa voting dari HP via QR di atas. Suara masuk otomatis ↑' : 'Klik opsi untuk menambah suara (atau mahasiswa input langsung):'}
            </p>
          </div>
          <div className="card">
            {validOptions.map((opt, i) => (
              <div key={i} className={`option-row ${!liveCode ? 'clickable' : ''}`}
                onClick={() => vote(i)}
                style={{ cursor: liveCode ? 'default' : 'pointer', borderColor: 'var(--border)' }}>
                <div className="option-row-content">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width:32, height:32, borderRadius:6, background:COLORS[i%COLORS.length]+'22', display:'flex', alignItems:'center', justifyContent:'center', color:COLORS[i%COLORS.length], fontWeight:800, fontFamily:'var(--font-h)' }}>
                      {String.fromCharCode(65+i)}
                    </div>
                    <span className="option-row-text">{opt}</span>
                  </div>
                  <span style={{ fontFamily:'var(--font-h)', fontSize:22, fontWeight:800, color:COLORS[i%COLORS.length] }}>{displayVotes[i] ?? 0}</span>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
              {/* ↓ DIUBAH: tombol "Lihat Hasil" muncul di dua kondisi */}
              {!liveCode && <button className="btn btn-gold" onClick={() => setPhase('results')}>📊 Tampilkan Hasil</button>}
              {liveCode && liveClosed && <button className="btn btn-gold" onClick={() => setPhase('results')}>📊 Lihat Hasil</button>}
              {liveCode && !liveClosed && <button className="btn btn-gold" onClick={async () => { await endLive(); setPhase('results'); setPresentMode(true) }}>⛶ Mode Presentasi</button>}
              <button className="btn btn-outline" onClick={reset}>Reset</button>
            </div>
          </div>
        </div>
      )}

      {phase === 'results' && (
        <div className="anim-fade-up">
          {liveCode && (
            <div className="card mb-16">
              <span className="badge" style={{ background:'rgba(248,113,113,0.15)', color:'#f87171', border:'1px solid rgba(248,113,113,0.3)', display:'inline-flex', gap:6 }}>
                🔒 Sesi Ditutup · {liveCode} · {totalVotes} suara
              </span>
            </div>
          )}
          <div className="card mb-16">
            <div style={{ fontFamily:'var(--font-h)', fontSize:20, fontWeight:700, marginBottom:16 }}>{question}</div>
            <ResultsView />
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <button className="btn btn-teal" onClick={() => setPresentMode(true)}>⛶ Mode Presentasi</button>
            {!liveCode && <button className="btn btn-outline" onClick={() => setPhase('voting')}>← Kembali Voting</button>}
            <button className="btn btn-ghost" onClick={reset}>🔄 Polling Baru</button>
          </div>
        </div>
      )}
    </>
  )
}

export default Polling
