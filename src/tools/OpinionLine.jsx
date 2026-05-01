import { useState, useMemo, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import QRModal, { QRClickable } from '../components/QRModal'
import {
  generateRoomCode, joinUrl,
  createRoom, closeRoom,
  useListenRoom, countOpinions,
  getRoom, submitOpinion,
  hasSubmitted, markSubmitted,
} from '../hooks/useRoom'

function OpinionLine() {
  const [phase, setPhase]           = useState('setup')
  const [statement, setStatement]   = useState('')
  const [votes, setVotes]           = useState({ setuju: 0, netral: 0, tidak: 0 })
  const [hasVoted, setHasVoted]     = useState(false)
  const [selectedVote, setSelectedVote] = useState(null)
  const [presentMode, setPresentMode] = useState(false)
  const [revealed, setRevealed]     = useState(false)
  const [reveal, setReveal]         = useState({ correct: null, explanation: '' })
  const [correctInput, setCorrectInput] = useState('')
  const [explInput, setExplInput]   = useState('')

  const [liveCode, setLiveCode]       = useState(null)
  const [liveLoading, setLiveLoading] = useState(false)
  const [copied, setCopied]           = useState(false)
  const [liveClosed, setLiveClosed]   = useState(false)
  const [qrOpen, setQrOpen]           = useState(false)

  const { data: roomData } = useListenRoom(liveCode)

  const liveOpinions = useMemo(() => {
    if (!liveCode || !roomData) return null
    return countOpinions(roomData)
  }, [liveCode, roomData])

  const displayVotes = liveOpinions ?? votes

  const total = displayVotes.setuju + displayVotes.netral + displayVotes.tidak
  const pct   = (v) => total > 0 ? Math.round((v / total) * 100) : 0

  const doVote = (side) => {
    if (hasVoted || liveCode) return
    setVotes(v => ({ ...v, [side]: v[side] + 1 }))
    setSelectedVote(side)
    setHasVoted(true)
  }

  const goLive = async () => {
    if (!statement.trim()) return
    setLiveLoading(true)
    const code = generateRoomCode()
    try {
      await createRoom(code, { tool: 'opinion', statement })
      setVotes({ setuju: 0, netral: 0, tidak: 0 })
      setLiveCode(code)
      setLiveClosed(false)
      setPhase('voting')
    } catch (e) {
      alert('Gagal membuat sesi live. Cek konfigurasi Firebase.\n\n' + e.message)
    }
    setLiveLoading(false)
  }

  const endLive = async () => {
    if (liveCode) await closeRoom(liveCode)
    setLiveClosed(true)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(joinUrl(liveCode))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const reset = () => {
    setPhase('setup'); setVotes({ setuju: 0, netral: 0, tidak: 0 })
    setHasVoted(false); setSelectedVote(null); setRevealed(false)
    setStatement(''); setReveal({ correct: null, explanation: '' })
    setCorrectInput(''); setExplInput('')
    setLiveCode(null); setLiveClosed(false)
  }

  /* ── QR Panel (Live mode) ─────────────────────────── */
  const LivePanel = () => (
    <div className="card anim-fade-up" style={{
      border: '1.5px solid rgba(0,200,224,0.35)',
      boxShadow: '0 0 20px rgba(0,200,224,0.08)',
      marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>

        {/* QR besar — CLICKABLE */}
        <div style={{ textAlign: 'center' }}>
          <QRClickable
            value={joinUrl(liveCode)}
            size={200}
            onClick={() => setQrOpen(true)}
          />
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 12 }}>
            Klik QR untuk perbesar
          </div>
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
            {!liveClosed
              ? <button className="btn btn-gold btn-sm" onClick={endLive}>🔒 Tutup Voting</button>
              : <span className="badge" style={{ background:'rgba(248,113,113,0.15)', color:'#f87171', border:'1px solid rgba(248,113,113,0.3)', padding:'6px 12px' }}>
                  🔒 Ditutup
                </span>
            }
          </div>
        </div>

        {/* Total suara */}
        <div style={{ textAlign: 'center', minWidth: 64 }}>
          <div style={{ fontFamily: 'var(--font-h)', fontSize: 40, fontWeight: 900, color: 'var(--teal)', lineHeight: 1 }}>
            {total}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>suara masuk</div>
        </div>
      </div>
    </div>
  )

  /* ── Results view ─────────────────────────────────── */
  const ResultsView = ({ big }) => (
    <div>
      <div style={{ display: 'flex', gap: big ? 24 : 14 }}>
        {[
          { key: 'setuju', label: 'Setuju',       emoji: '✅', cls: 'setuju' },
          { key: 'netral', label: 'Netral',        emoji: '🤔', cls: 'netral' },
          { key: 'tidak',  label: 'Tidak Setuju',  emoji: '❌', cls: 'tidak'  },
        ].map(({ key, label, emoji, cls }) => (
          <div key={key} className={`opinion-col ${cls}`} style={{ flex: 1 }}>
            <div style={{ fontSize: big ? 32 : 24 }}>{emoji}</div>
            <div className="opinion-col-count" style={{ fontSize: big ? 68 : 48 }}>
              {displayVotes[key]}
            </div>
            <div className="opinion-label">{label}</div>
            <div style={{
              marginTop: 6,
              fontFamily: 'var(--font-h)', fontSize: big ? 20 : 17,
              fontWeight: 700, color: 'var(--muted)',
            }}>
              {pct(displayVotes[key])}%
            </div>
            {!big && (
              <div className="progress-bar-wrap mt-8">
                <div
                  className={`progress-bar-fill ${cls === 'setuju' ? '' : cls === 'tidak' ? 'danger' : 'gold'}`}
                  style={{ width: `${pct(displayVotes[key])}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 14, color: 'var(--muted)', fontSize: 13 }}>
        {total} total suara
      </div>
    </div>
  )

  return (
    <>
      {/* ── QR MODAL ────────────────────────────────────── */}
      <QRModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        value={joinUrl(liveCode ?? '')}
        code={liveCode}
        question={statement}
        totalVotes={total}
      />

      {/* ── PRESENT MODE ── */}
      {presentMode && (
        <div className="present-mode" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <button className="btn btn-outline btn-sm present-close" onClick={() => setPresentMode(false)}>
            ✕ Tutup
          </button>
          <div style={{ maxWidth: 840, width: '100%', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 28, fontWeight: 800, color: 'var(--teal)', marginBottom: 16 }}>
              📍 Opinion Line
            </div>

            {liveCode && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 28, marginBottom: 28, flexWrap: 'wrap' }}>
                {/* QR in present mode — CLICKABLE */}
                <QRClickable
                  value={joinUrl(liveCode)}
                  size={190}
                  onClick={() => setQrOpen(true)}
                />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Kode Room</div>
                  <div style={{ fontFamily: 'var(--font-h)', fontWeight: 900, fontSize: 34, letterSpacing: 7, color: 'var(--teal)', marginBottom: 10 }}>
                    {liveCode}
                  </div>
                  <span className="badge badge-teal" style={{ display: 'inline-flex' }}>
                    <span className="phase-dot phase-dot-active" /> {total} suara masuk
                  </span>
                </div>
              </div>
            )}

            <div style={{
              fontFamily: 'var(--font-h)', fontSize: 22, fontWeight: 700, lineHeight: 1.55,
              marginBottom: 32, color: 'var(--white)',
              background: 'var(--card)', borderRadius: 'var(--r)', padding: '24px',
              border: '1px solid var(--border)',
            }}>
              "{statement}"
            </div>

            <ResultsView big />

            {revealed && reveal.explanation && (
              <div className="reveal-box mt-24" style={reveal.correct === 'tidak' ? { borderColor: 'rgba(240,101,101,0.3)' } : {}}>
                <div style={{ fontWeight: 700, color: 'var(--teal)', marginBottom: 8 }}>💡 Penjelasan Dosen</div>
                <div style={{ fontSize: 15, lineHeight: 1.7 }}>{reveal.explanation}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PAGE HEADER ── */}
      <div className="page-hdr">
        <div className="page-hdr-top">
          <div className="page-hdr-icon">📍</div>
          <div>
            <h2>Opinion Line</h2>
            <p>Peta posisi pendapat kelas — memunculkan konflik kognitif dan memancing diskusi</p>
          </div>
        </div>
      </div>

      {/* ── SETUP ── */}
      {phase === 'setup' && (
        <div className="card anim-fade-up">
          <div className="form-group">
            <label className="form-label">Pernyataan</label>
            <textarea value={statement} onChange={e => setStatement(e.target.value)}
              placeholder='Contoh: "CPUE selalu mencerminkan kelimpahan stok ikan yang sebenarnya."'
              rows={3} />
          </div>
          <div style={{
            background: 'var(--surface)', borderRadius: 'var(--r-sm)', padding: '14px 16px',
            marginBottom: 20, fontSize: 13, color: 'var(--muted)', lineHeight: 1.7,
            border: '1px solid var(--border)',
          }}>
            💡 <strong style={{ color: 'var(--white)' }}>Tips:</strong> Gunakan pernyataan yang memiliki nuansa, bukan fakta biner.
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="btn btn-teal btn-lg" style={{ flex: 1 }}
              onClick={() => setPhase('voting')} disabled={!statement.trim()}
            >
              🖥️ Mulai Manual
            </button>
            <button
              className="btn btn-lg"
              style={{
                flex: 1,
                background: 'linear-gradient(135deg,#ff4757,#c0392b)',
                color: '#fff', border: 'none',
                opacity: (!statement.trim() || liveLoading) ? 0.5 : 1,
              }}
              onClick={goLive} disabled={!statement.trim() || liveLoading}
            >
              {liveLoading ? '⏳ Membuat...' : '🔴 Go Live'}
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 9, lineHeight: 1.6 }}>
            🔴 <strong style={{ color: 'var(--white)' }}>Go Live</strong> → mahasiswa vote dari HP via QR · 
            🖥️ <strong style={{ color: 'var(--white)' }}>Manual</strong> → klik langsung di perangkat dosen
          </p>
        </div>
      )}

      {/* ── VOTING ── */}
      {phase === 'voting' && (
        <div className="anim-fade-up">
          {liveCode && <LivePanel />}

          <div className="card mb-16">
            <div className="badge badge-teal mb-12" style={{ display: 'inline-flex' }}>
              <span className="phase-dot phase-dot-active" />
              {liveCode ? `LIVE — ${total} suara masuk (real-time)` : `LIVE — ${total} suara masuk`}
            </div>
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 20, fontWeight: 700, lineHeight: 1.55, marginBottom: 20 }}>
              "{statement}"
            </div>

            {!liveCode && (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {[
                  { key: 'setuju', label: '✅ Setuju' },
                  { key: 'netral', label: '🤔 Netral' },
                  { key: 'tidak',  label: '❌ Tidak Setuju' },
                ].map(({ key, label }) => (
                  <button key={key} onClick={() => doVote(key)} disabled={hasVoted}
                    className={`btn btn-lg ${selectedVote === key ? 'btn-teal' : 'btn-outline'}`}
                    style={{ flex: 1, minWidth: 120 }}>
                    {label}
                  </button>
                ))}
              </div>
            )}
            {!liveCode && hasVoted && (
              <div style={{ marginTop: 12, fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>
                ✓ Suara Anda tercatat
              </div>
            )}
          </div>

          <div className="card mb-16">
            <div className="form-label mb-16">Distribusi Suara Real-time</div>
            <ResultsView />
          </div>

          <div className="card mb-16">
            <div className="form-label mb-12">Ungkap Posisi Dosen (Opsional)</div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              {['setuju', 'netral', 'tidak'].map(k => (
                <button key={k} onClick={() => setCorrectInput(k)}
                  className={`btn btn-sm ${correctInput === k ? 'btn-teal' : 'btn-outline'}`}>
                  {k === 'setuju' ? '✅ Setuju' : k === 'netral' ? '🤔 Netral' : '❌ Tidak Setuju'}
                </button>
              ))}
            </div>
            <textarea value={explInput} onChange={e => setExplInput(e.target.value)}
              placeholder="Penjelasan posisi / nuansa jawaban ilmiah..." rows={3} style={{ marginBottom: 10 }} />
            <button
              className="btn btn-gold"
              onClick={() => { setReveal({ correct: correctInput, explanation: explInput }); setRevealed(true) }}
              disabled={!explInput.trim()}
            >
              💡 Ungkap Penjelasan
            </button>
          </div>

          {revealed && (
            <div className="reveal-box mb-16 anim-pop">
              <div style={{ fontWeight: 700, color: 'var(--success)', marginBottom: 8, fontSize: 14 }}>
                💡 Penjelasan Dosen
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.7 }}>{reveal.explanation}</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-teal" onClick={() => setPresentMode(true)}>⛶ Mode Presentasi</button>
            <button className="btn btn-ghost" onClick={reset}>🔄 Mulai Baru</button>
          </div>
        </div>
      )}
    </>
  )
}

/* ── StudentView (ditambahkan dari patch) ──────────── */
export function StudentView({ code }) {
  const [status, setStatus]   = useState('loading')
  const [session, setSession] = useState(null)
  const [picked, setPicked]   = useState(null)  // 'setuju' | 'netral' | 'tidak'
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

  const submit = async () => {
    if (!picked) return
    setErrMsg('')
    setStatus('submitting')
    try {
      await submitOpinion(code, picked)
      markSubmitted(code)
      setStatus('done')
    } catch {
      setErrMsg('Gagal mengirim — periksa koneksi dan coba lagi.')
      setStatus('input')
    }
  }

  const OPTIONS = [
    { key: 'setuju', label: 'Setuju',      emoji: '✅', color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.35)' },
    { key: 'netral', label: 'Netral',      emoji: '🤔', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.35)'  },
    { key: 'tidak',  label: 'Tidak Setuju',emoji: '❌', color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.35)' },
  ]

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
          Kode <b style={{ color: 'var(--white)' }}>{code}</b> tidak valid atau sesi sudah berakhir.
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
        <div style={{ fontSize: 56, marginBottom: 14 }}>
          {OPTIONS.find(o => o.key === picked)?.emoji ?? '✅'}
        </div>
        <div style={{ fontFamily: 'var(--font-h)', fontSize: 22, fontWeight: 800, color: 'var(--success)', marginBottom: 10 }}>
          Pendapat Terkirim!
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 20 }}>
          Pilihan Anda sudah tercatat.<br />
          Lihat distribusi pendapat kelas di layar bersama.
        </div>
        {session?.statement && (
          <div style={{
            padding: '14px 16px', background: 'var(--surface)',
            borderRadius: 'var(--r-sm)', fontSize: 13,
            color: 'var(--muted)', lineHeight: 1.6, textAlign: 'left',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
              Pernyataan
            </div>
            {session.statement}
          </div>
        )}
      </div>
    </Wrap>
  )

  return (
    <Wrap>
      {/* Statement */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(0,200,224,0.12),rgba(0,200,224,0.03))',
        border: '1px solid rgba(0,200,224,0.3)',
        borderRadius: 'var(--r)', padding: '20px 22px', marginBottom: 16,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 10 }}>
          📍 Pernyataan — Apa pendapat Anda?
        </div>
        <div style={{ fontFamily: 'var(--font-h)', fontSize: 17, fontWeight: 700, lineHeight: 1.6, color: 'var(--white)' }}>
          "{session?.statement}"
        </div>
      </div>

      {/* Opinion buttons */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '20px 22px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>
          Pilih posisi Anda
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {OPTIONS.map(({ key, label, emoji, color, bg, border }) => {
            const isSelected = picked === key
            return (
              <button
                key={key}
                onClick={() => setPicked(key)}
                disabled={status === 'submitting'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '18px 20px', borderRadius: 'var(--r-sm)',
                  background: isSelected ? bg : 'var(--surface)',
                  border: `2px solid ${isSelected ? border.replace('0.35','0.7') : 'var(--border)'}`,
                  color: 'var(--white)', cursor: 'pointer',
                  transition: 'all 0.15s', textAlign: 'left',
                  boxShadow: isSelected ? `0 0 16px ${color}22` : 'none',
                }}
              >
                <span style={{ fontSize: 28 }}>{emoji}</span>
                <span style={{
                  fontFamily: 'var(--font-h)', fontWeight: isSelected ? 800 : 600,
                  fontSize: 16, color: isSelected ? color : 'var(--white)',
                }}>
                  {label}
                </span>
                {isSelected && (
                  <span style={{ marginLeft: 'auto', color, fontSize: 20 }}>✓</span>
                )}
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
          disabled={!picked || status === 'submitting'}
          style={{
            width: '100%', padding: '15px', borderRadius: 'var(--r-sm)',
            background: (picked && status !== 'submitting') ? 'var(--teal)' : 'var(--surface)',
            color: (picked && status !== 'submitting') ? '#000d14' : 'var(--muted)',
            border: '1px solid transparent',
            fontFamily: 'var(--font-h)', fontWeight: 800, fontSize: 15,
            cursor: (picked && status !== 'submitting') ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}
        >
          {status === 'submitting' ? '⏳ Mengirim...' : '📍 Kirim Pendapat'}
        </button>
      </div>
    </Wrap>
  )
}

export default OpinionLine
