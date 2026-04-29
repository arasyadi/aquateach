# 🐟 AquaTeach — Interactive Learning Toolkit

Toolkit pedagogi aktif untuk perkuliahan. 9 tools interaktif siap pakai.

## Tools yang Tersedia

| Tool | Fungsi | Durasi |
|------|--------|--------|
| 📊 Live Polling | Kumpulkan suara kelas real-time | 2–5 menit |
| ☁️ Word Cloud | Galeri persepsi kolektif | 3–8 menit |
| ⚡ Quick Quiz | Kuis countdown + reveal jawaban | 5–20 menit |
| 🤝 Think–Pair–Share | 3 fase berstruktur dengan timer | 10–20 menit |
| 📝 One-Minute Paper | Refleksi akhir sesi | 1–5 menit |
| 📍 Opinion Line | Setuju/Netral/Tidak Setuju | 3–10 menit |
| 💼 Case Trigger | Mini kasus diskusi mendalam | 10–25 menit |
| 🎯 Misconception Check | Jebakan Benar/Salah + bedah | 3–10 menit |
| 🔮 Prediction Question | Prediksi → bandingkan dengan ilmu | 5–15 menit |

## Deploy ke Vercel

### Cara 1: Via GitHub (Direkomendasikan)

1. Push folder ini ke GitHub repository baru
2. Buka [vercel.com](https://vercel.com) → **New Project**
3. Import repository dari GitHub
4. Vercel akan auto-detect Vite — klik **Deploy**
5. Selesai! URL siap dalam ~1 menit

### Cara 2: Via Vercel CLI

```bash
npm install -g vercel
cd aquateach
vercel
```

Ikuti prompt, pilih **Y** untuk semua default.

### Cara 3: Drag & Drop (Termudah)

```bash
npm run build
```

Lalu drag folder `dist/` ke [vercel.com/new](https://vercel.com/new).

## Development Lokal

```bash
npm install
npm run dev
```

Buka http://localhost:5173

## Struktur Project

```
aquateach/
├── src/
│   ├── pages/
│   │   └── Home.jsx          # Dashboard utama
│   ├── tools/
│   │   ├── Polling.jsx
│   │   ├── WordCloud.jsx
│   │   ├── QuickQuiz.jsx
│   │   ├── ThinkPairShare.jsx
│   │   ├── OneMinutePaper.jsx
│   │   ├── OpinionLine.jsx
│   │   ├── CaseTrigger.jsx
│   │   ├── MisconceptionCheck.jsx
│   │   └── PredictionQuestion.jsx
│   ├── App.jsx               # Layout + routing
│   ├── index.css             # Global styles
│   └── main.jsx
├── index.html
├── vite.config.js
├── vercel.json               # SPA routing config
└── package.json
```

## Kustomisasi

- **Tema warna**: Edit variabel CSS di `src/index.css` bagian `:root`
- **Tambah preset kasus**: Edit array `PRESET_CASES` di `CaseTrigger.jsx`
- **Logo/nama**: Edit `sb-logo` di `App.jsx`

## Catatan

- Data **tidak tersimpan** antar sesi (no backend) — by design untuk privasi
- Semua interaksi berjalan di browser dosen
- Tested: Chrome, Firefox, Safari, Edge
