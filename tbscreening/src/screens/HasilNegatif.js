import { useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { fieldKeys } from './fieldKeys'; // Pastikan path ini sesuai

export default function HasilNegatif() {
  const location = useLocation();
  const navigate = useNavigate();
  const hasSavedData = useRef(false);

  useEffect(() => {
    if (!location.state) {
      navigate('/mainmenu');
    }
  }, [location, navigate]);

  const {
    nama = 'Nama Tidak Diketahui',
    hasil = 'Negatif',
    probabilitas = 0.0,
    identitas,
    gejala,
    tanggal,
  } = location.state || {};

  const tanggalObj = useMemo(() => tanggal ? new Date(tanggal) : new Date(), [tanggal]);
  const tanggalScreening = tanggalObj.toISOString().split('T')[0];
  const tanggalFormatted = tanggalObj.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const screeningKey = `submitted-${identitas?.nik}-${tanggalScreening}`;

  useEffect(() => {
    const simpanData = async () => {
      if (!identitas || !gejala || hasSavedData.current || sessionStorage.getItem(screeningKey)) {
        return;
      }

      hasSavedData.current = true;

      try {
        const userRaw = localStorage.getItem('user');
        const user = JSON.parse(userRaw);

        if (!user?.user_id) {
          alert('Anda belum login. Silakan login terlebih dahulu.');
          navigate('/login');
          return;
        }

        // Susun payload dengan field flat (tanpa gejala object)
        const payload = {
          user_id: parseInt(user.user_id),
          nama_pasien: identitas.nama,
          nik: identitas.nik,
          jenis_kelamin: identitas.jenisKelamin,
          no_hp: identitas.telepon,
          usia: identitas.usia,
          alamat: identitas.alamat,
          hasil,
          catatan: '',
          probabilitas: parseFloat(probabilitas),
          tanggal_screening: tanggalScreening,
        };

        // Tambahkan masing-masing gejala sebagai field boolean
        fieldKeys.forEach((key) => {
          payload[key] = gejala[key] ? 1 : 0;
        });

        const response = await fetch('http://localhost:5000/submit-screening', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.status === 409) {
          sessionStorage.setItem(screeningKey, 'true');
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        sessionStorage.setItem(screeningKey, 'true');
        console.log('✅ Data screening berhasil disimpan.');
      } catch (error) {
        console.error('🔥 Gagal menyimpan data:', error);
        hasSavedData.current = false;
        alert('Gagal menyimpan data screening. Silakan coba lagi nanti.');
      }
    };

    simpanData();
  }, []);

  const handleHubungiKami = () => {
    const nomorWA = '6281274489306';
    const pesan = `Halo, saya ${nama}. Saya ingin konsultasi tentang hasil screening TBC saya.`;
    const url = `https://wa.me/${nomorWA}?text=${encodeURIComponent(pesan)}`;
    window.open(url, '_blank');
  };

  const handleKembali = () => {
    navigate('/mainmenu');
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />

      <div className="container my-5 flex-grow-1 text-center">
        <h2 className="text-danger fw-bold">SCREENING TBC</h2>
        <p>
          TBC itu bisa diobati kok, telaten minum obat dan rutin kontrol.
          <br />
          Jangan takut untuk memeriksakan diri!
        </p>

        <div
          className="card mx-auto p-4"
          style={{ maxWidth: '500px', backgroundColor: '#f8f9fa' }}
        >
          <img
            src="/assets/images/Sehat.png"
            alt="Sehat"
            className="img-fluid mb-3 mx-auto d-block"
            style={{ maxWidth: 160 }}
          />
          <div className="bg-white shadow-sm rounded p-3 mb-3">
            <h5 className="mb-1 fw-bold">{nama}</h5>
            <small className="text-muted">{tanggalFormatted}</small>
          </div>

          <h5 className="text-success fw-bold mb-2">Anda Tidak Terduga TBC</h5>
          <p className="mb-0">
            Probabilitas: {(parseFloat(probabilitas) * 100).toFixed(2)}%
          </p>
        </div>

        <p className="mt-4 text-muted">
          Tetap jaga kesehatan dan lakukan pemeriksaan rutin bila diperlukan!
        </p>

        <div className="d-grid gap-3 mt-4 col-10 col-md-6 mx-auto">
          <button className="btn btn-success" onClick={handleHubungiKami}>
            Hubungi Kami
          </button>
          <button className="btn btn-outline-secondary" onClick={handleKembali}>
            Kembali ke Halaman Awal
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
