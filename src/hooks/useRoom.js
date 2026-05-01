import { useEffect, useState } from 'react'
import { ref, set, get, push, update, onValue, off } from 'firebase/database'
import { db } from '../firebase'

// ─── Kode Room ───────────────────────────────────────────────────────────────

/** Generate 6-char room code, e.g. "KL7R2M" */
export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

/** URL untuk mahasiswa join room */
export function joinUrl(code) {
  return `${window.location.origin}/?join&room=${code}`
}

/** URL QR code via Google Charts API (no package needed) */
export function qrUrl(code, size = 220) {
  const url = encodeURIComponent(joinUrl(code))
  return `https://chart.googleapis.com/chart?chs=${size}x${size}&cht=qr&choe=UTF-8&chl=${url}`
}

// ─── Firebase Operations ─────────────────────────────────────────────────────

/** Buat room baru di Firebase */
export async function createRoom(code, data) {
  await set(ref(db, `rooms/${code}`), {
    ...data,
    phase: 'live',
    active: true,
    createdAt: Date.now(),
  })
}

/** Update field room */
export async function updateRoom(code, updates) {
  await update(ref(db, `rooms/${code}`), updates)
}

/** Tutup room (mahasiswa tidak bisa submit lagi) */
export async function closeRoom(code) {
  await update(ref(db, `rooms/${code}`), {
    active: false,
    phase: 'closed',
    closedAt: Date.now(),
  })
}

/** Ambil data room sekali (one-time read, untuk student join view) */
export async function getRoom(code) {
  const snap = await get(ref(db, `rooms/${code}`))
  return snap.exists() ? snap.val() : null
}

// ─── React Hook ──────────────────────────────────────────────────────────────

/** Listen real-time ke data room. Returns { data, loading, error } */
export function useListenRoom(code) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!code) { setLoading(false); return }
    const roomRef = ref(db, `rooms/${code}`)
    setLoading(true)
    setError(null)
    const unsub = onValue(
      roomRef,
      snap => { setData(snap.exists() ? snap.val() : null); setLoading(false) },
      err  => { setError(err.message); setLoading(false) }
    )
    return () => off(roomRef)
  }, [code])

  return { data, loading, error }
}

// ─── Student Submissions ─────────────────────────────────────────────────────

/** Mahasiswa submit vote untuk Polling */
export async function submitVote(code, optionIndex) {
  await push(ref(db, `rooms/${code}/votes`), {
    option: optionIndex,
    ts: Date.now(),
  })
}

/** Mahasiswa submit kata untuk WordCloud */
export async function submitWords(code, words) {
  await push(ref(db, `rooms/${code}/words`), {
    words,
    ts: Date.now(),
  })
}

/** Mahasiswa submit response untuk LiveOpenResponse */
export async function submitResponse(code, { name, text, time }) {
  await push(ref(db, `rooms/${code}/responses`), { name, text, time })
}

/** Mahasiswa submit response untuk OpinionLine */
export async function submitOpinion(code, side) {
  await push(ref(db, `rooms/${code}/opinions`), {
    side, // 'setuju' | 'netral' | 'tidak'
    ts: Date.now(),
  })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Hitung votes dari Firebase data → array of counts per option */
export function countVotes(roomData, optionCount) {
  const counts = new Array(optionCount).fill(0)
  if (!roomData?.votes) return counts
  Object.values(roomData.votes).forEach(v => {
    if (typeof v.option === 'number' && v.option < optionCount) counts[v.option]++
  })
  return counts
}

/** Flatten semua kata dari Firebase data → string[] */
export function flattenWords(roomData) {
  if (!roomData?.words) return []
  return Object.values(roomData.words).flatMap(v => v.words || [])
}

/** Flatten responses dari Firebase data → sorted array (newest first) */
export function flattenResponses(roomData) {
  if (!roomData?.responses) return []
  return Object.entries(roomData.responses)
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.time - a.time)
}

/** Hitung opinions dari Firebase data */
export function countOpinions(roomData) {
  const counts = { setuju: 0, netral: 0, tidak: 0 }
  if (!roomData?.opinions) return counts
  Object.values(roomData.opinions).forEach(v => {
    if (counts[v.side] !== undefined) counts[v.side]++
  })
  return counts
}

/** Cek localStorage apakah mahasiswa sudah submit di room ini */
export function hasSubmitted(code) {
  return localStorage.getItem(`submitted_${code}`) === '1'
}

/** Tandai sudah submit */
export function markSubmitted(code) {
  localStorage.setItem(`submitted_${code}`, '1')
}
