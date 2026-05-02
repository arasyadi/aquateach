import { useState, useEffect } from 'react'
import { useListenRoom } from './hooks/useRoom'
import Home from './pages/Home'
import Polling,          { StudentView as PollingStudent    } from './tools/Polling'
import WordCloud,        { StudentView as WordCloudStudent  } from './tools/WordCloud'
import QuickQuiz from './tools/QuickQuiz'
import ThinkPairShare from './tools/ThinkPairShare'
import OneMinutePaper from './tools/OneMinutePaper'
import OpinionLine,      { StudentView as OpinionStudent    } from './tools/OpinionLine'
import CaseTrigger from './tools/CaseTrigger'
import MisconceptionCheck from './tools/MisconceptionCheck'
import LiveOpenResponse, { StudentJoinView as LiveRespStudent } from './tools/LiveOpenResponse'

// ── Map: room.tool → student view component ───────────────────────
const STUDENT_VIEWS = {
  liveresp:  LiveRespStudent,
  polling:   PollingStudent,
  wordcloud: WordCloudStudent,
  opinion:   OpinionStudent,
}

const NAV = [
  { id: 'home', icon: '🏠', label: 'Dashboard' },
  { section: 'Ice Breaking' },
  { id: 'polling',       icon: '📊', label: 'Live Polling'         },
  { id: 'wordcloud',     icon: '☁️', label: 'Word Cloud'           },
  { id: 'opinion',       icon: '📍', label: 'Opinion Line'         },
  { section: 'Aktivasi Berpikir' },
  { id: 'tps',           icon: '🤝', label: 'Think–Pair–Share'     },
  { id: 'liveresp',      icon: '🔮', label: 'Live Open Response'   },
  { id: 'misconception', icon: '🎯', label: 'Misconception Check'  },
  { section: 'Pendalaman & Asesmen' },
  { id: 'quiz', icon: '⚡', label: 'Quick Quiz'      },
  { id: 'case', icon: '💼', label: 'Case Trigger'    },
  { id: 'omp',  icon: '📝', label: 'One-Minute Paper' },
]

const COMPONENTS = {
  home:          Home,
  polling:       Polling,
  wordcloud:     WordCloud,
  quiz:          QuickQuiz,
  tps:           ThinkPairShare,
  omp:           OneMinutePaper,
  opinion:       OpinionLine,
  case:          CaseTrigger,
  misconception: MisconceptionCheck,
  liveresp:      LiveOpenResponse,
}

// ── Shared join-page wrapper ──────────────────────────────────────
function JoinWrap({ children }) {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '28px 18px', fontFamily: 'var(--font-b)',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 36, marginBottom: 6 }}>🐟</div>
        <div style={{ fontFamily: 'var(--font-h)', fontWeight: 800, fontSize: 20, color: 'var(--teal)' }}>
          AquaTeach
        </div>
      </div>
      <div style={{ width: '100%', maxWidth: 460 }}>{children}</div>
    </div>
  )
}

// ── New Session Form (stabil di luar StudentRouter) ─────────────
function NewSessionForm() {
  const [newCode, setNewCode] = useState('')

  const goToNew = () => {
    const c = newCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (c.length >= 4) window.location.href = `/?join=${c}`
  }

  return (
    <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, textAlign: 'center' }}>
        Punya kode sesi baru?
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={newCode}
          onChange={e => setNewCode(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && goToNew()}
          placeholder="Kode sesi"
          maxLength={8}
          style={{
            flex: 1, fontSize: 18, fontFamily: 'var(--font-h)',
            letterSpacing: 4, textAlign: 'center', fontWeight: 700,
          }}
        />
        <button
          className="btn btn-teal"
          onClick={goToNew}
          disabled={newCode.trim().length < 4}
        >
          Masuk →
        </button>
      </div>
    </div>
  )
}

