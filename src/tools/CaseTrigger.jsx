import { useState } from 'react'

const PRESET_CASES = [
  {
    title: 'Dilema Ukuran Tangkap',
    scenario: 'Seorang nelayan di Selat Bali menangkap ikan cakalang berukuran kecil (rata-rata 200g) dalam jumlah besar — sekitar 2 ton per trip. Secara ekonomi, penghasilan hariannya meningkat 40% dibanding bulan lalu. Namun, data survei dari BPPL menunjukkan bahwa 80% tangkapannya belum mencapai panjang pertama kali matang gonad (Lm).',
    questions: [
      'Apa konflik kepentingan yang terjadi dalam kasus ini?',
      'Dari perspektif MEY (Maximum Economic Yield), apakah strategi nelayan ini berkelanjutan?',
      'Kebijakan apa yang dapat diterapkan pemerintah tanpa merugikan nelayan secara drastis?',
    ],
    tags: ['Fisheries Economics', 'Biologi Perikanan', 'Kebijakan']
  },
  {
    title: 'Konflik Tata Ruang Laut',
    scenario: 'Kawasan teluk di WPP 713 yang selama puluhan tahun menjadi fishing ground nelayan tradisional kini ditetapkan sebagai zona budidaya intensif oleh pemerintah provinsi. Investor swasta telah mendapat izin KJA (Keramba Jaring Apung) seluas 200 ha. Nelayan lokal tidak dilibatkan dalam konsultasi publik. Komunitas Bendega setempat menyatakan kawasan ini adalah awigawig mereka.',
    questions: [
      'Dari perspektif Coastal Spatial Governance, apa yang salah dalam proses ini?',
      'Bagaimana hak ulayat laut (awigawig) berinteraksi dengan izin negara?',
      'Siapa saja stakeholder yang seharusnya dilibatkan dan bagaimana mekanismenya?',
    ],
    tags: ['Tata Ruang Laut', 'Kelembagaan', 'Hukum Perikanan']
  },
  {
    title: 'Kasus Teripang Pasir',
    scenario: 'Harga teripang pasir (Holothuria scabra) di pasar ekspor melonjak 300% dalam 2 tahun terakhir. Akibatnya, intensitas penangkapan meningkat drastis. Seorang pengepul lokal menawarkan harga premium kepada nelayan yang bisa menyuplai >50 kg basah per minggu. Beberapa nelayan mulai menggunakan kompresor selam untuk mengakses habitat lebih dalam, berpotensi merusak terumbu karang sekitarnya.',
    questions: [
      'Apa indikator bahwa telah terjadi market-driven overfishing pada kasus ini?',
      'Hitung potensi kehilangan nilai ekonomi ekosistem jika terumbu karang rusak (berikan asumsi Anda)',
      'Instrumen ekonomi apa (pajak, kuota, sertifikasi) yang paling tepat diterapkan?',
    ],
    tags: ['Ekonomi Sumberdaya', 'Teripang', 'Valuasi Ekosistem']
  },
]

