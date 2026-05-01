import React, { useState, useEffect } from 'react';
// Pastikan db di bawah ini berasal dari getDatabase() di file firebase.js kamu
import { db } from '../firebase'; 
import { ref, onValue, push, set, off } from 'firebase/database';

const PredictionQuestion = ({ roomId, isPresenter, question }) => {
  // State untuk menyimpan teks yang sedang diketik siswa
  const [answer, setAnswer] = useState('');
  // State untuk menyimpan daftar semua jawaban yang masuk (untuk presenter)
  const [liveAnswers, setLiveAnswers] = useState([]);

  // ----------------------------------------------------
  // LOGIKA PRESENTER: Mendengarkan database secara Realtime
  // ----------------------------------------------------
  useEffect(() => {
    // Jika tidak ada ID ruangan atau ini layar murid, tidak perlu mendengarkan semua data
    if (!roomId || !isPresenter) return;

    // Menentukan "cabang" di pohon JSON tempat jawaban disimpan
    const answersRef = ref(db, `rooms/${roomId}/answers`);
    
    // onValue akan otomatis terpanggil setiap kali ada data baru masuk ke cabang tersebut
    const unsubscribe = onValue(answersRef, (snapshot) => {
      const data = snapshot.val();
      const answersArray = [];
      
      // Jika ada data (tidak kosong), kita ubah format objek JSON menjadi array biasa
      if (data) {
        // Mengambil semua nilai (jawaban) dari masing-masing ID unik yang dibuat oleh push()
        Object.values(data).forEach((item) => {
          answersArray.push(item.text);
        });
      }
      
      // Memperbarui layar presenter dengan daftar jawaban terbaru
      setLiveAnswers(answersArray); 
    });

    // Membersihkan pendengar (listener) jika guru menutup halaman ini
    return () => {
      off(answersRef, 'value', unsubscribe);
    };
  }, [roomId, isPresenter]);

  // ----------------------------------------------------
  // LOGIKA SISWA: Mengirim jawaban baru ke pohon JSON
  // ----------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault(); // Mencegah halaman termuat ulang saat tombol ditekan
    if (!answer.trim()) return; // Jangan kirim jika murid hanya mengetik spasi kosong

    try {
      // Menunjuk ke cabang yang sama dengan presenter
      const answersRef = ref(db, `rooms/${roomId}/answers`);
      // push() membuat "ranting" baru dengan ID acak agar data tidak saling menimpa
      const newAnswerRef = push(answersRef); 
      
      // set() memasukkan data jawaban ke dalam ranting baru tersebut
      await set(newAnswerRef, {
        text: answer,
        timestamp: Date.now() // Menyimpan waktu pengiriman
      });
      
      setAnswer(''); // Mengosongkan kotak ketik agar murid bisa menjawab lagi jika mau
      alert('Jawabanmu berhasil dikirim!'); 
    } catch (error) {
      console.error("Terjadi kesalahan saat mengirim jawaban: ", error);
    }
  };

  // ----------------------------------------------------
  // TAMPILAN PRESENTER
  // ----------------------------------------------------
  if (isPresenter) {
    return (
      <div className="p-8 text-center min-h-screen bg-gray-50">
        <h2 className="text-3xl font-bold mb-10 text-gray-800">{question}</h2>
        
        {/* Wadah untuk menampung gelembung kata */}
        <div className="flex flex-wrap justify-center items-center gap-4">
          {liveAnswers.length === 0 ? (
            <p className="text-gray-400 italic">Menunggu siswa mengetikkan jawaban...</p>
          ) : (
            liveAnswers.map((ans, index) => (
              <div 
                key={index} 
                className="bg-indigo-100 text-indigo-800 px-6 py-3 rounded-full text-xl shadow-md transition-all transform hover:scale-110"
              >
                {ans}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // TAMPILAN SISWA (STUDENT)
  // ----------------------------------------------------
  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">{question}</h2>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Ketik jawabanmu di sini..."
          className="border-2 border-gray-300 rounded-lg p-4 focus:outline-none focus:border-indigo-500 transition-colors"
          required
        />
        <button 
          type="submit" 
          className="bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Kirim Jawaban
        </button>
      </form>
    </div>
  );
};

export default PredictionQuestion;
