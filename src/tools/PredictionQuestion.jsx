import { useState } from 'react'

const PRESETS = [
  {
    q: 'Menurut Anda, apa yang akan terjadi pada CPUE jika effort penangkapan terus meningkat melampaui MSY?',
    reveal: 'CPUE akan menurun secara non-linear. Akibat hiper-stabilitas, penurunan CPUE mungkin tertunda — stok bisa sudah jauh di bawah Bmsy sebelum nelayan merasakan dampaknya. Pada titik tertentu, terjadi recruitment failure dan collapse.',
    comparePrompt: 'Bandingkan prediksi Anda tadi dengan konsep Schaefer Production Model — apakah kurva yang ada dalam pikiran Anda sesuai?'
  },
  {
    q: 'Jika harga teripang di pasar dunia turun 70% dalam setahun, apa yang akan terjadi pada komunitas nelayan yang selama ini bergantung pada komoditas ini?',
    reveal: 'Dampaknya bersifat bertingkat: (1) nelayan beralih ke spesies alternatif, meningkatkan tekanan pada stok lain; (2) pengepul mengurangi operasi atau gulung tikar; (3) terjadi defisit pendapatan rumah tangga; (4) beberapa kelompok mungkin beralih ke illegal fishing. Ini mencerminkan fragilitas livelihood berbasis komoditas tunggal.',
    comparePrompt: 'Apakah prediksi Anda mencakup efek cascade ke spesies lain dan aspek sosial-ekonomi rumah tangga nelayan?'
  },
  {
    q: 'Apa yang akan terjadi pada ekosistem pesisir jika seluruh mangrove dalam radius 5 km dari suatu estuari hilang?',
    reveal: 'Mangrove sebagai nursery ground menopang 80% spesies ikan komersil di fase juvenil. Hilangnya mangrove menyebabkan: penurunan rekrutmen ikan, peningkatan sedimentasi, berkurangnya perlindungan garis pantai terhadap abrasi, dan penurunan produksi detritus sebagai basis food web.',
    comparePrompt: 'Bandingkan dengan konsep ecosystem services — berapa banyak komponen yang Anda cantumkan dalam prediksi awal?'
  }
]

