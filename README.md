# 🐟 AquaTeach v1.2
Interactive Learning Toolkit — FKP Universitas Udayana  
MSP — Manajemen Sumberdaya Perairan

---

## 🆕 Changelog

### v1.2 — QR Click-to-Enlarge & Opinion Line Go Live
- **QR Modal** — semua QR code kini bisa diklik untuk memperbesar di tengah layar, lengkap dengan pertanyaan/pernyataan di atasnya (berguna saat pembuka sebelum ice breaking)
- **Opinion Line** kini mendukung mode **Go Live** (sebelumnya manual only)
- Komponen baru: `src/components/QRModal.jsx` (shared across semua tool)

### v1.1 — Go Live (Room Code + Firebase)
- Live Polling dan Word Cloud mendukung sesi real-time via QR
- Integrasi Firebase Realtime Database
- Halaman mahasiswa (`StudentJoin.jsx`)

---

## 🔴 Fitur: Go Live (Room Code + Firebase)

Dosen klik **Go Live** → mahasiswa scan QR dari HP → semua input masuk real-time.

### Cara Kerja
```
Dosen: buka tool → klik "Go Live" → dapat kode room + QR
Mahasiswa: scan QR / buka link → input dari HP
Firebase: sinkron real-time antara semua perangkat
```

### Tools yang Mendukung Go Live

| Tool | Mode Live | Input Mahasiswa |
|------|-----------|-----------------|
| 📊 Live Polling | ✅ | Pilih 1 opsi |
| ☁️ Word Cloud | ✅ | Submit kata |
| 📍 Opinion Line | ✅ | Setuju / Netral / Tidak Setuju |

---

## 🔍 Fitur: QR Click-to-Enlarge

Saat sesi Go Live aktif, klik QR code di mana saja untuk membuka modal besar di tengah layar.

### Isi Modal
- Badge **"SCAN UNTUK BERGABUNG"** berkedip real-time
- **Pernyataan / pertanyaan** ditampilkan di atas QR — mahasiswa langsung tahu konteksnya sebelum scan
- QR code berukuran besar (240px) dengan efek glow
- Kode room dan URL sesi
- Counter suara / kata yang masuk secara live

### Cara Menutup Modal
- Klik tombol **✕ Tutup**
- Klik area gelap di luar modal
- Tekan tombol **Escape**

### Skenario Penggunaan
> Dosen membuka layar proyektor, klik QR → modal muncul besar di tengah → mahasiswa di kelas bisa scan sambil membaca pertanyaannya tanpa harus berpindah ke halaman lain.

---

## ⚙️ Setup Firebase (WAJIB untuk Go Live)

### 1. Buat Project Firebase
1. Buka [console.firebase.google.com](https://console.firebase.google.com)
2. Klik **Add project** → beri nama (misal: `aquateach-fkp`)
3. Di project, pilih **Build → Realtime Database**
4. Klik **Create Database** → pilih region `asia-southeast1 (Singapore)`
5. Mode: **Start in test mode** (untuk development)

### 2. Ambil Konfigurasi
1. Di Project Settings (⚙️) → **General** → scroll ke **Your apps**
2. Klik ikon **Web** (`</>`) → daftarkan app
3. Copy `firebaseConfig` yang muncul

### 3. Pasang Config di Aplikasi

**Cara A — Edit langsung** (development lokal):

Buka `src/firebase.js`, ganti nilai `firebaseConfig`:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "aquateach-fkp.firebaseapp.com",
  databaseURL: "https://aquateach-fkp-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "aquateach-fkp",
  storageBucket: "aquateach-fkp.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
}
```

**Cara B — Environment Variables** (Vercel deployment, direkomendasikan):

Di Vercel Dashboard → Project Settings → **Environment Variables**, tambahkan:

| Key | Value |
|-----|-------|
| `VITE_FIREBASE_API_KEY` | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `aquateach-fkp.firebaseapp.com` |
| `VITE_FIREBASE_DATABASE_URL` | `https://aquateach-fkp-default-rtdb.asia-southeast1.firebasedatabase.app` |
| `VITE_FIREBASE_PROJECT_ID` | `aquateach-fkp` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `aquateach-fkp.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789012` |
| `VITE_FIREBASE_APP_ID` | `1:123456789012:web:abc...` |

### 4. Rules Firebase (Produksi)
Di Firebase Console → Realtime Database → **Rules**, pasang:
```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

---

## 🚀 Development
```bash
npm install
npm run dev
```

## 📦 Build & Deploy
```bash
npm run build
# Deploy ke Vercel: vercel --prod
```

---

## 📁 Struktur Proyek

```
src/
├── firebase.js              # Konfigurasi Firebase
├── components/
│   └── QRModal.jsx          # [v1.2] Modal QR click-to-enlarge (shared)
├── hooks/
│   └── useRoom.js           # Room management (create, listen, submit)
├── pages/
│   ├── Home.jsx             # Dashboard dosen
│   └── StudentJoin.jsx      # Halaman mahasiswa (/?join&room=XXXX)
└── tools/
    ├── Polling.jsx          # Live Polling (+ Go Live + QR Modal)
    ├── WordCloud.jsx        # Word Cloud (+ Go Live + QR Modal)
    ├── OpinionLine.jsx      # Opinion Line (+ Go Live [v1.2] + QR Modal)
    └── ...                  # Tools lainnya
```

### Komponen `QRModal.jsx`

Ekspor dua komponen dari file yang sama:

| Ekspor | Tipe | Kegunaan |
|--------|------|----------|
| `default QRModal` | Component | Modal fullscreen, dipasang di root return setiap tool |
| `QRClickable` | Named export | Wrapper QR yang bisa diklik, menggantikan blok `<div><QRCodeSVG/></div>` |

**Props `QRModal`:**

| Prop | Tipe | Keterangan |
|------|------|------------|
| `open` | `boolean` | Tampil/sembunyikan modal |
| `onClose` | `function` | Callback saat modal ditutup |
| `value` | `string` | URL yang di-encode ke QR |
| `code` | `string` | Kode room (ditampilkan besar) |
| `question` | `string` | Pernyataan/pertanyaan (ditampilkan di atas QR) |
| `totalVotes` | `number?` | Opsional — counter suara/kata live |

---

## 🔗 URL Scheme

- **Dosen**: `https://aquateach.vercel.app/`
- **Mahasiswa**: `https://aquateach.vercel.app/?join&room=ABCDEF`  
  (atau scan QR yang muncul saat Go Live)
