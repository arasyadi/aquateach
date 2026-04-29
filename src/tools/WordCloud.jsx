import { useState, useMemo, useRef } from 'react'

const COLORS = ['var(--teal)', 'var(--gold)', '#a78bfa', '#34d399', '#fb923c', '#f472b6', '#60a5fa', '#fbbf24']

function WordCloud() {
  const [phase, setPhase] = useState('setup')
  const [prompt, setPrompt] = useState('')
  const [maxWords, setMaxWords] = useState(3)
  const [input, setInput] = useState('')
  const [words, setWords] = useState([])
  const [presentMode, setPresentMode] = useState(false)

  const wordFreq = useMemo(() => {
    const freq = {}
    words.forEach(w => {
      const k = w.toLowerCase()
      freq[k] = (freq[k] || 0) + 1
    })
    return freq
  }, [words])

  const sortedWords = useMemo(() => {
    return Object.entries(wordFreq).sort((a, b) => b[1] - a[1])
  }, [wordFreq])

  const maxFreq = sortedWords.length > 0 ? sortedWords[0][1] : 1

  // Stable rotations — seeded by word string, never jitter on re-render
  const rotations = useMemo(() => {
    const map = {}
    sortedWords.forEach(([word]) => {
      let h = 0
      for (let i = 0; i < word.length; i++) h = (h * 31 + word.charCodeAt(i)) & 0xffff
      map[word] = ((h % 24) - 12) // -12 to +12 degrees
    })
    return map
  }, [sortedWords])

  const getSize = (freq) => {
    const ratio = freq / maxFreq
    return 14 + ratio * 32
  }

  const submitWords = () => {
    const parsed = input.trim().split(/[,\s]+/).filter(w => w.length > 0).slice(0, maxWords)
    if (parsed.length === 0) return
    setWords([...words, ...parsed])
    setInput('')
  }

  const CloudDisplay = ({ big }) => (
    <div className="word-cloud-area" style={big ? { minHeight: 300, gap: '14px 20px', padding: 40 } : {}}>
      {sortedWords.length === 0 ? (
        <div style={{ color: 'var(--muted)', fontSize: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>☁️</div>
          Menunggu kata dari mahasiswa...
        </div>
      ) : (
        sortedWords.map(([word, freq], i) => (
          <span key={word} className="cloud-word" style={{
            fontSize: getSize(freq),
            color: COLORS[i % COLORS.length],
            transform: `rotate(${rotations[word] ?? 0}deg)`,
          }}>
            {word}
          </span>
        ))
      )}
    </div>
  )

  return (
    <>
      {presentMode && (
        <div className="present-mode" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <button className="btn btn-outline btn-sm present-close" onClick={() => setPresentMode(false)}>✕ Tutup</button>
          <div style={{ width: '100%', maxWidth: 900, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 32, fontWeight: 800, color: 'var(--teal)', marginBottom: 12 }}>☁️ Word Cloud</div>
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 24, fontWeight: 700, color: 'var(--white)', marginBottom: 32, lineHeight: 1.4 }}>"{prompt}"</div>
            <CloudDisplay big />
            <div style={{ marginTop: 24, color: 'var(--muted)', fontSize: 14 }}>{words.length} kata dari mahasiswa • {Object.keys(wordFreq).length} kata unik</div>
          </div>
        </div>
      )}

      <div className="page-hdr">
        <div className="page-hdr-top">
          <div className="page-hdr-icon">☁️</div>
          <div>
            <h2>Word Cloud</h2>
            <p>Galeri persepsi kolektif — mahasiswa berkontribusi kata, kelas melihat pola bersama</p>
          </div>
        </div>
      </div>

      {phase === 'setup' && (
        <div className="card anim-fade-up">
          <div className="form-group">
            <label className="form-label">Pertanyaan / Prompt</label>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
              placeholder='Contoh: "Ketika mendengar kata overfishing, apa yang pertama terlintas?"'
              rows={3} />
          </div>
          <div className="form-group">
            <label className="form-label">Maksimal Kata per Mahasiswa</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2, 3, 5].map(n => (
                <button key={n} onClick={() => setMaxWords(n)}
                  className={`btn ${maxWords === n ? 'btn-teal' : 'btn-outline'} btn-sm`}>
                  {n} kata
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-teal btn-lg btn-block" onClick={() => setPhase('collecting')}
            disabled={!prompt.trim()}>
            🚀 Mulai Kumpulkan Kata
          </button>
        </div>
      )}

      {phase === 'collecting' && (
        <div className="anim-fade-up">
          <div className="card mb-16">
            <div className="badge badge-teal mb-12" style={{ display: 'inline-flex' }}>
              <span className="phase-dot phase-dot-active" /> LIVE — {words.length} kata masuk
            </div>
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 20, fontWeight: 700, lineHeight: 1.4 }}>"{prompt}"</div>
          </div>

          <div className="grid-2" style={{ gap: 16 }}>
            <div className="card">
              <div className="form-label mb-12">Input Kata (pisah koma/spasi)</div>
              <textarea value={input} onChange={e => setInput(e.target.value)}
                placeholder={`Contoh: tangkap, laut, ikan (maks ${maxWords} kata)`}
                rows={3}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitWords() } }} />
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button className="btn btn-teal" onClick={submitWords} disabled={!input.trim()}>
                  + Tambah Kata
                </button>
                <button className="btn btn-gold" onClick={() => setPhase('results')}>
                  ☁️ Tampilkan Cloud
                </button>
              </div>
            </div>
            <div>
              <div className="form-label mb-12">Preview Real-time</div>
              <CloudDisplay />
            </div>
          </div>

          {sortedWords.length > 0 && (
            <div className="card mt-16">
              <div className="form-label mb-12">Frekuensi Kata</div>
              {sortedWords.slice(0, 10).map(([word, freq], i) => (
                <div key={word} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ width: 24, fontSize: 11, color: 'var(--muted)', fontWeight: 700, textAlign: 'right' }}>#{i + 1}</span>
                  <span style={{ fontWeight: 700, color: COLORS[i % COLORS.length], minWidth: 80, fontSize: 14 }}>{word}</span>
                  <div className="progress-bar-wrap" style={{ flex: 1 }}>
                    <div className="progress-bar-fill" style={{ width: `${(freq / maxFreq) * 100}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 14, color: 'var(--white)', minWidth: 20 }}>{freq}x</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {phase === 'results' && (
        <div className="anim-fade-up">
          <div className="card mb-16">
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>"{prompt}"</div>
            <CloudDisplay />
            <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="badge badge-teal">{words.length} total kata</span>
              <span className="badge badge-gold">{Object.keys(wordFreq).length} kata unik</span>
              {sortedWords[0] && <span className="badge badge-success">🏆 Terpopuler: "{sortedWords[0][0]}"</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-teal" onClick={() => setPresentMode(true)}>⛶ Mode Presentasi</button>
            <button className="btn btn-outline" onClick={() => setPhase('collecting')}>← Lanjut Kumpulkan</button>
            <button className="btn btn-ghost" onClick={() => { setPhase('setup'); setWords([]); setPrompt(''); setInput('') }}>🔄 Mulai Baru</button>
          </div>
        </div>
      )}
    </>
  )
}

export default WordCloud
