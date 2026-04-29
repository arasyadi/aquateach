# 🐟 AquaTeach v1.1

Interactive Learning Toolkit — FKP Universitas Udayana  
MSP — Manajemen Sumberdaya Perairan

---

## 🔴 Fitur Baru: Go Live (Room Code + Firebase)

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
├── firebase.js          # Konfigurasi Firebase
├── hooks/
│   └── useRoom.js       # Room management (create, listen, submit)
├── pages/
│   ├── Home.jsx         # Dashboard dosen
│   └── StudentJoin.jsx  # Halaman mahasiswa (/?join&room=XXXX)
└── tools/
    ├── Polling.jsx      # Live Polling (+ Go Live)
    ├── WordCloud.jsx    # Word Cloud (+ Go Live)
    └── ...              # Tools lainnya
```

---

## 🔗 URL Scheme

- **Dosen**: `https://aquateach.vercel.app/`  
- **Mahasiswa**: `https://aquateach.vercel.app/?join&room=ABCDEF`  
  (atau scan QR yang muncul saat Go Live)

