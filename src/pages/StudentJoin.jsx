import { useState, useEffect, useMemo } from 'react'
import {
  useListenRoom,
  submitVote,
  submitWords,
  submitOpinion,
  hasSubmitted,
  markSubmitted,
} from '../hooks/useRoom'

// ─── Komponen polling untuk mahasiswa ────────────────────────────────────────
function StudentPolling({ room, code }) {
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(hasSubmitted(code))
  const [loading, setLoading] = useState(false)

  const options = room.options || {}
  const optList = Array.isArray(options) ? options : Object.values(options)
  const COLORS = ['#00c8e0', '#f5c400', '#a78bfa', '#fb923c', '#34d399', '#f472b6']

  const doVote = async (idx) => {
    if (submitted || room.phase !== 'live') return
    setSelected(idx)
    setLoading(true)
    try {
      await submitVote(code, idx)
      markSubmitted(code)
      setSubmitted(true)
    } catch (e) {
      alert('Gagal mengirim suara. Coba lagi.')
    }
    setLoading(false)
  }

  if (room.phase === 'closed') return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>🔒</div>
      <div style={{ fontFamily: 'var(--font-h)', fontSize: 20, fontWeight: 800, color: 'var(--teal)', marginBottom: 8 }}>Sesi Telah Ditutup</div>
      <div style={{ color: 'var(--muted)', fontSize: 14 }}>Dosen sudah menutup polling ini.</div>
    </div>
  )

  if (submitted) return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
      <div style={{ fontFamily: 'var(--font-h)', fontSize: 22, fontWeight: 800, color: 'var(--teal)', marginBottom: 8 }}>Suaramu Masuk!</div>
      <div style={{ color: 'var(--muted)', fontSize: 14 }}>
        Pilihanmu: <span style={{ color: COLORS[selected ?? 0], fontWeight: 700 }}>
          {String.fromCharCode(65 + (selected ?? 0))}. {optList[selected ?? 0]}
        </span>
      </div>
      <div style={{ marginTop: 20, color: 'var(--muted)', fontSize: 13 }}>
        Tunggu dosen menampilkan hasil...
      </div>
    </div>
  )

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="badge badge-teal mb-12" style={{ display: 'inline-flex' }}>
          <span className="phase-dot phase-dot-active" /> LIVE
        </div>
        <div style={{ fontFamily: 'var(--font-h)', fontSize: 18, fontWeight: 700, lineHeight: 1.5 }}>
          {room.question}
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>Pilih satu jawaban:</div>
        {optList.map((opt, i) => (
          <button
            key={i}
            disabled={loading}
            onClick={() => doVote(i)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%',
              padding: '14px 16px', marginBottom: 10, borderRadius: 10,
              background: selected === i ? COLORS[i % COLORS.length] + '22' : 'var(--surface)',
              border: `2px solid ${selected === i ? COLORS[i % COLORS.length] : 'var(--border)'}`,
              cursor: loading ? 'wait' : 'pointer', textAlign: 'left', transition: 'all 0.15s'
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 6, flexShrink: 0, fontWeight: 800,
              fontFamily: 'var(--font-h)', fontSize: 13, display: 'flex', alignItems: 'center',
              justifyContent: 'center',
              background: COLORS[i % COLORS.length] + '22', color: COLORS[i % COLORS.length]
            }}>
              {String.fromCharCode(65 + i)}
            </div>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--white)' }}>{opt}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Komponen word cloud untuk mahasiswa ─────────────────────────────────────
function StudentWordCloud({ room, code }) {
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState(hasSubmitted(code))
  const [loading, setLoading] = useState(false)
  const maxWords = room.maxWords || 3

  const doSubmit = async () => {
    const parsed = input.trim().split(/[,\s]+/).filter(w => w.length > 1).slice(0, maxWords)
    if (parsed.length === 0) return
    setLoading(true)
    try {
      await submitWords(code, parsed)
      markSubmitted(code)
      setSubmitted(true)
    } catch (e) {
      alert('Gagal mengirim kata. Coba lagi.')
    }
    setLoading(false)
  }

  if (room.phase === 'closed') return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>🔒</div>
      <div style={{ fontFamily: 'var(--font-h)', fontSize: 20, fontWeight: 800, color: 'var(--teal)' }}>Sesi Telah Ditutup</div>
    </div>
  )

  if (submitted) return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
      <div style={{ fontFamily: 'var(--font-h)', fontSize: 22, fontWeight: 800, color: 'var(--teal)', marginBottom: 8 }}>Kata-katamu Masuk!</div>
      <div style={{ color: 'var(--muted)', fontSize: 14 }}>Tunggu dosen menampilkan word cloud...</div>
    </div>
  )

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="badge badge-teal mb-12" style={{ display: 'inline-flex' }}>
          <span className="phase-dot phase-dot-active" /> LIVE
        </div>
        <div style={{ fontFamily: 'var(--font-h)', fontSize: 18, fontWeight: 700, lineHeight: 1.5 }}>
          "{room.prompt}"
        </div>
      </div>
      <div className="card">
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
          Ketik maksimal <strong style={{ color: 'var(--teal)' }}>{maxWords} kata</strong>, pisahkan dengan koma atau spasi:
        </div>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`Contoh: ${maxWords >= 2 ? 'ikan, laut' : 'ikan'}${maxWords >= 3 ? ', tangkap' : ''}`}
          rows={3}
          disabled={loading}
          style={{ width: '100%', marginBottom: 12 }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSubmit() } }}
        />
        <button
          className="btn btn-teal btn-lg btn-block"
          onClick={doSubmit}
          disabled={!input.trim() || loading}
        >
          {loading ? '⏳ Mengirim...' : '✉️ Kirim Kata'}
        </button>
      </div>
    </div>
  )
}

