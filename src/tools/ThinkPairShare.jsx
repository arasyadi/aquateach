import { useState, useEffect, useRef, useCallback } from 'react'

const PHASES_DEF = [
  { key: 'think', label: 'THINK', emoji: '🤔', desc: 'Refleksi individu — mahasiswa berpikir mandiri', color: 'var(--teal)' },
  { key: 'pair', label: 'PAIR', emoji: '🤝', desc: 'Diskusi berpasangan — berbagi dan bandingkan', color: 'var(--gold)' },
  { key: 'share', label: 'SHARE', emoji: '📣', desc: 'Pleno — perwakilan berbagi ke kelas', color: '#a78bfa' },
]

function ThinkPairShare() {
  const [phase, setPhase] = useState('setup')
  const [question, setQuestion] = useState('')
  const [durations, setDurations] = useState({ think: 3, pair: 5, share: 10 })
  const [currentPhase, setCurrentPhase] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [running, setRunning] = useState(false)
  const [presentMode, setPresentMode] = useState(false)
  const timerRef = useRef(null)

  const phaseData = PHASES_DEF[currentPhase]

  // clearTimer always reads timerRef.current at call time — no stale closure
  const clearTimer = useCallback(() => clearInterval(timerRef.current), [])

  const startTimer = useCallback((dur) => {
    clearInterval(timerRef.current)
    setTimeLeft(dur * 60)
    setRunning(true)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); setRunning(false); return 0 }
        return t - 1
      })
    }, 1000)
  }, [])

  const start = () => {
    if (!question.trim()) return
    setCurrentPhase(0)
    setPhase('active')
    startTimer(durations.think)
  }

  // Safe cleanup on unmount — reads timerRef.current at cleanup time
  useEffect(() => () => clearInterval(timerRef.current), [])

  const nextPhase = () => {
    if (currentPhase < 2) {
      const next = currentPhase + 1
      setCurrentPhase(next)
      const nextKey = PHASES_DEF[next].key
      startTimer(durations[nextKey])
    } else {
      setPhase('done')
      clearTimer()
    }
  }

  const pauseResume = () => {
    if (running) {
      clearTimer()
      setRunning(false)
    } else {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current); setRunning(false); return 0 }
          return t - 1
        })
      }, 1000)
      setRunning(true)
    }
  }

  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const totalSecs = durations[phaseData?.key] * 60
  const pct = totalSecs > 0 ? Math.round((timeLeft / totalSecs) * 100) : 0
  const timerColor = timeLeft <= 10 ? 'var(--danger)' : timeLeft <= 30 ? 'var(--warning)' : phaseData?.color || 'var(--teal)'

  return (
    <>
      {presentMode && phase === 'active' && (
        <div className="present-mode" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <button className="btn btn-outline btn-sm present-close" onClick={() => setPresentMode(false)}>✕ Tutup</button>
          <div style={{ maxWidth: 700, width: '100%', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 32 }}>
              {PHASES_DEF.map((p, i) => (
                <div key={p.key} style={{
                  padding: '8px 20px', borderRadius: 99, fontFamily: 'var(--font-h)', fontWeight: 800, fontSize: 14,
                  border: '2px solid',
                  background: i === currentPhase ? p.color + '22' : 'transparent',
                  borderColor: i === currentPhase ? p.color : 'var(--border)',
                  color: i === currentPhase ? p.color : 'var(--muted)',
                  opacity: i > currentPhase ? 0.4 : 1,
                }}>
                  {i < currentPhase ? '✓ ' : ''}{p.emoji} {p.label}
                </div>
              ))}
            </div>
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 80, fontWeight: 900, color: timerColor, lineHeight: 1, transition: 'color 0.3s', marginBottom: 16 }}>
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </div>
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 22, fontWeight: 700, color: phaseData.color, marginBottom: 8 }}>
              {phaseData.emoji} {phaseData.label}
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32 }}>{phaseData.desc}</div>
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 22, fontWeight: 700, color: 'var(--white)', lineHeight: 1.5, padding: '24px 32px', background: 'var(--card)', borderRadius: 'var(--r)', border: '1px solid var(--border)', marginBottom: 24 }}>
              {question}
            </div>
            <div className="progress-bar-wrap" style={{ maxWidth: 400, margin: '0 auto' }}>
              <div className="progress-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${phaseData.color}88, ${phaseData.color})` }} />
            </div>
          </div>
        </div>
      )}

      <div className="page-hdr">
        <div className="page-hdr-top">
          <div className="page-hdr-icon">🤝</div>
          <div>
            <h2>Think–Pair–Share</h2>
            <p>Struktur 3 fase yang memastikan setiap mahasiswa berpikir aktif sebelum berbagi ke kelas</p>
          </div>
        </div>
      </div>

      {phase === 'setup' && (
        <div className="anim-fade-up">
          <div className="card mb-16">
            <div className="form-group">
              <label className="form-label">Pertanyaan / Topik Diskusi</label>
              <textarea value={question} onChange={e => setQuestion(e.target.value)}
                placeholder="Contoh: Bagaimana Anda akan merancang sistem monitoring stok ikan yang efektif dan berbiaya rendah untuk nelayan kecil?" rows={3} />
            </div>
          </div>
          <div className="card mb-16">
            <div className="form-label mb-16">Durasi Tiap Fase</div>
            {PHASES_DEF.map(p => (
              <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 100, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{p.emoji}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: p.color }}>{p.label}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[2, 3, 5, 7, 10].map(t => (
                    <button key={t} onClick={() => setDurations(d => ({ ...d, [p.key]: t }))}
                      className={`btn btn-sm ${durations[p.key] === t ? 'btn-teal' : 'btn-outline'}`}>
                      {t}m
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-sm)', padding: '10px 14px', border: '1px solid var(--border)', fontSize: 13, color: 'var(--muted)' }}>
              ⏱ Total durasi: <strong style={{ color: 'var(--white)' }}>{Object.values(durations).reduce((a, b) => a + b, 0)} menit</strong>
            </div>
          </div>
          <button className="btn btn-teal btn-lg btn-block" onClick={start} disabled={!question.trim()}>
            🤝 Mulai Think–Pair–Share
          </button>
        </div>
      )}

      {phase === 'active' && (
        <div className="anim-fade-up">
          <div className="card mb-16">
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
              {PHASES_DEF.map((p, i) => (
                <div key={p.key} style={{
                  padding: '7px 18px', borderRadius: 99, fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 13,
                  border: '2px solid',
                  background: i === currentPhase ? p.color + '22' : 'transparent',
                  borderColor: i === currentPhase ? p.color : 'var(--border)',
                  color: i === currentPhase ? p.color : i < currentPhase ? 'var(--success)' : 'var(--muted)',
                }}>
                  {i < currentPhase ? '✓ ' : ''}{p.emoji} {p.label}
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>{phaseData.emoji}</div>
              <div style={{ fontFamily: 'var(--font-h)', fontSize: 18, fontWeight: 800, color: phaseData.color, marginBottom: 4 }}>
                {phaseData.label}
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>{phaseData.desc}</div>
              <div style={{ fontFamily: 'var(--font-h)', fontSize: 56, fontWeight: 900, color: timerColor, lineHeight: 1, transition: 'color 0.3s', marginBottom: 16 }}>
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
              </div>
              <div className="progress-bar-wrap" style={{ maxWidth: 300, margin: '0 auto 20px' }}>
                <div className="progress-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${phaseData.color}88, ${phaseData.color})` }} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-outline" onClick={pauseResume}>
                  {running ? '⏸ Pause' : '▶ Resume'}
                </button>
                <button className="btn btn-teal" onClick={nextPhase}>
                  {currentPhase < 2 ? `→ ${PHASES_DEF[currentPhase + 1]?.label}` : '🏁 Selesai'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setPresentMode(true)}>⛶</button>
              </div>
            </div>
          </div>

          <div className="card" style={{ borderLeft: `3px solid ${phaseData.color}` }}>
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 14, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>Pertanyaan</div>
            <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.6, color: 'var(--white)' }}>{question}</div>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="anim-fade-up" style={{ textAlign: 'center' }}>
          <div className="card" style={{ padding: '48px 32px' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 26, fontWeight: 800, color: 'var(--teal)', marginBottom: 8 }}>Think–Pair–Share Selesai!</div>
            <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32, lineHeight: 1.7 }}>
              Sesi diskusi telah selesai. Lanjutkan dengan pleno atau tutup diskusi.<br />
              <span style={{ color: 'var(--white)' }}>Total waktu: {Object.values(durations).reduce((a, b) => a + b, 0)} menit</span>
            </div>
            <button className="btn btn-teal btn-lg" onClick={() => { setPhase('setup'); setQuestion('') }}>
              🔄 Sesi Baru
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default ThinkPairShare
