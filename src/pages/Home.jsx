const TOOLS = [
  {
    id: 'polling',
    icon: '📊',
    title: 'Live Polling',
    desc: 'Kumpulkan suara kelas secara real-time dengan visualisasi grafik batang langsung.',
    tags: ['Ice Breaking', 'Prior Knowledge', 'Opini'],
    difficulty: 'Mudah',
    time: '2–5 menit',
  },
  {
    id: 'wordcloud',
    icon: '☁️',
    title: 'Word Cloud',
    desc: 'Galeri persepsi kolektif — mahasiswa berkontribusi kata, kelas melihat pola bersama.',
    tags: ['Ice Breaking', 'Asosiasi', 'Persepsi'],
    difficulty: 'Mudah',
    time: '3–8 menit',
  },
  {
    id: 'quiz',
    icon: '⚡',
    title: 'Quick Quiz',
    desc: 'Kuis dengan timer hitung mundur dan jawaban terungkap otomatis. Gamifikasi review materi.',
    tags: ['Review Materi', 'Gamifikasi', 'Asesmen Formatif'],
    difficulty: 'Sedang',
    time: '5–20 menit',
  },
  {
    id: 'tps',
    icon: '🤝',
    title: 'Think–Pair–Share',
    desc: 'Struktur 3 fase dengan timer: Think (individu) → Pair (berdua) → Share (pleno).',
    tags: ['Diskusi', 'Kolaborasi', 'Semua Level'],
    difficulty: 'Mudah',
    time: '10–20 menit',
  },
  {
    id: 'omp',
    icon: '📝',
    title: 'One-Minute Paper',
    desc: 'Refleksi instan di akhir sesi — apa yang dipahami dan apa yang masih membingungkan.',
    tags: ['Refleksi', 'Penutup Sesi', 'Feedback'],
    difficulty: 'Mudah',
    time: '1–5 menit',
  },
  {
    id: 'opinion',
    icon: '📍',
    title: 'Opinion Line',
    desc: 'Peta posisi pendapat kelas — Setuju, Netral, atau Tidak Setuju pada suatu pernyataan.',
    tags: ['Debat', 'Konflik Kognitif', 'Pendapat'],
    difficulty: 'Mudah',
    time: '3–10 menit',
  },
  {
    id: 'case',
    icon: '💼',
    title: 'Case Trigger',
    desc: 'Mini kasus nyata yang memicu diskusi mendalam — hubungkan teori dengan realita lapangan.',
    tags: ['PBL', 'Analisis', 'Diskusi'],
    difficulty: 'Sedang',
    time: '10–25 menit',
  },
  {
    id: 'misconception',
    icon: '🎯',
    title: 'Misconception Check',
    desc: 'Pernyataan "jebakan" Benar/Salah untuk mengungkap dan mendebat miskonsepsi mahasiswa.',
    tags: ['Kritis', 'Debat', 'Konsep Kunci'],
    difficulty: 'Sedang',
    time: '3–10 menit',
  },
  {
    id: 'prediction',
    icon: '🔮',
    title: 'Prediction Question',
    desc: 'Bangkitkan rasa ingin tahu — mahasiswa berprediksi dulu, lalu bandingkan dengan ilmu.',
    tags: ['Inkuiri', 'Motivasi', 'Pembuka Materi'],
    difficulty: 'Sedang',
    time: '5–15 menit',
  },
]

function Home({ onNavigate }) {
  return (
    <div className="anim-fade-up">
      <div className="page-hdr">
        <div style={{ background: 'linear-gradient(135deg, rgba(0,200,224,0.08), transparent)', borderRadius: 'var(--r)', padding: '28px 32px', border: '1px solid rgba(0,200,224,0.15)', marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ fontSize: 56, animation: 'waveFloat 3s ease-in-out infinite' }}>🐟</div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-h)', fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 900, color: 'var(--teal)', lineHeight: 1.1, letterSpacing: '-1px', marginBottom: 8 }}>
                AquaTeach
              </h1>
              <p style={{ fontSize: 16, color: 'var(--white)', fontWeight: 600, marginBottom: 6 }}>
                Toolkit Pembelajaran Interaktif untuk Perkuliahan
              </p>
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                9 metode pedagogi aktif — dari ice breaking ringan hingga diskusi mendalam berbasis kasus.<br />
                Dirancang untuk Manajemen Sumberdaya Perairan, siap untuk semua rumpun sains.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { num: '9', label: 'Tools Aktif', color: 'var(--teal)' },
          { num: '3', label: 'Layer Pedagogi', color: 'var(--gold)' },
          { num: '∞', label: 'Sesi Tersimpan', color: '#a78bfa' },
        ].map(({ num, label, color }) => (
          <div key={label} className="stat-chip" style={{ flex: 1, minWidth: 110 }}>
            <div className="stat-chip-num" style={{ color }}>{num}</div>
            <div className="stat-chip-label">{label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: 'var(--font-h)', fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 16 }}>
          Pilih Tool
        </div>
        <div className="tool-grid">
          {TOOLS.map((tool, i) => (
            <div key={tool.id} className="tool-card anim-fade-up"
              onClick={() => onNavigate(tool.id)}
              style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="tool-card-icon">{tool.icon}</div>
              <div className="tool-card-title">{tool.title}</div>
              <div className="tool-card-desc">{tool.desc}</div>
              <div className="tool-card-tags">
                {tool.tags.map(t => <span key={t}>{t}</span>)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-muted" style={{ fontSize: 10.5 }}>⏱ {tool.time}</span>
                <span className={`badge ${tool.difficulty === 'Mudah' ? 'badge-success' : 'badge-gold'}`} style={{ fontSize: 10.5 }}>
                  {tool.difficulty}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card mt-24" style={{ background: 'linear-gradient(135deg, rgba(255,200,71,0.06), transparent)', borderColor: 'rgba(255,200,71,0.15)' }}>
        <div style={{ fontFamily: 'var(--font-h)', fontSize: 14, fontWeight: 700, color: 'var(--gold)', marginBottom: 12 }}>
          💡 Rekomendasi Urutan 90 Menit
        </div>
        <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap' }}>
          {[
            { phase: 'Pembuka', time: '5m', tool: 'Word Cloud / Prediction', icon: '🔮' },
            { phase: 'Aktivasi', time: '10m', tool: 'Think–Pair–Share', icon: '🤝' },
            { phase: 'Inti', time: '45m', tool: 'Case Trigger + Diskusi', icon: '💼' },
            { phase: 'Cek Paham', time: '15m', tool: 'Quick Quiz / Misconception', icon: '🎯' },
            { phase: 'Penutup', time: '10m', tool: 'One-Minute Paper', icon: '📝' },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, minWidth: 140, display: 'flex', gap: 0 }}>
              <div style={{ textAlign: 'center', padding: '12px 8px' }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontFamily: 'var(--font-h)', fontWeight: 800, fontSize: 11, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>{s.phase}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{s.time}</div>
                <div style={{ fontSize: 11, color: 'var(--white)', fontWeight: 600, lineHeight: 1.4 }}>{s.tool}</div>
              </div>
              {i < 4 && <div style={{ display: 'flex', alignItems: 'center', color: 'var(--border2)', fontSize: 18, padding: '0 4px' }}>→</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home