// ─── Komponen opinion line untuk mahasiswa ───────────────────────────────────
function StudentOpinionLine({ room, code }) {
  const [submitted, setSubmitted] = useState(hasSubmitted(code))
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)

  const OPTS = [
    { key: 'setuju', label: 'Setuju', icon: '✅', color: '#34d399' },
    { key: 'netral', label: 'Netral', icon: '🤔', color: '#f5c400' },
    { key: 'tidak', label: 'Tidak Setuju', icon: '❌', color: '#f87171' },
  ]

  const doVote = async (side) => {
    if (submitted || room.phase !== 'live') return
    setSelected(side)
    setLoading(true)
    try {
      await submitOpinion(code, side)
      markSubmitted(code)
      setSubmitted(true)
    } catch (e) {
      alert('Gagal mengirim pendapat. Coba lagi.')
    }
    setLoading(false)
  }

  if (room.phase === 'closed') return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>🔒</div>
      <div style={{ fontFamily: 'var(--font-h)', fontSize: 20, fontWeight: 800, color: 'var(--teal)' }}>Sesi Telah Ditutup</div>
    </div>
  )

  if (submitted) {
    const opt = OPTS.find(o => o.key === selected)
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
        <div style={{ fontFamily: 'var(--font-h)', fontSize: 22, fontWeight: 800, color: 'var(--teal)', marginBottom: 8 }}>Pendapatmu Masuk!</div>
        {opt && <div style={{ fontSize: 16, color: opt.color, fontWeight: 700 }}>{opt.icon} {opt.label}</div>}
      </div>
    )
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="badge badge-teal mb-12" style={{ display: 'inline-flex' }}>
          <span className="phase-dot phase-dot-active" /> LIVE
        </div>
        <div style={{ fontFamily: 'var(--font-h)', fontSize: 18, fontWeight: 700, lineHeight: 1.5 }}>
          {room.statement}
        </div>
      </div>
      <div className="card">
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>Pilih posisimu:</div>
        {OPTS.map(o => (
          <button key={o.key} disabled={loading} onClick={() => doVote(o.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14, width: '100%',
              padding: '16px', marginBottom: 12, borderRadius: 10, cursor: 'pointer',
              background: 'var(--surface)', border: `2px solid var(--border)`, textAlign: 'left'
            }}>
            <span style={{ fontSize: 24 }}>{o.icon}</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: o.color }}>{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Main StudentJoin page ────────────────────────────────────────────────────
function StudentJoin() {
  const params = new URLSearchParams(window.location.search)
  const [code, setCode] = useState((params.get('room') || '').toUpperCase())
  const [inputCode, setInputCode] = useState(params.get('room') || '')
  const [joined, setJoined] = useState(!!params.get('room'))

  const { data: room, loading, error } = useListenRoom(joined ? code : null)

  const tryJoin = () => {
    const cleaned = inputCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (cleaned.length < 4) return
    setCode(cleaned)
    setJoined(true)
  }

  // ── Loading / Error States ──────────────────────────────────────────────────
  if (joined && loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--teal)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ color: 'var(--muted)', fontSize: 14 }}>Menghubungkan ke room <strong style={{ color: 'var(--teal)' }}>{code}</strong>...</div>
    </div>
  )

  if (joined && error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <div>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontFamily: 'var(--font-h)', fontSize: 18, fontWeight: 700, color: 'var(--danger)' }}>Gagal terhubung</div>
        <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 8, marginBottom: 20 }}>{error}</div>
        <button className="btn btn-outline" onClick={() => setJoined(false)}>← Coba Lagi</button>
      </div>
    </div>
  )

  if (joined && !loading && !room) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <div>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
        <div style={{ fontFamily: 'var(--font-h)', fontSize: 18, fontWeight: 700, color: 'var(--white)' }}>Room Tidak Ditemukan</div>
        <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 8, marginBottom: 20 }}>
          Kode <strong style={{ color: 'var(--teal)' }}>{code}</strong> tidak valid atau sesi sudah berakhir.
        </div>
        <button className="btn btn-outline" onClick={() => { setJoined(false); setInputCode('') }}>← Coba Kode Lain</button>
      </div>
    </div>
  )

  // ── Room found ──────────────────────────────────────────────────────────────
  const renderTool = () => {
    if (!room) return null
    if (room.tool === 'polling')   return <StudentPolling room={room} code={code} />
    if (room.tool === 'wordcloud') return <StudentWordCloud room={room} code={code} />
    if (room.tool === 'opinion')   return <StudentOpinionLine room={room} code={code} />
    return (
      <div className="card" style={{ textAlign: 'center', padding: 32 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🛠️</div>
        <div style={{ color: 'var(--muted)', fontSize: 14 }}>Tool "{room.tool}" belum mendukung input mahasiswa.</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '0 0 60px' }}>
      {/* Header */}
      <div style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 10
      }}>
        <span style={{ fontSize: 20 }}>🐟</span>
        <div>
          <div style={{ fontFamily: 'var(--font-h)', fontWeight: 800, fontSize: 15, color: 'var(--teal)' }}>AquaTeach</div>
          {joined && room && (
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              Room: <strong style={{ color: 'var(--white)', letterSpacing: 2 }}>{code}</strong>
              {' · '}{room.tool === 'polling' ? '📊 Live Polling' : room.tool === 'wordcloud' ? '☁️ Word Cloud' : room.tool === 'opinion' ? '📍 Opinion Line' : room.tool}
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 500, margin: '0 auto', padding: '20px 16px' }}>

        {/* ── Enter code view ── */}
        {!joined && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 28, marginTop: 12 }}>
              <div style={{ fontSize: 52, marginBottom: 10 }}>🎓</div>
              <div style={{ fontFamily: 'var(--font-h)', fontSize: 22, fontWeight: 800, color: 'var(--white)', marginBottom: 6 }}>
                Masuk ke Sesi
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 14 }}>Minta kode room dari dosen kamu</div>
            </div>

            <div className="card">
              <div className="form-label mb-12">Kode Room</div>
              <input
                type="text"
                value={inputCode}
                onChange={e => setInputCode(e.target.value.toUpperCase())}
                placeholder="Contoh: KL7R2M"
                maxLength={8}
                style={{ fontSize: 24, fontFamily: 'var(--font-h)', letterSpacing: 6, textAlign: 'center', fontWeight: 800 }}
                onKeyDown={e => e.key === 'Enter' && tryJoin()}
                autoFocus
              />
              <button
                className="btn btn-teal btn-lg btn-block"
                style={{ marginTop: 16 }}
                onClick={tryJoin}
                disabled={inputCode.trim().length < 4}
              >
                🚀 Masuk Sesi
              </button>
            </div>
          </div>
        )}

        {/* ── Room content view ── */}
        {joined && room && (
          <div className="anim-fade-up">
            {renderTool()}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}

export default StudentJoin
