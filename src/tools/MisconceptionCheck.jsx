import { useState } from 'react'

const PRESETS = [
  {
    s: 'CPUE (Catch Per Unit Effort) selalu mencerminkan kelimpahan stok ikan yang sebenarnya.',
    correct: 'salah',
    explanation: 'CPUE dapat bias — fenomena hiper-stabilitas (hyperstability) terjadi ketika armada penangkapan memusatkan effort pada kawasan agregasi ikan, sehingga CPUE tetap tinggi meski stok menurun drastis. CPUE hanya representatif jika upaya dan teknologi tangkap bersifat homogen.'
  },
  {
    s: 'Maximum Sustainable Yield (MSY) adalah titik optimal yang paling aman untuk pengelolaan perikanan.',
    correct: 'salah',
    explanation: 'MSY secara teori menarik, namun berbahaya jika dijadikan target tunggal. Ketidakpastian biologis, variabilitas lingkungan, dan interaksi ekosistem membuat pengelolaan di level MSY berisiko collapse. Pendekatan precautionary menyarankan target di bawah MSY (misalnya 80% MSY).'
  },
  {
    s: 'Larangan penangkapan ikan di musim tertentu selalu menguntungkan nelayan secara ekonomi dalam jangka panjang.',
    correct: 'benar',
    explanation: 'Secara prinsip benar, meski ada trade-off jangka pendek. Penutupan musim memungkinkan pemulihan stok, yang dalam jangka panjang meningkatkan biomassa tersedia, mengurangi biaya upaya penangkapan, dan menstabilkan harga ikan. Studi di berbagai WPP Indonesia mendukung hal ini.'
  },
]

