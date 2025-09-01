import { useNavigate, useLocation } from 'react-router-dom';
import { informasiLainnyaQuestions, keluhanQuestions } from './question';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function ReviewJawaban() {
  const navigate = useNavigate();
  const location = useLocation();
  const { identitas = {}, screeningAnswers = {} } = location.state || {};

  const identitasData = [
    { label: 'Nama Lengkap', value: identitas.nama },
    { label: 'Nomor Induk Kependudukan (NIK)', value: identitas.nik },
    { label: 'Jenis Kelamin', value: identitas.jenisKelamin },
    { label: 'No Telepon', value: identitas.telepon },
    { label: 'Usia (Tahun)', value: identitas.usia },
    { label: 'Alamat Domisili', value: identitas.alamat },
  ];

  const keluhan = keluhanQuestions.map((q) => [q, screeningAnswers[q] || '-']);
  const informasiLainnya = informasiLainnyaQuestions.map((q) => [q, screeningAnswers[q] || '-']);

  const renderRow = (label, value, key) => (
    <div className="row border-bottom py-2" key={key}>
      <div className="col-6">{label}</div>
      <div className="col-6 text-end">{value}</div>
    </div>
  );

  const handleSubmit = async () => {
    try {
      const userRaw = localStorage.getItem('user');
      const user = userRaw ? JSON.parse(userRaw) : null;

      if (!user || !user.username || !user.user_id) {
        alert('Anda belum login. Silakan login terlebih dahulu.');
        navigate('/login', {
          state: {
            redirectTo: '/review',
            params: location.state,
          },
        });
        return;
      }

      const features = [...keluhan, ...informasiLainnya].map(([_, val]) => (val === 'Ya' ? 1 : 0));

      // Lakukan prediksi
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features }),
      });

      if (!response.ok) throw new Error('Gagal mendapatkan hasil screening.');

      const { prediction, probability } = await response.json();
      const hasil = prediction === 1 ? 'Positif' : 'Negatif';

      // Siapkan gejala untuk dikirim ke halaman hasil
      const gejala = {};
      [...keluhan, ...informasiLainnya].forEach(([q, val]) => {
        const key = q.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        gejala[key] = val === 'Ya' ? 1 : 0;
      });

      // Navigasi ke halaman hasil (belum menyimpan ke backend)
      navigate(prediction === 1 ? '/hasil-positif' : '/hasil-negatif', {
        state: {
          nama: identitas.nama,
          hasil,
          probabilitas: probability,
          identitas,
          gejala,
        },
      });
    } catch (error) {
      console.error('🔥 ERROR:', error);
      alert('Terjadi kesalahan saat mengirim data ke server.');
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />

      <div className="container my-5 flex-grow-1">
        <h2 className="text-center text-danger fw-bold">REVIEW JAWABAN SCREENING</h2>
        <p className="text-center">
          Pastikan jawaban Anda benar sebelum melanjutkan ke hasil prediksi.
        </p>

        <div className="card border-danger shadow-sm">
          <div className="card-body">
            <h5 className="text-danger fw-bold mb-3">Informasi Identitas</h5>
            {identitasData.map(({ label, value }, i) => renderRow(label, value, `identitas-${i}`))}

            <h5 className="text-danger fw-bold mt-4 mb-3">Keluhan Yang Dirasakan</h5>
            {keluhan.map(([label, value], i) =>
              renderRow(`${i + 1}. ${label}`, value, `keluhan-${i}`)
            )}

            <h5 className="text-danger fw-bold mt-4 mb-3">Informasi Lainnya</h5>
            {informasiLainnya.map(([label, value], i) =>
              renderRow(`${i + keluhan.length + 1}. ${label}`, value, `info-${i}`)
            )}

            <div className="d-flex justify-content-center mt-4 gap-3">
              <button className="btn btn-secondary" onClick={() => navigate(-1)}>Edit</button>
              <button className="btn btn-danger" onClick={handleSubmit}>Lanjut ke Hasil</button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