// ── Student Router ────────────────────────────────────────────────
// Reads room.tool from Firebase, then renders the correct student view.
// Now uses realtime listener (useListenRoom) to react to session closure.
function StudentRouter({ code }) {
  const { data: roomData, loading } = useListenRoom(code)

  // Loading awal
  if (loading && !roomData) return (
    <JoinWrap>
      <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 48 }}>
        <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 16px' }} />
        Memuat sesi...
      </div>
    </JoinWrap>
  )

  // Room tidak ditemukan
  if (!roomData) return (
    <JoinWrap>
      <div style={{
        padding: '40px 24px', background: 'var(--card)',
        borderRadius: 'var(--r)', border: '1px solid rgba(240,101,101,0.3)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
        <div style={{ fontFamily: 'var(--font-h)', fontWeight: 700, color: 'var(--danger)', marginBottom: 8 }}>
          Sesi tidak ditemukan
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
          Kode <b style={{ color: 'var(--white)' }}>{code}</b> tidak valid atau sesi sudah berakhir.
        </div>
        <NewSessionForm />
      </div>
    </JoinWrap>
  )

  // Room ditutup — REAKTIF: otomatis tampil saat dosen klik tutup
  if (!roomData.active || roomData.phase === 'closed') return (
    <JoinWrap>
      <div style={{
        padding: '40px 24px', background: 'var(--card)',
        borderRadius: 'var(--r)', border: '1px solid rgba(255,200,71,0.3)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
        <div style={{ fontFamily: 'var(--font-h)', fontWeight: 700, color: 'var(--gold)', marginBottom: 8 }}>
          Sesi Telah Ditutup
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
          Dosen sudah menutup sesi ini.
        </div>
        <NewSessionForm />
      </div>
    </JoinWrap>
  )

  // Tool tidak dikenal
  const StudentView = STUDENT_VIEWS[roomData.tool]
  if (!StudentView) return (
    <JoinWrap>
      <div style={{
        padding: '40px 24px', background: 'var(--card)',
        borderRadius: 'var(--r)', border: '1px solid rgba(255,200,71,0.3)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔧</div>
        <div style={{ fontFamily: 'var(--font-h)', fontWeight: 700, color: 'var(--gold)', marginBottom: 8 }}>
          Tool tidak dikenal
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
          Tipe sesi <b style={{ color: 'var(--white)' }}>{roomData.tool ?? 'unknown'}</b> belum mendukung student join view.
        </div>
        <NewSessionForm />
      </div>
    </JoinWrap>
  )

  return <StudentView code={code} />
}

// ── PIN Gate ──────────────────────────────────────────────────────────────
const STORED_KEY = 'aquateach_auth'
const PIN_HASH   = import.meta.env.VITE_PIN_HASH || ''

async function hashPin(pin) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin))
  return [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, '0')).join('')
}

function PinGate({ onAuth }) {
  const [pin, setPin]       = useState('')
  const [error, setError]   = useState(false)
  const [loading, setLoading] = useState(false)

  const attempt = async () => {
    if (!pin.trim()) return
    setLoading(true)
    const h = await hashPin(pin)
    if (h === PIN_HASH) {
      localStorage.setItem(STORED_KEY, h)
      onAuth()
    } else {
      setError(true)
      setPin('')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'var(--font-b)',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>🐟</div>
        <div style={{
          fontFamily: 'var(--font-h)', fontWeight: 900,
          fontSize: 28, color: 'var(--teal)', letterSpacing: '-0.5px',
        }}>AquaTeach</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
          ☕ Developed by: Andy Rasyadi
        </div>
      </div>

      <div style={{
        width: '100%', maxWidth: 340,
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--r)', padding: '28px 24px',
      }}>
        <div style={{
          fontFamily: 'var(--font-h)', fontWeight: 700,
          fontSize: 15, color: 'var(--white)', marginBottom: 4,
        }}>
          🔐 Akses Dosen
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>
          Masukkan PIN untuk melanjutkan
        </div>

        <input
          type="password"
          value={pin}
          onChange={e => { setPin(e.target.value); setError(false) }}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          placeholder="PIN"
          autoFocus
          style={{
            width: '100%', marginBottom: 12, fontSize: 22,
            letterSpacing: 8, textAlign: 'center', fontFamily: 'var(--font-h)',
            borderColor: error ? 'var(--danger)' : undefined,
          }}
        />

        {error && (
          <div style={{
            fontSize: 12, color: 'var(--danger)', marginBottom: 12,
            textAlign: 'center', animation: 'shake 0.3s ease',
          }}>
            PIN salah, coba lagi.
          </div>
        )}

        <button
          className="btn btn-teal btn-block"
          onClick={attempt}
          disabled={!pin.trim() || loading}
        >
          {loading ? '⏳' : '🔓 Masuk'}
        </button>
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────
function App() {
  const [page, setPage]             = useState('home')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [joinCode, setJoinCode]     = useState(null)
  const [authed, setAuthed]         = useState(
    !PIN_HASH || localStorage.getItem(STORED_KEY) === PIN_HASH
  )

  // Detect ?join=CODE in URL → render student join view
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('join')
    if (code) setJoinCode(code.trim().toUpperCase())
  }, [])

  // ── Student join route ──────────────────────────────────────────
  if (joinCode) {
    return <StudentRouter code={joinCode} />
  }

  // ── PIN Gate (hanya untuk dosen) ───────────────────────────────
  if (!authed) {
    return <PinGate onAuth={() => setAuthed(true)} />
  }

  // ── Normal presenter app ────────────────────────────────────────
  const navigate = (id) => { setPage(id); setMobileOpen(false) }
  const CurrentPage = COMPONENTS[page] || Home

  return (
    <div className="app-wrap">
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sb-logo">
          <div className="sb-logo-title">
            <span style={{ fontSize: 22 }}>🐟</span>
            AquaTeach
          </div>
          <div className="sb-logo-sub">Interactive Learning Toolkit</div>
        </div>

        <nav className="sb-nav">
          {NAV.map((item, i) => {
            if (item.section) return (
              <div key={i} className="sb-section-label">{item.section}</div>
            )
            return (
              <div key={item.id}
                className={`nav-item ${page === item.id ? 'active' : ''}`}
                onClick={() => navigate(item.id)}>
                <span className="ni">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            )
          })}
        </nav>

        <div className="sb-footer">
          <div style={{ fontWeight: 700, color: 'var(--white)', marginBottom: 4 }}>AquaTeach v1.2</div>
          <div>MSP FKP Univ. Udayana</div>
          <div>☕ Developed by: Andy Rasyadi</div>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, width: '100%' }}
            onClick={() => { localStorage.removeItem(STORED_KEY); setAuthed(false) }}>
            🔒 Logout
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="mobile-header">
        <div style={{ fontFamily: 'var(--font-h)', fontWeight: 800, color: 'var(--teal)', fontSize: 18 }}>
          🐟 AquaTeach
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setMobileOpen(!mobileOpen)}
          style={{ fontSize: 20 }}>☰</button>
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 199, backdropFilter: 'blur(2px)',
        }} />
      )}

      <main className="main-content">
        <CurrentPage onNavigate={navigate} />
      </main>
    </div>
  )
}

export default App
