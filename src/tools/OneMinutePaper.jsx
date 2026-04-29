import { useState, useEffect, useRef } from 'react'

const PRESET_PROMPTS = [
  { p1: 'Hal paling penting yang Anda pelajari hari ini?', p2: 'Hal yang masih membingungkan atau ingin Anda ketahui lebih lanjut?' },
  { p1: 'Apa konsep kunci dari materi yang baru disampaikan?', p2: 'Apa pertanyaan yang belum terjawab dalam pikiran Anda?' },
  { p1: 'Bagaimana materi hari ini relevan dengan kehidupan nyata / praktik perikanan?', p2: 'Apa satu hal yang masih perlu dijelaskan lebih lanjut?' },
]

function OneMinutePaper() {
  const [phase, setPhase] = useState('setup')
  const [prompt1, setPrompt1] = useState('')
  const [prompt2, setPrompt2] = useState('')
  const [duration, setDuration] = useState(60)
  const [timeLeft, setTimeLeft] = useState(60)
  const [running, setRunning] = useState(false)
  const [responses, setResponses] = useState([])
  const [inputP1, setInputP1] = useState('')
  const [inputP2, setInputP2] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [presentMode, setPresentMode] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!running) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); setRunning(false); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [running])

  const start = () => {
    if (!prompt1.trim()) return
    setTimeLeft(duration)
    setRunning(true)
    setPhase('writing')
    setSubmitted(false)
    setInputP1(''); setInputP2('')
    setResponses([])
  }

  const loadPreset = (idx) => {
    setPrompt1(PRESET_PROMPTS[idx].p1)
    setPrompt2(PRESET_PROMPTS[idx].p2)
  }

  const submitResponse = () => {
    if (!inputP1.trim()) return
    setResponses(r => [...r, { p1: inputP1, p2: inputP2, time: new Date().toLocaleTimeString('id') }])
    setInputP1(''); setInputP2('')
    setSubmitted(true)
  }

  const stopTimer = () => { clearInterval(timerRef.current); setRunning(false) }

  const pct = Math.round((timeLeft / duration) * 100)
  const timerColor = timeLeft <= 10 ? 'var(--danger)' : timeLeft <= 20 ? 'var(--warning)' : 'var(--teal)'

  return (
    <>
      {presentMode && (
        <div className="present-mode">
          <button className="btn btn-outline btn-sm present-close" onClick={() => setPresentMode(false)}>✕ Tutup</button>
          <div style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 28, fontWeight: 800, color: 'var(--teal)', textAlign: 'center', marginBottom: 32 }}>📝 One-Minute Paper</div>
            <div className="omp-prompt-card" style={{ marginBottom: 24 }}>
              <div className="omp-prompt-num">Pertanyaan 1</div>
              <div className="omp-prompt-text">{prompt1}</div>
            </div>
            {prompt2 && (
              <div className="omp-prompt-card" style={{ background: 'linear-gradient(135deg, rgba(255,200,71,0.1), rgba(255,200,71,0.03))', borderColor: 'rgba(255,200,71,0.25)', marginBottom: 24 }}>
                <div className="omp-prompt-num" style={{ color: 'var(--gold)' }}>Pertanyaan 2</div>
                <div className="omp-prompt-text">{prompt2}</div>
              </div>
            )}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-h)', fontSize: 72, fontWeight: 900, color: timerColor, lineHeight: 1, transition: 'color 0.3s' }}>
                {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
              </div>
              <div style={{ color: 'var(--muted)', marginTop: 8 }}>{responses.length} mahasiswa sudah submit</div>
              <div className="progress-bar-wrap" style={{ maxWidth: 300, margin: '16px auto 0' }}>
                <div className="progress-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${timerColor}88, ${timerColor})` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="page-hdr">
        <div className="page-hdr-top">
          <div className="page-hdr-icon">📝</div>
          <div>
            <h2>One-Minute Paper</h2>
            <p>Refleksi instan di akhir sesi — apa yang dipahami dan apa yang masih membingungkan</p>
          </div>
        </div>
      </div>

      {phase === 'setup' && (
        <div className="anim-fade-up">
          <div className="card mb-16">
            <div className="form-label mb-12">Template Cepat</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PRESET_PROMPTS.map((p, i) => (
                <button key={i} className="btn btn-outline btn-sm" onClick={() => loadPreset(i)}>
                  Template {i + 1}
                </button>
              ))}
            </div>
          </div>
          <div className="card mb-16">
            <div className="form-group">
              <label className="form-label">Pertanyaan 1 (Wajib)</label>
              <textarea value={prompt1} onChange={e => setPrompt1(e.target.value)}
                placeholder="Apa hal paling penting yang Anda pelajari hari ini?" rows={2} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Pertanyaan 2 (Opsional)</label>
              <textarea value={prompt2} onChange={e => setPrompt2(e.target.value)}
                placeholder="Hal apa yang masih membingungkan Anda?" rows={2} />
            </div>
          </div>
          <div className="card mb-16">
            <div className="form-label mb-12">Durasi Menulis</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[60, 90, 120, 180, 300].map(d => (
                <button key={d} onClick={() => setDuration(d)}
                  className={`btn ${duration === d ? 'btn-teal' : 'btn-outline'} btn-sm`}>
                  {d < 60 ? `${d}s` : `${d / 60} menit`}
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-teal btn-lg btn-block" onClick={start} disabled={!prompt1.trim()}>
            📝 Mulai Sesi
          </button>
        </div>
      )}

      {phase === 'writing' && (
        <div className="anim-fade-up">
          <div className="card mb-16">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div className="badge badge-teal mb-8" style={{ display: 'inline-flex' }}>
                  {running ? <><span className="phase-dot phase-dot-active" /> Waktu Berjalan</> : <><span className="phase-dot" style={{ background: 'var(--warning)' }} /> Waktu Habis</>}
                </div>
                <div style={{ fontFamily: 'var(--font-h)', fontSize: 32, fontWeight: 900, color: timerColor, lineHeight: 1, transition: 'color 0.3s' }}>
                  {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{responses.length} mahasiswa submit</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {running && <button className="btn btn-outline btn-sm" onClick={stopTimer}>⏹ Hentikan</button>}
                <button className="btn btn-teal btn-sm" onClick={() => setPresentMode(true)}>⛶ Tampilkan di Layar</button>
                <button className="btn btn-gold btn-sm" onClick={() => setPhase('results')}>📋 Lihat Respons ({responses.length})</button>
              </div>
            </div>
            <div className="progress-bar-wrap mt-12">
              <div className="progress-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${timerColor}88, ${timerColor})` }} />
            </div>
          </div>

          <div className="grid-2" style={{ gap: 16 }}>
            <div>
              <div className="omp-prompt-card">
                <div className="omp-prompt-num">Pertanyaan 1</div>
                <div className="omp-prompt-text" style={{ fontSize: 17 }}>{prompt1}</div>
              </div>
              <textarea value={inputP1} onChange={e => setInputP1(e.target.value)}
                placeholder="Tulis jawaban Anda di sini..." rows={5}
                style={{ marginTop: 12, borderColor: submitted ? 'var(--success)' : undefined }} />
            </div>
            {prompt2 && (
              <div>
                <div className="omp-prompt-card" style={{ background: 'linear-gradient(135deg, rgba(255,200,71,0.1), rgba(255,200,71,0.03))', borderColor: 'rgba(255,200,71,0.25)' }}>
                  <div className="omp-prompt-num" style={{ color: 'var(--gold)' }}>Pertanyaan 2</div>
                  <div className="omp-prompt-text" style={{ fontSize: 17 }}>{prompt2}</div>
                </div>
                <textarea value={inputP2} onChange={e => setInputP2(e.target.value)}
                  placeholder="Tulis jawaban Anda di sini..." rows={5}
                  style={{ marginTop: 12 }} />
              </div>
            )}
          </div>
          <button className="btn btn-teal btn-lg mt-16 btn-block" onClick={submitResponse} disabled={!inputP1.trim() || submitted}>
            {submitted ? '✓ Respons Terkirim' : '📨 Submit Respons'}
          </button>
          {submitted && (
            <div style={{ textAlign: 'center', marginTop: 12, color: 'var(--success)', fontSize: 13, fontWeight: 600 }}>
              Terima kasih! Respons Anda telah tercatat.
            </div>
          )}
        </div>
      )}

      {phase === 'results' && (
        <div className="anim-fade-up">
          <div className="card mb-16">
            <div className="flex-between mb-16">
              <div style={{ fontFamily: 'var(--font-h)', fontSize: 20, fontWeight: 700 }}>Rekap Respons</div>
              <span className="badge badge-teal">{responses.length} respons</span>
            </div>
            {responses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
                Belum ada respons masuk.
              </div>
            ) : (
              responses.map((r, i) => (
                <div key={i} className="card card-sm mb-12" style={{ background: 'var(--surface)', borderLeft: '3px solid var(--teal)' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>#{i + 1} · {r.time}</div>
                  <div style={{ marginBottom: r.p2 ? 12 : 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>P1</div>
                    <div style={{ fontSize: 14, lineHeight: 1.7 }}>{r.p1}</div>
                  </div>
                  {r.p2 && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>P2</div>
                      <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--muted)' }}>{r.p2}</div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-outline" onClick={() => setPhase('writing')}>← Kembali</button>
            <button className="btn btn-ghost" onClick={() => { setPhase('setup'); setResponses([]) }}>🔄 Sesi Baru</button>
          </div>
        </div>
      )}
    </>
  )
}

export default OneMinutePaper
