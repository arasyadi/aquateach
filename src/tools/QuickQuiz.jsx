import { useState, useEffect, useRef, useCallback } from 'react'

const LETTERS = ['A', 'B', 'C', 'D', 'E']

function QuickQuiz() {
  const [phase, setPhase] = useState('setup')
  const [questions, setQuestions] = useState([
    { text: '', options: ['', '', '', ''], answer: 0, explanation: '' }
  ])
  const [current, setCurrent] = useState(0)
  const [timePerQ, setTimePerQ] = useState(30)
  const [timeLeft, setTimeLeft] = useState(30)
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [scores, setScores] = useState({})
  const [qAnswers, setQAnswers] = useState({})
  const [presentMode, setPresentMode] = useState(false)
  const timerRef = useRef(null)

  const q = questions[current]
  const total = questions.length

  const clearTimer = useCallback(() => clearInterval(timerRef.current), [])

  const revealAnswer = useCallback(() => {
    clearInterval(timerRef.current)
    setRevealed(true)
  }, [])

  useEffect(() => {
    if (phase !== 'quiz') return
    clearTimer()
    setTimeLeft(timePerQ)
    setRevealed(false)
    setSelected(null)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { revealAnswer(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase, current, revealAnswer, timePerQ])

  const addQuestion = () => {
    setQuestions([...questions, { text: '', options: ['', '', '', ''], answer: 0, explanation: '' }])
  }
  const updateQ = (i, field, val) => {
    setQuestions(questions.map((q, idx) => idx === i ? { ...q, [field]: val } : q))
  }
  const updateOption = (qi, oi, val) => {
    setQuestions(questions.map((q, idx) => idx === qi ? { ...q, options: q.options.map((o, oidx) => oidx === oi ? val : o) } : q))
  }
  const removeQuestion = (i) => {
    if (questions.length <= 1) return
    setQuestions(questions.filter((_, idx) => idx !== i))
  }

  const startQuiz = () => {
    setCurrent(0); setScores({}); setQAnswers({}); setPhase('quiz')
  }

  const select = (optIdx) => {
    if (revealed) return
    setSelected(optIdx)
    if (optIdx === q.answer) {
      setScores(s => ({ ...s, [current]: (s[current] || 0) + 1 }))
    }
    setQAnswers(a => ({ ...a, [current]: optIdx }))
  }

  const next = () => {
    if (current < total - 1) { setCurrent(c => c + 1) }
    else { setPhase('summary'); clearTimer() }
  }

  const pct = Math.round((timeLeft / timePerQ) * 100)
  const r = 40, circ = 2 * Math.PI * r
  const dash = ((100 - pct) / 100) * circ

  const totalCorrect = Object.values(scores).reduce((a, b) => a + b, 0)

  return (
    <>
      {presentMode && phase === 'quiz' && (
        <div className="present-mode">
          <button className="btn btn-outline btn-sm present-close" onClick={() => setPresentMode(false)}>✕ Tutup</button>
          <div style={{ maxWidth: 700, margin: '0 auto', width: '100%', padding: '20px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <div className="badge badge-teal" style={{ fontSize: 14, padding: '6px 16px' }}>
                Soal {current + 1} / {total}
              </div>
              <div className="timer-ring">
                <svg width="100" height="100">
                  <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
                  <circle cx="50" cy="50" r={r} fill="none"
                    stroke={timeLeft <= 5 ? 'var(--danger)' : timeLeft <= 10 ? 'var(--warning)' : 'var(--teal)'}
                    strokeWidth="6" strokeDasharray={circ} strokeDashoffset={dash}
                    strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }} />
                </svg>
                <div className="timer-ring-text">
                  <span style={{ fontFamily: 'var(--font-h)', fontSize: 26, fontWeight: 800, color: timeLeft <= 5 ? 'var(--danger)' : 'var(--white)' }}>{timeLeft}</span>
                </div>
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 26, fontWeight: 700, lineHeight: 1.4, marginBottom: 32, color: 'var(--white)' }}>{q.text}</div>
            <div>
              {q.options.filter(o => o.trim()).map((opt, i) => (
                <button key={i} className={`quiz-option-btn ${revealed && i === q.answer ? 'revealed' : ''}`}
                  onClick={() => select(i)} disabled={revealed} style={{ fontSize: 16, padding: '16px 20px', marginBottom: 12 }}>
                  <div className="quiz-opt-letter">{LETTERS[i]}</div>
                  <span>{opt}</span>
                </button>
              ))}
            </div>
            {revealed && (
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button className="btn btn-teal btn-lg" onClick={next}>
                  {current < total - 1 ? '→ Soal Berikutnya' : '🏁 Lihat Hasil'}
                </button>
              </div>
            )}
            {!revealed && (
              <button className="btn btn-outline btn-sm mt-12" onClick={revealAnswer}>Ungkap Jawaban</button>
            )}
          </div>
        </div>
      )}

      <div className="page-hdr">
        <div className="page-hdr-top">
          <div className="page-hdr-icon">⚡</div>
          <div>
            <h2>Quick Quiz</h2>
            <p>Kuis berpenghitung mundur dengan jawaban terungkap — gamifikasi review materi</p>
          </div>
        </div>
      </div>

      {phase === 'setup' && (
        <div className="anim-fade-up">
          <div className="card mb-16">
            <div className="form-label mb-12">Waktu per Soal (detik)</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[15, 20, 30, 45, 60].map(t => (
                <button key={t} onClick={() => setTimePerQ(t)}
                  className={`btn ${timePerQ === t ? 'btn-teal' : 'btn-outline'} btn-sm`}>
                  {t}s
                </button>
              ))}
            </div>
          </div>
          {questions.map((q, qi) => (
            <div key={qi} className="card mb-16 anim-fade-up" style={{ borderLeft: '3px solid var(--teal)', animationDelay: `${qi * 0.06}s` }}>
              <div className="flex-between mb-16">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="quiz-num-bubble">{qi + 1}</div>
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--muted)' }}>Soal #{qi + 1}</span>
                </div>
                {questions.length > 1 && (
                  <button className="btn btn-danger btn-sm" onClick={() => removeQuestion(qi)}>Hapus</button>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Pertanyaan</label>
                <textarea value={q.text} onChange={e => updateQ(qi, 'text', e.target.value)}
                  placeholder="Tuliskan pertanyaan di sini..." rows={2} />
              </div>
              <div className="form-group">
                <label className="form-label">Opsi Jawaban</label>
                {q.options.map((opt, oi) => (
                  <div key={oi} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <button onClick={() => updateQ(qi, 'answer', oi)}
                      style={{
                        width: 32, height: 36, borderRadius: 6, cursor: 'pointer', flexShrink: 0, fontWeight: 800,
                        fontFamily: 'var(--font-h)', fontSize: 13, border: '2px solid',
                        background: q.answer === oi ? 'var(--success)' : 'transparent',
                        borderColor: q.answer === oi ? 'var(--success)' : 'var(--border)',
                        color: q.answer === oi ? '#001a08' : 'var(--muted)',
                        transition: 'all 0.15s'
                      }}>
                      {LETTERS[oi]}
                    </button>
                    <input type="text" value={opt} onChange={e => updateOption(qi, oi, e.target.value)}
                      placeholder={`Opsi ${LETTERS[oi]}`} style={{ flex: 1 }} />
                  </div>
                ))}
                <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Klik huruf untuk menandai jawaban benar ✓</p>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Penjelasan (opsional)</label>
                <input type="text" value={q.explanation} onChange={e => updateQ(qi, 'explanation', e.target.value)}
                  placeholder="Penjelasan singkat setelah jawaban terungkap..." />
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-outline" onClick={addQuestion}>+ Tambah Soal</button>
            <button className="btn btn-teal btn-lg" onClick={startQuiz}
              disabled={questions.some(q => !q.text.trim() || q.options.filter(o => o.trim()).length < 2)}>
              ⚡ Mulai Quiz ({total} soal)
            </button>
          </div>
        </div>
      )}

      {phase === 'quiz' && (
        <div className="anim-fade-up">
          <div className="card mb-16">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="quiz-num-bubble" style={{ width: 36, height: 36, fontSize: 14 }}>{current + 1}/{total}</div>
                <div className="progress-bar-wrap" style={{ width: 160 }}>
                  <div className="progress-bar-fill" style={{ width: `${((current + (revealed ? 1 : 0)) / total) * 100}%` }} />
                </div>
              </div>
              <div className="timer-ring">
                <svg width="72" height="72">
                  <circle cx="36" cy="36" r="30" fill="none" stroke="var(--border)" strokeWidth="5" />
                  <circle cx="36" cy="36" r="30" fill="none"
                    stroke={timeLeft <= 5 ? 'var(--danger)' : timeLeft <= 10 ? 'var(--warning)' : 'var(--teal)'}
                    strokeWidth="5" strokeDasharray={2 * Math.PI * 30}
                    strokeDashoffset={((100 - pct) / 100) * (2 * Math.PI * 30)}
                    strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }} />
                </svg>
                <div className="timer-ring-text">
                  <span style={{ fontFamily: 'var(--font-h)', fontSize: 18, fontWeight: 800, color: timeLeft <= 5 ? 'var(--danger)' : 'var(--white)' }}>{timeLeft}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 20, fontWeight: 700, lineHeight: 1.5, marginBottom: 24 }}>{q.text}</div>
            {q.options.filter(o => o.trim()).map((opt, i) => {
              let cls = 'quiz-option-btn'
              if (revealed) {
                if (i === q.answer) cls += ' correct'
                else if (i === selected && i !== q.answer) cls += ' wrong'
              }
              return (
                <button key={i} className={cls} onClick={() => select(i)} disabled={revealed || selected !== null}>
                  <div className="quiz-opt-letter">{LETTERS[i]}</div>
                  <span>{opt}</span>
                  {revealed && i === q.answer && <span style={{ marginLeft: 'auto', fontSize: 18 }}>✓</span>}
                </button>
              )
            })}

            {revealed && q.explanation && (
              <div className="reveal-box mt-16">
                <div style={{ fontWeight: 700, color: 'var(--success)', marginBottom: 6, fontSize: 13 }}>💡 Penjelasan</div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--white)' }}>{q.explanation}</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
              {!revealed && <button className="btn btn-outline btn-sm" onClick={revealAnswer}>⏩ Ungkap Jawaban</button>}
              {revealed && (
                <button className="btn btn-teal" onClick={next}>
                  {current < total - 1 ? `→ Soal ${current + 2}` : '🏁 Lihat Rangkuman'}
                </button>
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => setPresentMode(true)}>⛶ Presentasi</button>
            </div>
          </div>
        </div>
      )}

      {phase === 'summary' && (
        <div className="anim-fade-up">
          <div className="card mb-16" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🏁</div>
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 32, fontWeight: 800, color: 'var(--teal)', marginBottom: 4 }}>Quiz Selesai!</div>
            <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 28 }}>Rekap jawaban per soal</div>
            <div className="stat-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)', maxWidth: 400, margin: '0 auto 28px' }}>
              <div className="stat-chip">
                <div className="stat-chip-num">{total}</div>
                <div className="stat-chip-label">Total Soal</div>
              </div>
              <div className="stat-chip">
                <div className="stat-chip-num" style={{ color: 'var(--success)' }}>{totalCorrect}</div>
                <div className="stat-chip-label">Dijawab Benar</div>
              </div>
              <div className="stat-chip">
                <div className="stat-chip-num" style={{ color: 'var(--gold)' }}>{Math.round((totalCorrect / total) * 100)}%</div>
                <div className="stat-chip-label">Akurasi</div>
              </div>
            </div>
          </div>
          {questions.map((q, i) => (
            <div key={i} className="card mb-12" style={{ borderLeft: `3px solid ${scores[i] ? 'var(--success)' : 'var(--danger)'}` }}>
              <div className="flex-between mb-8">
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div className="quiz-num-bubble">{i + 1}</div>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{q.text}</span>
                </div>
                <span className={`badge ${scores[i] ? 'badge-success' : 'badge-danger'}`}>
                  {scores[i] ? '✓ Benar' : '✗ Salah/Skip'}
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                Jawaban benar: <span style={{ color: 'var(--success)', fontWeight: 700 }}>{LETTERS[q.answer]}. {q.options[q.answer]}</span>
              </div>
              {q.explanation && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>💡 {q.explanation}</div>}
            </div>
          ))}
          <button className="btn btn-teal btn-lg mt-8" onClick={() => { setPhase('setup'); setCurrent(0); setScores({}); setQAnswers({}) }}>
            🔄 Buat Quiz Baru
          </button>
        </div>
      )}
    </>
  )
}

export default QuickQuiz
