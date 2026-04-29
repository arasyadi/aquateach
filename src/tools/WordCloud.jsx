import { useState, useMemo, useEffect } from 'react'
import {
  generateRoomCode, joinUrl, qrUrl,
  createRoom, closeRoom,
  useListenRoom, flattenWords,
} from '../hooks/useRoom'

const COLORS = ['var(--teal)', 'var(--gold)', '#a78bfa', '#34d399', '#fb923c', '#f472b6', '#60a5fa', '#fbbf24']

function WordCloud() {
  const [phase, setPhase]         = useState('setup')
  const [prompt, setPrompt]       = useState('')
  const [maxWords, setMaxWords]   = useState(3)
  const [input, setInput]         = useState('')
  const [words, setWords]         = useState([])
  const [presentMode, setPresentMode] = useState(false)

  // Live mode
  const [liveCode, setLiveCode]       = useState(null)
  const [liveLoading, setLiveLoading] = useState(false)
  const [copied, setCopied]           = useState(false)

  const { data: roomData } = useListenRoom(liveCode)

  // Merge local words + Firebase words
  const liveWords = useMemo(() => {
    if (!liveCode || !roomData) return null
    return flattenWords(roomData)
  }, [liveCode, roomData])

  const displayWords = liveWords ?? words

  const wordFreq = useMemo(() => {
    const freq = {}
    displayWords.forEach(w => { const k = w.toLowerCase(); freq[k] = (freq[k] || 0) + 1 })
    return freq
  }, [displayWords])

  const sortedWords = useMemo(() => Object.entries(wordFreq).sort((a, b) => b[1] - a[1]), [wordFreq])
  const maxFreq = sortedWords.length > 0 ? sortedWords[0][1] : 1

  const rotations = useMemo(() => {
    const map = {}
    sortedWords.forEach(([word]) => {
      let h = 0
      for (let i = 0; i < word.length; i++) h = (h * 31 + word.charCodeAt(i)) & 0xffff
      map[word] = ((h % 24) - 12)
    })
    return map
  }, [sortedWords])

  const getSize = (freq) => 14 + (freq / maxFreq) * 32

  const submitWords = () => {
    const parsed = input.trim().split(/[,\s]+/).filter(w => w.length > 0).slice(0, maxWords)
    if (parsed.length === 0) return
    setWords([...words, ...parsed])
    setInput('')
  }

  const reset = () => {
    setPhase('setup'); setWords([]); setPrompt(''); setInput(''); setLiveCode(null)
  }

  const goLive = async () => {
    if (!prompt.trim()) return
    setLiveLoading(true)
    const code = generateRoomCode()
    try {
      await createRoom(code, { tool: 'wordcloud', prompt, maxWords })
      setLiveCode(code)
      setPhase('collecting')
    } catch (e) {
      alert('Gagal membuat sesi live.\n\n' + e.message)
    }
    setLiveLoading(false)
  }

  const endLive = async () => {
    if (liveCode) await closeRoom(liveCode)
    setPhase('results')
  }

  const copyLink = () => {
    navigator.clipboard.writeText(joinUrl(liveCode))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const CloudDisplay = ({ big }) => (
    <div className="word-cloud-area" style={big ? { minHeight: 300, gap: '14px 20px', padding: 40 } : {}}>
      {sortedWords.length === 0 ? (
        <div style={{ color: 'var(--muted)', fontSize: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>☁️</div>
          Menunggu kata dari mahasiswa...
        </div>
      ) : sortedWords.map(([word, freq], i) => (
        <span key={word} className="cloud-word" style={{
          fontSize: getSize(freq),
          color: COLORS[i % COLORS.length],
          transform: `rotate(${rotations[word] ?? 0}deg)`,
        }}>{word}</span>
      ))}
    </div>
  )

  const LivePanel = () => (
    <div className="card" style={{ border: '1.5px solid rgba(0,200,224,0.35)', boxShadow: '0 0 20px rgba(0,200,224,0.08)', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <img src={qrUrl(liveCode)} alt="QR" width={130} height={130}
            style={{ borderRadius: 10, border: '3px solid rgba(0,200,224,0.3)', display: 'block' }} />
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 5 }}>Scan to Join</div>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span className="phase-dot phase-dot-active" style={{ width: 10, height: 10 }} />
            <span style={{ fontFamily: 'var(--font-h)', fontWeight: 800, color: 'var(--teal)', fontSize: 13 }}>SESI LIVE AKTIF</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>KODE ROOM</div>
          <div style={{ fontFamily: 'var(--font-h)', fontWeight: 900, fontSize: 34, letterSpacing: 6, color: 'var(--white)', lineHeight: 1, marginBottom: 8 }}>{liveCode}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12, wordBreak: 'break-all' }}>{joinUrl(liveCode)}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-outline btn-sm" onClick={copyLink}>{copied ? '✓ Tersalin!' : '📋 Salin Link'}</button>
            {phase === 'collecting' && <button className="btn btn-gold btn-sm" onClick={endLive}>🔒 Tutup & Lihat Cloud</button>}
          </div>
        </div>
        <div style={{ textAlign: 'center', minWidth: 60 }}>
          <div style={{ fontFamily: 'var(--font-h)', fontSize: 38, fontWeight: 900, color: 'var(--teal)', lineHeight: 1 }}>{displayWords.length}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>kata masuk</div>
        </div>
      </div>
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
            <div style={{ marginTop: 24, color: 'var(--muted)', fontSize: 14 }}>{displayWords.length} kata dari mahasiswa · {Object.keys(wordFreq).length} kata unik</div>
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
              placeholder='Contoh: "Ketika mendengar kata overfishing, apa yang pertama terlintas?"' rows={3} />
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
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-teal btn-lg" style={{ flex: 1 }} onClick={() => setPhase('collecting')}
              disabled={!prompt.trim()}>🖥️ Mulai Manual</button>
            <button className="btn btn-lg" style={{ flex: 1, background: 'linear-gradient(135deg,#ff4757,#c0392b)', color:'#fff', border:'none', opacity: (!prompt.trim() || liveLoading) ? 0.5 : 1 }}
              onClick={goLive} disabled={!prompt.trim() || liveLoading}>
              {liveLoading ? '⏳ Membuat...' : '🔴 Go Live'}
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
            🔴 Go Live → mahasiswa submit kata dari HP via QR · 🖥️ Manual → input langsung di perangkat dosen
          </p>
        </div>
      )}

      {phase === 'collecting' && (
        <div className="anim-fade-up">
          {liveCode && <LivePanel />}

          <div className="card mb-16">
            <div className="badge badge-teal mb-12" style={{ display: 'inline-flex' }}>
              <span className="phase-dot phase-dot-active" />
              {liveCode ? `LIVE — ${displayWords.length} kata masuk (real-time)` : `LIVE — ${displayWords.length} kata masuk`}
            </div>
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 20, fontWeight: 700, lineHeight: 1.4 }}>"{prompt}"</div>
          </div>

          <div className="grid-2" style={{ gap: 16 }}>
            <div className="card">
              {liveCode ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📱</div>
                  <div style={{ color: 'var(--muted)', fontSize: 13 }}>Kata masuk otomatis dari HP mahasiswa</div>
                  <div style={{ fontFamily: 'var(--font-h)', fontSize: 28, fontWeight: 800, color: 'var(--teal)', marginTop: 12 }}>{displayWords.length}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>kata terkumpul</div>
                </div>
              ) : (
                <>
                  <div className="form-label mb-12">Input Kata (pisah koma/spasi)</div>
                  <textarea value={input} onChange={e => setInput(e.target.value)}
                    placeholder={`Contoh: tangkap, laut, ikan (maks ${maxWords} kata)`} rows={3}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitWords() } }} />
                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <button className="btn btn-teal" onClick={submitWords} disabled={!input.trim()}>+ Tambah Kata</button>
                    <button className="btn btn-gold" onClick={() => setPhase('results')}>☁️ Tampilkan Cloud</button>
                  </div>
                </>
              )}
            </div>
            <div>
              <div className="form-label mb-12">Preview Real-time</div>
              <CloudDisplay />
            </div>
          </div>

          {!liveCode && sortedWords.length > 0 && (
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

          {liveCode && sortedWords.length > 0 && (
            <div className="card mt-16">
              <div className="form-label mb-12">Kata Terpopuler (Live)</div>
              {sortedWords.slice(0, 8).map(([word, freq], i) => (
                <div key={word} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ width: 24, fontSize: 11, color: 'var(--muted)', fontWeight: 700, textAlign: 'right' }}>#{i+1}</span>
                  <span style={{ fontWeight: 700, color: COLORS[i % COLORS.length], minWidth: 90, fontSize: 14 }}>{word}</span>
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
          {liveCode && (
            <div className="card mb-16">
              <span className="badge" style={{ background:'rgba(248,113,113,0.15)', color:'#f87171', border:'1px solid rgba(248,113,113,0.3)', display:'inline-flex', gap:6 }}>
                🔒 Sesi Ditutup · {liveCode} · {displayWords.length} kata
              </span>
            </div>
          )}
          <div className="card mb-16">
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>"{prompt}"</div>
            <CloudDisplay />
            <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="badge badge-teal">{displayWords.length} total kata</span>
              <span className="badge badge-gold">{Object.keys(wordFreq).length} kata unik</span>
              {sortedWords[0] && <span className="badge badge-success">🏆 Terpopuler: "{sortedWords[0][0]}"</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-teal" onClick={() => setPresentMode(true)}>⛶ Mode Presentasi</button>
            {!liveCode && <button className="btn btn-outline" onClick={() => setPhase('collecting')}>← Lanjut Kumpulkan</button>}
            <button className="btn btn-ghost" onClick={reset}>🔄 Mulai Baru</button>
          </div>
        </div>
      )}
    </>
  )
}

export default WordCloud