function CaseTrigger() {
  const [phase, setPhase] = useState('setup')
  const [title, setTitle] = useState('')
  const [scenario, setScenario] = useState('')
  const [questions, setQuestions] = useState(['', ''])
  const [tags, setTags] = useState('')
  const [timer, setTimer] = useState(10)
  const [presentMode, setPresentMode] = useState(false)

  const loadPreset = (i) => {
    setTitle(PRESET_CASES[i].title)
    setScenario(PRESET_CASES[i].scenario)
    setQuestions(PRESET_CASES[i].questions)
    setTags(PRESET_CASES[i].tags.join(', '))
  }

  const addQ = () => setQuestions([...questions, ''])
  const removeQ = (i) => { if (questions.length > 1) setQuestions(questions.filter((_, idx) => idx !== i)) }
  const updateQ = (i, v) => setQuestions(questions.map((q, idx) => idx === i ? v : q))

  const start = () => {
    if (!scenario.trim()) return
    setPhase('active')
  }

  const reset = () => {
    setPhase('setup'); setTitle(''); setScenario(''); setQuestions(['', '']); setTags('')
  }

  const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)

  const CaseDisplay = ({ big }) => (
    <div>
      {title && (
        <div style={{ fontFamily: 'var(--font-h)', fontSize: big ? 26 : 18, fontWeight: 800, color: 'var(--gold)', marginBottom: 16 }}>
          📋 {title}
        </div>
      )}
      <div className="case-card mb-20">
        {tagList.length > 0 && (
          <div className="flex-wrap mb-16">
            {tagList.map((t, i) => <span key={i} className="badge badge-gold">{t}</span>)}
          </div>
        )}
        <div className="case-scenario" style={{ fontSize: big ? 17 : 15 }}>{scenario}</div>
      </div>
      <div style={{ fontFamily: 'var(--font-h)', fontSize: big ? 16 : 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>
        Pertanyaan Diskusi
      </div>
      {questions.filter(q => q.trim()).map((q, i) => (
        <div key={i} className="discussion-prompt">
          <div className="dp-num">{i + 1}</div>
          <span style={{ fontSize: big ? 15 : 14 }}>{q}</span>
        </div>
      ))}
    </div>
  )

  return (
    <>
      {presentMode && (
        <div className="present-mode">
          <button className="btn btn-outline btn-sm present-close" onClick={() => setPresentMode(false)}>✕ Tutup</button>
          <div style={{ maxWidth: 760, margin: '0 auto', width: '100%', padding: '20px 0' }}>
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 18, fontWeight: 800, color: 'var(--teal)', marginBottom: 24 }}>
              💼 Case Trigger — Diskusi Kelompok
            </div>
            <CaseDisplay big />
            <div style={{ marginTop: 32, background: 'var(--card)', borderRadius: 'var(--r)', padding: '16px 20px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>⏱ Waktu diskusi: <strong style={{ color: 'var(--gold)' }}>{timer} menit</strong> · Siapkan 1 juru bicara per kelompok</div>
            </div>
          </div>
        </div>
      )}

      <div className="page-hdr">
        <div className="page-hdr-top">
          <div className="page-hdr-icon">💼</div>
          <div>
            <h2>Case Trigger</h2>
            <p>Mini kasus nyata yang memicu diskusi mendalam — hubungkan teori dengan realita lapangan</p>
          </div>
        </div>
      </div>

      {phase === 'setup' && (
        <div className="anim-fade-up">
          <div className="card mb-16">
            <div className="form-label mb-12">Contoh Kasus MSP/Perikanan</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PRESET_CASES.map((p, i) => (
                <button key={i} className="btn btn-outline btn-sm" onClick={() => loadPreset(i)}>
                  {p.title}
                </button>
              ))}
            </div>
          </div>
          <div className="card mb-16">
            <div className="form-group">
              <label className="form-label">Judul Kasus (opsional)</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Contoh: Dilema Ukuran Tangkap di Selat Bali" />
            </div>
            <div className="form-group">
              <label className="form-label">Tag Mata Kuliah</label>
              <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="Contoh: Ekonomi Perikanan, MSP, Kebijakan (pisah koma)" />
            </div>
            <div className="form-group">
              <label className="form-label">Narasi Kasus</label>
              <textarea value={scenario} onChange={e => setScenario(e.target.value)}
                placeholder="Deskripsikan situasi/kasus (2-4 paragraf). Sertakan angka, konteks lokasi, dan karakter yang terlibat untuk membuat kasus lebih hidup..." rows={6} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Pertanyaan Diskusi</label>
              {questions.map((q, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <div className="dp-num" style={{ marginTop: 10 }}>{i + 1}</div>
                  <textarea value={q} onChange={e => updateQ(i, e.target.value)}
                    placeholder={`Pertanyaan diskusi #${i + 1}`} rows={2} style={{ flex: 1 }} />
                  {questions.length > 1 && (
                    <button className="btn btn-ghost btn-sm" onClick={() => removeQ(i)} style={{ alignSelf: 'flex-start', marginTop: 8 }}>✕</button>
                  )}
                </div>
              ))}
              <button className="btn btn-outline btn-sm mt-8" onClick={addQ}>+ Tambah Pertanyaan</button>
            </div>
          </div>
          <div className="card mb-16">
            <div className="form-label mb-12">Waktu Diskusi Kelompok</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[5, 7, 10, 15, 20].map(t => (
                <button key={t} onClick={() => setTimer(t)}
                  className={`btn ${timer === t ? 'btn-gold' : 'btn-outline'} btn-sm`}>
                  {t} menit
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-teal btn-lg btn-block" onClick={start} disabled={!scenario.trim() || !questions.filter(q => q.trim()).length}>
            💼 Tampilkan Kasus
          </button>
        </div>
      )}

      {phase === 'active' && (
        <div className="anim-fade-up">
          <div className="card mb-16">
            <CaseDisplay />
          </div>
          <div className="card mb-16" style={{ background: 'linear-gradient(135deg, rgba(255,200,71,0.08), rgba(255,200,71,0.02))', borderColor: 'rgba(255,200,71,0.2)' }}>
            <div className="flex-between">
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--gold)', marginBottom: 4 }}>⏱ Panduan Diskusi</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                  Waktu: <strong style={{ color: 'var(--gold)' }}>{timer} menit</strong> · Setiap kelompok 3-4 mahasiswa · Siapkan 1 juru bicara
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-h)', fontSize: 28, fontWeight: 800, color: 'var(--gold)' }}>
                {timer}m
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-teal" onClick={() => setPresentMode(true)}>⛶ Mode Presentasi</button>
            <button className="btn btn-outline" onClick={() => setPhase('setup')}>← Edit Kasus</button>
            <button className="btn btn-ghost" onClick={reset}>🔄 Kasus Baru</button>
          </div>
        </div>
      )}
    </>
  )
}

export default CaseTrigger
