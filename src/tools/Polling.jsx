import { useState, useMemo } from 'react'
import {
  generateRoomCode, joinUrl, qrUrl,
  createRoom, closeRoom,
  useListenRoom, countVotes,
} from '../hooks/useRoom'

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
    setLiveCode(null)
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
      setPhase('voting')
    } catch (e) {
      alert('Gagal membuat sesi live. Pastikan Firebase sudah dikonfigurasi.\n\n' + e.message)
    }
    setLiveLoading(false)
  }

  const endLive = async () => {
    if (liveCode) await closeRoom(liveCode)
    setPhase('results')
  }

  const copyLink = () => {
    navigator.clipboard.writeText(joinUrl(liveCode))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const LivePanel = () => (
    <div className="card anim-fade-up" style={{ border: '1.5px solid rgba(0,200,224,0.35)', boxShadow: '0 0 20px rgba(0,200,224,0.08)', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <img src={qrUrl(liveCode)} alt="QR" width={130} height={130}
            style={{ borderRadius: 10, border: '3px solid rgba(0,200,224,0.3)', display: 'block' }} />
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 5 }}>Scan to Join</div>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span className="phase-dot phase-dot-active" style={{ width: 10, height: 10 }} />
            <span style={{ fontFamily: 'var(--font-h)', fontWeight: 800, color: 'var(--teal)', fontSize: 13 }}>SESI LIVE AKTIF</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>KODE ROOM</div>
          <div style={{ fontFamily: 'var(--font-h)', fontWeight: 900, fontSize: 34, letterSpacing: 6, color: 'var(--white)', lineHeight: 1, marginBottom: 8 }}>{liveCode}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12, wordBreak: 'break-all' }}>{joinUrl(liveCode)}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-outline btn-sm" onClick={copyLink}>{copied ? '✓ Tersalin!' : '📋 Salin Link'}</button>
            {phase === 'voting' && <button className="btn btn-gold btn-sm" onClick={endLive}>🔒 Tutup Voting</button>}
          </div>
        </div>
        <div style={{ textAlign: 'center', minWidth: 60 }}>
          <div style={{ fontFamily: 'var(--font-h)', fontSize: 38, fontWeight: 900, color: 'var(--teal)', lineHeight: 1 }}>{totalVotes}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>suara masuk</div>
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
      {presentMode && phase === 'results' && (
        <div className="present-mode">
          <button className="btn btn-outline btn-sm present-close" onClick={() => setPresentMode(false)}>✕ Tutup</button>
          <ResultsView isPresent />
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
              {!liveCode && <button className="btn btn-gold" onClick={() => setPhase('results')}>📊 Tampilkan Hasil</button>}
              {liveCode  && <button className="btn btn-gold" onClick={endLive}>🔒 Tutup & Lihat Hasil</button>}
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
