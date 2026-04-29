import { useState } from 'react'
import Home from './pages/Home'
import StudentJoin from './pages/StudentJoin'
import Polling from './tools/Polling'
import WordCloud from './tools/WordCloud'
import QuickQuiz from './tools/QuickQuiz'
import ThinkPairShare from './tools/ThinkPairShare'
import OneMinutePaper from './tools/OneMinutePaper'
import OpinionLine from './tools/OpinionLine'
import CaseTrigger from './tools/CaseTrigger'
import MisconceptionCheck from './tools/MisconceptionCheck'
import PredictionQuestion from './tools/PredictionQuestion'

// Deteksi di module level (statis, tidak berubah)
const IS_STUDENT = new URLSearchParams(window.location.search).has('join')

const NAV = [
  { id: 'home', icon: '🏠', label: 'Dashboard' },
  { section: 'Ice Breaking' },
  { id: 'polling', icon: '📊', label: 'Live Polling' },
  { id: 'wordcloud', icon: '☁️', label: 'Word Cloud' },
  { id: 'opinion', icon: '📍', label: 'Opinion Line' },
  { section: 'Aktivasi Berpikir' },
  { id: 'tps', icon: '🤝', label: 'Think–Pair–Share' },
  { id: 'prediction', icon: '🔮', label: 'Prediction Question' },
  { id: 'misconception', icon: '🎯', label: 'Misconception Check' },
  { section: 'Pendalaman & Asesmen' },
  { id: 'quiz', icon: '⚡', label: 'Quick Quiz' },
  { id: 'case', icon: '💼', label: 'Case Trigger' },
  { id: 'omp', icon: '📝', label: 'One-Minute Paper' },
]

const COMPONENTS = {
  home: Home, polling: Polling, wordcloud: WordCloud, quiz: QuickQuiz,
  tps: ThinkPairShare, omp: OneMinutePaper, opinion: OpinionLine,
  case: CaseTrigger, misconception: MisconceptionCheck, prediction: PredictionQuestion,
}

function App() {
  // Hooks selalu dipanggil — sesuai Rules of Hooks
  const [page, setPage]           = useState('home')
  const [mobileOpen, setMobileOpen] = useState(false)

  // Early return setelah hooks — ini valid
  if (IS_STUDENT) return <StudentJoin />

  const navigate     = (id) => { setPage(id); setMobileOpen(false) }
  const CurrentPage  = COMPONENTS[page] || Home

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
            if (item.section) return (<div key={i} className="sb-section-label">{item.section}</div>)
            return (
              <div key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`}
                onClick={() => navigate(item.id)}>
                <span className="ni">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            )
          })}
        </nav>

        <div className="sb-footer">
          <div style={{ fontWeight: 700, color: 'var(--white)', marginBottom: 4 }}>AquaTeach v1.1</div>
          <div>FKP Universitas Udayana</div>
          <div>MSP — Tools Pedagogi Aktif</div>
        </div>
      </aside>

      <div className="mobile-header">
        <div style={{ fontFamily: 'var(--font-h)', fontWeight: 800, color: 'var(--teal)', fontSize: 18 }}>🐟 AquaTeach</div>
        <button className="btn btn-ghost btn-sm" onClick={() => setMobileOpen(!mobileOpen)} style={{ fontSize: 20 }}>☰</button>
      </div>

      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 199, backdropFilter: 'blur(2px)' }} />
      )}

      <main className="main-content">
        <CurrentPage onNavigate={navigate} />
      </main>
    </div>
  )
}

export default App
