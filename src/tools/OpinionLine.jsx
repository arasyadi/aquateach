import { useState } from 'react'

function OpinionLine() {
  const [phase, setPhase] = useState('setup')
  const [statement, setStatement] = useState('')
  const [votes, setVotes] = useState({ setuju: 0, netral: 0, tidak: 0 })
  const [hasVoted, setHasVoted] = useState(false)
  const [selectedVote, setSelectedVote] = useState(null)
  const [presentMode, setPresentMode] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [reveal, setReveal] = useState({ correct: null, explanation: '' })
  const [correctInput, setCorrectInput] = useState('')
  const [explInput, setExplInput] = useState('')

  const total = votes.setuju + votes.netral + votes.tidak
  const pct = (v) => total > 0 ? Math.round((v / total) * 100) : 0

  const doVote = (side) => {
    if (hasVoted) return
    setVotes(v => ({ ...v, [side]: v[side] + 1 }))
    setSelectedVote(side)
    setHasVoted(true)
  }

  const reset = () => {
    setPhase('setup'); setVotes({ setuju: 0, netral: 0, tidak: 0 })
    setHasVoted(false); setSelectedVote(null); setRevealed(false)
    setStatement(''); setReveal({ correct: null, explanation: '' })
    setCorrectInput(''); setExplInput('')
  }

  const ResultsView = ({ big }) => (
    <div>
      <div style={{ display: 'flex', gap: big ? 24 : 16, flexDirection: big ? 'row' : 'row' }}>
        {[
          { key: 'setuju', label: 'Setuju', emoji: '✅', cls: 'setuju' },
          { key: 'netral', label: 'Netral', emoji: '🤔', cls: 'netral' },
          { key: 'tidak', label: 'Tidak Setuju', emoji: '❌', cls: 'tidak' },
        ].map(({ key, label, emoji, cls }) => (
          <div key={key} className={`opinion-col ${cls}`} style={{ flex: 1 }}>
            <div style={{ fontSize: big ? 32 : 24 }}>{emoji}</div>
            <div className="opinion-col-count" style={{ fontSize: big ? 72 : 48 }}>{votes[key]}</div>
            <div className="opinion-label">{label}</div>
            <div style={{ marginTop: 8, fontFamily: 'var(--font-h)', fontSize: big ? 22 : 18, fontWeight: 700, color: 'var(--muted)' }}>
              {pct(votes[key])}%
            </div>
            {!big && (
              <div className="progress-bar-wrap mt-8">
                <div className={`progress-bar-fill ${cls === 'setuju' ? '' : cls === 'tidak' ? 'danger' : 'gold'}`}
                  style={{ width: `${pct(votes[key])}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 16, color: 'var(--muted)', fontSize: 13 }}>{total} total suara</div>
    </div>
  )

  return (
    <>
      {presentMode && (
        <div className="present-mode" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <button className="btn btn-outline btn-sm present-close" onClick={() => setPresentMode(false)}>✕ Tutup</button>
          <div style={{ maxWidth: 800, width: '100%', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 28, fontWeight: 800, color: 'var(--teal)', marginBottom: 16 }}>
              📍 Opinion Line
            </div>
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 22, fontWeight: 700, lineHeight: 1.5, marginBottom: 40, color: 'var(--white)', background: 'var(--card)', borderRadius: 'var(--r)', padding: '24px', border: '1px solid var(--border)' }}>
              "{statement}"
            </div>
            {phase === 'voting' && !hasVoted ? (
              <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
                {[
                  { key: 'setuju', label: 'SETUJU', emoji: '✅', bg: 'rgba(79,201,126,0.15)', border: 'rgba(79,201,126,0.4)', color: 'var(--success)' },
                  { key: 'netral', label: 'NETRAL', emoji: '🤔', bg: 'rgba(107,143,184,0.15)', border: 'var(--border2)', color: 'var(--muted)' },
                  { key: 'tidak', label: 'TIDAK SETUJU', emoji: '❌', bg: 'rgba(240,101,101,0.15)', border: 'rgba(240,101,101,0.4)', color: 'var(--danger)' },
                ].map(({ key, label, emoji, bg, border, color }) => (
                  <button key={key} onClick={() => doVote(key)} style={{
                    flex: 1, maxWidth: 180, padding: '32px 16px', borderRadius: 'var(--r)', cursor: 'pointer',
                    background: bg, border: `2px solid ${border}`, color,
                    fontFamily: 'var(--font-h)', fontWeight: 800, fontSize: 18,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                    transition: 'all 0.2s',
                  }}>
                    <span style={{ fontSize: 40 }}>{emoji}</span>
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              <ResultsView big />
            )}
            {revealed && reveal.explanation && (
              <div className="reveal-box mt-24" style={reveal.correct === 'salah' ? { borderColor: 'rgba(240,101,101,0.3)' } : {}}>
                <div style={{ fontWeight: 700, color: 'var(--teal)', marginBottom: 8 }}>💡 Penjelasan Dosen</div>
                <div style={{ fontSize: 15, lineHeight: 1.7 }}>{reveal.explanation}</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="page-hdr">
        <div className="page-hdr-top">
          <div className="page-hdr-icon">📍</div>
          <div>
            <h2>Opinion Line</h2>
            <p>Peta posisi pendapat kelas — memunculkan konflik kognitif dan memancing diskusi</p>
          </div>
        </div>
      </div>

      {phase === 'setup' && (
        <div className="card anim-fade-up">
          <div className="form-group">
            <label className="form-label">Pernyataan</label>
            <textarea value={statement} onChange={e => setStatement(e.target.value)}
              placeholder='Contoh: "CPUE selalu mencerminkan kelimpahan stok ikan yang sebenarnya."'
              rows={3} />
          </div>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-sm)', padding: '14px 16px', marginBottom: 20, fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, border: '1px solid var(--border)' }}>
            💡 <strong style={{ color: 'var(--white)' }}>Tips:</strong> Gunakan pernyataan yang memiliki nuansa, bukan fakta biner. Ini akan memancing diskusi yang lebih kaya dan membuka ruang debat antar mahasiswa.
          </div>
          <button className="btn btn-teal btn-lg btn-block" onClick={() => setPhase('voting')} disabled={!statement.trim()}>
            📍 Mulai Opinion Line
          </button>
        </div>
      )}

      {phase === 'voting' && (
        <div className="anim-fade-up">
          <div className="card mb-16">
            <div className="badge badge-teal mb-12" style={{ display: 'inline-flex' }}>
              <span className="phase-dot phase-dot-active" /> LIVE — {total} suara
            </div>
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 20, fontWeight: 700, lineHeight: 1.5, marginBottom: 20 }}>"{statement}"</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { key: 'setuju', label: '✅ Setuju', disabled: hasVoted && selectedVote !== 'setuju', selected: selectedVote === 'setuju' },
                { key: 'netral', label: '🤔 Netral', disabled: hasVoted && selectedVote !== 'netral', selected: selectedVote === 'netral' },
                { key: 'tidak', label: '❌ Tidak Setuju', disabled: hasVoted && selectedVote !== 'tidak', selected: selectedVote === 'tidak' },
              ].map(({ key, label, selected }) => (
                <button key={key} onClick={() => doVote(key)} disabled={hasVoted}
                  className={`btn btn-lg ${selected ? 'btn-teal' : 'btn-outline'}`} style={{ flex: 1, minWidth: 120 }}>
                  {label}
                </button>
              ))}
            </div>
            {hasVoted && <div style={{ marginTop: 12, fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>✓ Suara Anda tercatat</div>}
          </div>

          <div className="card mb-16">
            <div className="form-label mb-16">Distribusi Suara Real-time</div>
            <ResultsView />
          </div>

          <div className="card mb-16">
            <div className="form-label mb-12">Ungkap Jawaban / Posisi Dosen (Opsional)</div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              {['setuju', 'netral', 'tidak'].map(k => (
                <button key={k} onClick={() => setCorrectInput(k)}
                  className={`btn btn-sm ${correctInput === k ? 'btn-teal' : 'btn-outline'}`}>
                  {k === 'setuju' ? '✅ Setuju' : k === 'netral' ? '🤔 Netral' : '❌ Tidak Setuju'}
                </button>
              ))}
            </div>
            <textarea value={explInput} onChange={e => setExplInput(e.target.value)}
              placeholder="Penjelasan posisi / nuansa jawaban..." rows={3} style={{ marginBottom: 10 }} />
            <button className="btn btn-gold" onClick={() => { setReveal({ correct: correctInput, explanation: explInput }); setRevealed(true) }}
              disabled={!explInput.trim()}>
              💡 Ungkap Penjelasan
            </button>
          </div>

          {revealed && (
            <div className="reveal-box mb-16 anim-pop">
              <div style={{ fontWeight: 700, color: 'var(--success)', marginBottom: 8, fontSize: 14 }}>💡 Penjelasan Dosen</div>
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

export default OpinionLine