function MisconceptionCheck() {
  const [phase, setPhase] = useState('setup')
  const [statement, setStatement] = useState('')
  const [correctAnswer, setCorrectAnswer] = useState('benar')
  const [explanation, setExplanation] = useState('')
  const [votes, setVotes] = useState({ benar: 0, salah: 0 })
  const [hasVoted, setHasVoted] = useState(false)
  const [myVote, setMyVote] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [presentMode, setPresentMode] = useState(false)

  const total = votes.benar + votes.salah
  const pct = (k) => total > 0 ? Math.round((votes[k] / total) * 100) : 0

  const loadPreset = (i) => {
    setStatement(PRESETS[i].s)
    setCorrectAnswer(PRESETS[i].correct)
    setExplanation(PRESETS[i].explanation)
  }

  const start = () => {
    if (!statement.trim() || !explanation.trim()) return
    setVotes({ benar: 0, salah: 0 })
    setHasVoted(false)
    setMyVote(null)
    setRevealed(false)
    setPhase('voting')
  }

  const doVote = (side) => {
    if (hasVoted) return
    setVotes(v => ({ ...v, [side]: v[side] + 1 }))
    setMyVote(side)
    setHasVoted(true)
  }

  const reset = () => {
    setPhase('setup')
    setStatement(''); setExplanation(''); setCorrectAnswer('benar')
    setVotes({ benar: 0, salah: 0 }); setHasVoted(false); setMyVote(null); setRevealed(false)
  }

  const isMyVoteCorrect = myVote === correctAnswer

  return (
    <>
      {presentMode && (
        <div className="present-mode" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <button className="btn btn-outline btn-sm present-close" onClick={() => setPresentMode(false)}>✕ Tutup</button>
          <div style={{ maxWidth: 760, width: '100%', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 26, fontWeight: 800, color: 'var(--teal)', marginBottom: 24 }}>
              🎯 Misconception Check
            </div>
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 20, fontWeight: 700, lineHeight: 1.6, marginBottom: 32, background: 'var(--card)', borderRadius: 'var(--r)', padding: 28, border: '1px solid var(--border)', color: 'var(--white)' }}>
              "{statement}"
            </div>
            <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
              <div className="vote-btn-big benar" style={{ pointerEvents: 'none' }}>
                <span className="vote-icon">✅</span>
                <div style={{ fontSize: 14, fontWeight: 700 }}>BENAR</div>
                <div className="vote-count">{votes.benar}</div>
                <div style={{ fontSize: 20, color: 'var(--success)' }}>{pct('benar')}%</div>
              </div>
              <div className="vote-btn-big salah" style={{ pointerEvents: 'none' }}>
                <span className="vote-icon">❌</span>
                <div style={{ fontSize: 14, fontWeight: 700 }}>SALAH</div>
                <div className="vote-count">{votes.salah}</div>
                <div style={{ fontSize: 20, color: 'var(--danger)' }}>{pct('salah')}%</div>
              </div>
            </div>
            {revealed && (
              <div className={`reveal-box ${correctAnswer === 'salah' ? 'wrong-reveal' : ''}`} style={{ textAlign: 'left', animation: 'pop 0.4s ease' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 24 }}>{correctAnswer === 'benar' ? '✅' : '❌'}</span>
                  <span style={{ fontFamily: 'var(--font-h)', fontSize: 18, fontWeight: 800, color: correctAnswer === 'benar' ? 'var(--success)' : 'var(--danger)' }}>
                    Pernyataan ini {correctAnswer === 'benar' ? 'BENAR' : 'SALAH'}!
                  </span>
                </div>
                <div style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--white)' }}>{explanation}</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="page-hdr">
        <div className="page-hdr-top">
          <div className="page-hdr-icon">🎯</div>
          <div>
            <h2>Misconception Check</h2>
            <p>Deteksi miskonsepsi — pernyataan "jebakan" untuk mengungkap pemahaman tersembunyi mahasiswa</p>
          </div>
        </div>
      </div>

      {phase === 'setup' && (
        <div className="anim-fade-up">
          <div className="card mb-16">
            <div className="form-label mb-12">Contoh Pernyataan MSP</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PRESETS.map((p, i) => (
                <button key={i} className="btn btn-outline btn-sm" onClick={() => loadPreset(i)}>
                  Contoh {i + 1}
                </button>
              ))}
            </div>
          </div>
          <div className="card mb-16">
            <div className="form-group">
              <label className="form-label">Pernyataan (bisa benar atau salah)</label>
              <textarea value={statement} onChange={e => setStatement(e.target.value)}
                placeholder='Tulis pernyataan yang mengandung potensi miskonsepsi...' rows={3} />
            </div>
            <div className="form-group">
              <label className="form-label">Pernyataan ini secara ilmiah...</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setCorrectAnswer('benar')}
                  className={`btn ${correctAnswer === 'benar' ? 'btn-success' : 'btn-outline'}`}>
                  ✅ BENAR
                </button>
                <button onClick={() => setCorrectAnswer('salah')}
                  className={`btn ${correctAnswer === 'salah' ? 'btn-danger' : 'btn-outline'}`}>
                  ❌ SALAH
                </button>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Penjelasan (akan diungkap setelah voting)</label>
              <textarea value={explanation} onChange={e => setExplanation(e.target.value)}
                placeholder="Jelaskan mengapa pernyataan tersebut benar/salah secara ilmiah..." rows={4} />
            </div>
          </div>
          <button className="btn btn-teal btn-lg btn-block" onClick={start}
            disabled={!statement.trim() || !explanation.trim()}>
            🎯 Mulai Misconception Check
          </button>
        </div>
      )}

      {phase === 'voting' && (
        <div className="anim-fade-up">
          <div className="card mb-16">
            <div className="badge badge-teal mb-12" style={{ display: 'inline-flex' }}>
              <span className="phase-dot phase-dot-active" /> {total} suara masuk
            </div>
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 20, fontWeight: 700, lineHeight: 1.5 }}>
              "{statement}"
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
            <button className={`vote-btn-big benar ${hasVoted ? 'disabled' : ''}`} onClick={() => doVote('benar')} disabled={hasVoted}>
              <span className="vote-icon">✅</span>
              <div style={{ fontSize: 13, fontWeight: 700 }}>BENAR</div>
              <div className="vote-count">{votes.benar}</div>
              <div style={{ fontSize: 18 }}>{pct('benar')}%</div>
            </button>
            <button className={`vote-btn-big salah ${hasVoted ? 'disabled' : ''}`} onClick={() => doVote('salah')} disabled={hasVoted}>
              <span className="vote-icon">❌</span>
              <div style={{ fontSize: 13, fontWeight: 700 }}>SALAH</div>
              <div className="vote-count">{votes.salah}</div>
              <div style={{ fontSize: 18 }}>{pct('salah')}%</div>
            </button>
          </div>

          {hasVoted && !revealed && (
            <div className="card mb-16" style={{ background: 'var(--surface)', textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🤔</div>
              <div style={{ color: 'var(--muted)', fontSize: 14 }}>
                Anda memilih <span style={{ color: myVote === 'benar' ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>{myVote?.toUpperCase()}</span>. Menunggu dosen mengungkap jawaban...
              </div>
            </div>
          )}

          {revealed && (
            <div className={`reveal-box mb-16 anim-pop ${correctAnswer === 'salah' ? 'wrong-reveal' : ''}`}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 28 }}>{correctAnswer === 'benar' ? '✅' : '❌'}</span>
                <span style={{ fontFamily: 'var(--font-h)', fontSize: 20, fontWeight: 800, color: correctAnswer === 'benar' ? 'var(--success)' : 'var(--danger)' }}>
                  Pernyataan ini {correctAnswer === 'benar' ? 'BENAR' : 'SALAH'}!
                </span>
                {hasVoted && (
                  <span className={`badge ${isMyVoteCorrect ? 'badge-success' : 'badge-danger'}`} style={{ marginLeft: 'auto' }}>
                    {isMyVoteCorrect ? '🎉 Anda benar!' : '😅 Anda keliru'}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--white)' }}>{explanation}</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {!revealed && (
              <button className="btn btn-gold" onClick={() => setRevealed(true)}>
                💡 Ungkap Jawaban
              </button>
            )}
            <button className="btn btn-teal" onClick={() => setPresentMode(true)}>⛶ Presentasi</button>
            <button className="btn btn-ghost" onClick={reset}>🔄 Pernyataan Baru</button>
          </div>
        </div>
      )}
    </>
  )
}

export default MisconceptionCheck