function PredictionQuestion() {
  const [phase, setPhase] = useState('setup')
  const [question, setQuestion] = useState('')
  const [reveal, setReveal] = useState('')
  const [comparePrompt, setComparePrompt] = useState('')
  const [predictions, setPredictions] = useState([])
  const [input, setInput] = useState('')
  const [name, setName] = useState('')
  const [presented, setPresented] = useState(false)
  const [presentMode, setPresentMode] = useState(false)

  const loadPreset = (i) => {
    setQuestion(PRESETS[i].q)
    setReveal(PRESETS[i].reveal)
    setComparePrompt(PRESETS[i].comparePrompt)
  }

  const start = () => {
    if (!question.trim() || !reveal.trim()) return
    setPredictions([])
    setPresented(false)
    setInput('')
    setName('')
    setPhase('predict')
  }

  const addPrediction = () => {
    if (!input.trim()) return
    setPredictions(p => [...p, { name: name.trim() || 'Anonim', text: input.trim(), time: new Date().toLocaleTimeString('id') }])
    setInput('')
    setName('')
  }

  const reset = () => {
    setPhase('setup'); setQuestion(''); setReveal(''); setComparePrompt('')
    setPredictions([]); setPresented(false)
  }

  return (
    <>
      {presentMode && (
        <div className="present-mode">
          <button className="btn btn-outline btn-sm present-close" onClick={() => setPresentMode(false)}>✕ Tutup</button>
          <div style={{ maxWidth: 800, margin: '0 auto', width: '100%', padding: '20px 0' }}>
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 26, fontWeight: 800, color: 'var(--teal)', marginBottom: 24 }}>
              🔮 Prediction Question
            </div>
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 22, fontWeight: 700, lineHeight: 1.6, marginBottom: 32, background: 'var(--card)', borderRadius: 'var(--r)', padding: 28, border: '1px solid var(--border)', color: 'var(--white)' }}>
              {question}
            </div>
            {predictions.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>
                  Prediksi Mahasiswa ({predictions.length})
                </div>
                {predictions.map((p, i) => (
                  <div key={i} style={{ background: 'var(--card)', borderRadius: 'var(--r-sm)', padding: '14px 18px', marginBottom: 10, borderLeft: '3px solid var(--teal)' }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, fontWeight: 600 }}>🎓 {p.name}</div>
                    <div style={{ fontSize: 15, lineHeight: 1.7 }}>{p.text}</div>
                  </div>
                ))}
              </div>
            )}
            {presented && (
              <div className="reveal-box" style={{ background: 'linear-gradient(135deg, rgba(0,200,224,0.1), rgba(0,200,224,0.03))', borderColor: 'rgba(0,200,224,0.3)' }}>
                <div style={{ fontWeight: 700, color: 'var(--teal)', marginBottom: 12, fontSize: 16 }}>💡 Penjelasan Ilmiah</div>
                <div style={{ fontSize: 15, lineHeight: 1.8, marginBottom: 20 }}>{reveal}</div>
                {comparePrompt && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    <div style={{ fontWeight: 700, color: 'var(--gold)', marginBottom: 8, fontSize: 14 }}>🔄 Refleksi</div>
                    <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>{comparePrompt}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="page-hdr">
        <div className="page-hdr-top">
          <div className="page-hdr-icon">🔮</div>
          <div>
            <h2>Prediction Question</h2>
            <p>Bangkitkan rasa ingin tahu — mahasiswa berprediksi dulu, lalu bandingkan dengan ilmu</p>
          </div>
        </div>
      </div>

      {phase === 'setup' && (
        <div className="anim-fade-up">
          <div className="card mb-16">
            <div className="form-label mb-12">Contoh Pertanyaan MSP</div>
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
              <label className="form-label">Pertanyaan Prediksi</label>
              <textarea value={question} onChange={e => setQuestion(e.target.value)}
                placeholder="Apa yang akan terjadi jika... / Menurut Anda, bagaimana... / Prediksi apa yang akan terjadi pada..."
                rows={3} />
            </div>
            <div className="form-group">
              <label className="form-label">Penjelasan Ilmiah (diungkap setelah prediksi)</label>
              <textarea value={reveal} onChange={e => setReveal(e.target.value)}
                placeholder="Jawaban/penjelasan yang akan dibandingkan dengan prediksi mahasiswa..." rows={4} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Prompt Refleksi (opsional)</label>
              <textarea value={comparePrompt} onChange={e => setComparePrompt(e.target.value)}
                placeholder="Pertanyaan untuk memandu mahasiswa membandingkan prediksi mereka dengan kenyataan..."
                rows={2} />
            </div>
          </div>
          <button className="btn btn-teal btn-lg btn-block" onClick={start}
            disabled={!question.trim() || !reveal.trim()}>
            🔮 Mulai Sesi Prediksi
          </button>
        </div>
      )}

      {phase === 'predict' && (
        <div className="anim-fade-up">
          <div className="card mb-16" style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.1), rgba(167,139,250,0.02))', borderColor: 'rgba(167,139,250,0.25)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 10 }}>
              🔮 Pertanyaan Prediksi
            </div>
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 20, fontWeight: 700, lineHeight: 1.5, color: 'var(--white)' }}>
              {question}
            </div>
          </div>

          <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
            <div className="card">
              <div className="form-label mb-12">Input Prediksi Mahasiswa</div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 10 }}>Nama (opsional)</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nama mahasiswa..." />
              </div>
              <textarea value={input} onChange={e => setInput(e.target.value)}
                placeholder="Tuliskan prediksi Anda di sini..." rows={4} />
              <button className="btn btn-teal btn-block mt-12" onClick={addPrediction} disabled={!input.trim()}>
                + Tambah Prediksi
              </button>
            </div>
            <div>
              <div className="form-label mb-12">Prediksi Masuk ({predictions.length})</div>
              {predictions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)', background: 'var(--surface)', borderRadius: 'var(--r)', border: '1px solid var(--border)', fontSize: 13 }}>
                  Menunggu prediksi mahasiswa...
                </div>
              ) : (
                predictions.slice(-5).map((p, i) => (
                  <div key={i} className="card card-sm mb-8" style={{ background: 'var(--surface)', borderLeft: '3px solid #a78bfa', animationDelay: `${i * 0.05}s` }} >
                    <div style={{ fontSize: 11, color: '#a78bfa', fontWeight: 700, marginBottom: 4 }}>🎓 {p.name}</div>
                    <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--white)' }}>{p.text}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {!presented ? (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btn-gold btn-lg" onClick={() => setPresented(true)}
                disabled={predictions.length === 0}>
                💡 Ungkap Penjelasan Ilmiah
              </button>
              <button className="btn btn-teal" onClick={() => setPresentMode(true)}>⛶ Presentasi</button>
            </div>
          ) : (
            <div className="anim-pop">
              <div className="card mb-16" style={{ background: 'linear-gradient(135deg, rgba(0,200,224,0.1), rgba(0,200,224,0.03))', borderColor: 'rgba(0,200,224,0.3)' }}>
                <div style={{ fontWeight: 700, color: 'var(--teal)', marginBottom: 12, fontSize: 15 }}>💡 Penjelasan Ilmiah</div>
                <div style={{ fontSize: 14, lineHeight: 1.8, marginBottom: comparePrompt ? 20 : 0 }}>{reveal}</div>
                {comparePrompt && (
                  <>
                    <div className="divider" />
                    <div style={{ fontWeight: 700, color: 'var(--gold)', marginBottom: 8, fontSize: 13 }}>🔄 Refleksi & Perbandingan</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>{comparePrompt}</div>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn btn-teal" onClick={() => setPresentMode(true)}>⛶ Presentasi Lengkap</button>
                <button className="btn btn-ghost" onClick={reset}>🔄 Pertanyaan Baru</button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default PredictionQuestion
