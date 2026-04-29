import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

// ⚠️ SETUP: Ganti nilai di bawah dengan konfigurasi Firebase Anda
// Atau gunakan environment variables di Vercel:
//   VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, dst.
// Lihat README.md untuk panduan lengkap.

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || 'PASTE_API_KEY_HERE',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || 'your-project.firebaseapp.com',
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL       || 'https://your-project-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || 'your-project',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || 'your-project.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '1:000000000000:web:000000000000',
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
