import { useState } from 'react'

const COLORS = ['var(--teal)', 'var(--gold)', '#a78bfa', '#fb923c', '#34d399', '#f472b6']

function Polling() {
  const [phase, setPhase] = useState('setup')
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [votes, setVotes] = useState([])
  const [presentMode, setPresentMode] = useState(false)

  const totalVotes = votes.reduce((a, b) => a + b, 0)

  const addOption = () => { if (options.length < 6) setOptions([...options, '']) }
  const removeOption = (i) => {
    if (options.length <= 2) return
    setOptions(options.filter((_, idx) => idx !== i))
  }
  const updateOption = (i, val) => setOptions(options.map((o, idx) => idx === i ? val : o))

  const start = () => {
    if (!question.trim() || options.filter(o => o.trim()).length < 2) return
    setVotes(new Array(options.length).fill(0))
    setPhase('voting')
  }

  const vote = (i) => {
    if (phase !== 'voting') return
    setVotes(votes.map((v, idx) => idx === i ? v + 1 : v))
  }

  const showResults = () => setPhase('results')
  const reset = () => { setPhase('setup'); setQuestion(''); setOptions(['', '']); setVotes([]) }

  const ResultsView = ({ isPresent }) => (
    <div style={isPresent ? { padding: '40px', maxWidth: 800, margin: '0 auto', width: '100%' } : {}}>
      {isPresent && (
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-h)', fontSize: 28, fontWeight: 800, color: 'var(--teal)', marginBottom: 12 }}>
            📊 Hasil Polling
          </div>
          <div style={{ fontFamily: 'var(--font-h)', fontSize: isPresent ? 26 : 18, fontWeight: 700, color: 'var(--white)', lineHeight: 1.4 }}>
            {question}
          </div>
        </div>
      )}
      <div className="stat-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 24 }}>
        <div className="stat-chip">
          <div className="stat-chip-num">{totalVotes}</div>
          <div className="stat-chip-label">Total Suara</div>
        </div>
        <div className="stat-chip">
          <div className="stat-chip-num" style={{ color: 'var(--gold)' }}>
            {options.filter(o => o.trim()).length}
          </div>
          <div className="stat-chip-label">Opsi</div>
        </div>
      </div>
      {options.filter(o => o.trim()).map((opt, i) => {
        const pct = totalVotes > 0 ? Math.round((votes[i] / totalVotes) * 100) : 0
        const isTop = votes[i] === Math.max(...votes) && totalVotes > 0
        return (
          <div key={i} className="option-row" style={isTop && totalVotes > 0 ? { borderColor: 'rgba(0,200,224,0.4)', boxShadow: '0 0 12px var(--teal-glow)' } : {}}>
            <div className="option-row-bar" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}22, ${COLORS[i % COLORS.length]}11)` }} />
            <div className="option-row-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {isTop && totalVotes > 0 && <span style={{ fontSize: 18 }}>🏆</span>}
                <span className="option-row-text" style={{ fontSize: isPresent ? 17 : 14 }}>{opt}</span>
              </div>
              <div className="option-row-votes">
                <span className="option-count">{votes[i]} suara</span>
                <span className="option-pct" style={{ color: COLORS[i % COLORS.length] }}>{pct}%</span>
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

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['setup', 'voting', 'results'].map((p, i) => (
          <div key={p} className={`phase-chip ${phase === p ? 'phase-active' : 'phase-setup'}`}>
            <span className={`phase-dot ${phase === p ? 'phase-dot-active' : 'phase-dot-setup'}`} />
            {i + 1}. {p === 'setup' ? 'Setup' : p === 'voting' ? 'Voting' : 'Hasil'}
          </div>
        ))}
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
                <div style={{ width: 32, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS[i % COLORS.length] + '22', borderRadius: 6, color: COLORS[i % COLORS.length], fontWeight: 800, fontFamily: 'var(--font-h)', fontSize: 14, flexShrink: 0 }}>
                  {String.fromCharCode(65 + i)}
                </div>
                <input type="text" value={opt} onChange={e => updateOption(i, e.target.value)} placeholder={`Opsi ${String.fromCharCode(65 + i)}`} style={{ flex: 1 }} />
                {options.length > 2 && (
                  <button className="btn btn-ghost btn-sm" onClick={() => removeOption(i)} style={{ padding: '6px 10px' }}>✕</button>
                )}
              </div>
            ))}
            {options.length < 6 && (
              <button className="btn btn-outline btn-sm mt-8" onClick={addOption}>+ Tambah Opsi</button>
            )}
          </div>
          <button className="btn btn-teal btn-lg btn-block" onClick={start}
            disabled={!question.trim() || options.filter(o => o.trim()).length < 2}>
            🚀 Mulai Polling
          </button>
        </div>
      )}

      {phase === 'voting' && (
        <div className="anim-fade-up">
          <div className="card mb-16">
            <div style={{ marginBottom: 16 }}>
              <div className="badge badge-teal mb-12" style={{ display: 'inline-flex' }}>
                <span className="phase-dot phase-dot-active" /> LIVE — {totalVotes} suara masuk
              </div>
              <div style={{ fontFamily: 'var(--font-h)', fontSize: 20, fontWeight: 700, lineHeight: 1.4 }}>{question}</div>
            </div>
            <p className="text-muted fs-13">Klik opsi untuk menambah suara (atau mahasiswa input langsung):</p>
          </div>
          <div className="card">
            {options.filter(o => o.trim()).map((opt, i) => (
              <div key={i} className="option-row clickable" onClick={() => vote(i)}
                style={{ cursor: 'pointer', borderColor: 'var(--border)' }}>
                <div className="option-row-content">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: COLORS[i % COLORS.length] + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS[i % COLORS.length], fontWeight: 800, fontFamily: 'var(--font-h)' }}>
                      {String.fromCharCode(65 + i)}
                    </div>
                    <span className="option-row-text">{opt}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-h)', fontSize: 22, fontWeight: 800, color: COLORS[i % COLORS.length] }}>{votes[i]}</span>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn btn-gold" onClick={showResults}>📊 Tampilkan Hasil</button>
              <button className="btn btn-outline" onClick={reset}>Reset</button>
            </div>
          </div>
        </div>
      )}

      {phase === 'results' && (
        <div className="anim-fade-up">
          <div className="card mb-16">
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>{question}</div>
            <ResultsView />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-teal" onClick={() => setPresentMode(true)}>⛶ Mode Presentasi</button>
            <button className="btn btn-outline" onClick={() => setPhase('voting')}>← Kembali Voting</button>
            <button className="btn btn-ghost" onClick={reset}>🔄 Polling Baru</button>
          </div>
        </div>
      )}
    </>
  )
}

export default Polling
