import { useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function HasilPositif() {
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
    hasil = 'Positif',
    probabilitas = 0.0,
    identitas,
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
      if (!identitas || hasSavedData.current || sessionStorage.getItem(screeningKey)) {
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

        const response = await fetch('http://localhost:5000/submit-screening', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
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
          }),
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
    const pesan = `Halo, saya ${nama}. Saya ingin konsultasi mengenai hasil screening TBC saya.`;
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
          TBC bisa menular dan berbahaya jika tidak ditangani.
          <br />
          Segera periksa ke layanan kesehatan terdekat.
        </p>

        <div
          className="card mx-auto p-4"
          style={{ maxWidth: '500px', backgroundColor: '#fff3f3' }}
        >
          <img
            src="/assets/images/Sakit.png"
            alt="Sakit"
            className="img-fluid mb-3 mx-auto d-block"
            style={{ maxWidth: 160 }}
          />
          <div className="bg-white shadow-sm rounded p-3 mb-3">
            <h5 className="mb-1 fw-bold">{nama}</h5>
            <small className="text-muted">{tanggalFormatted}</small>
          </div>

          <h5 className="text-danger fw-bold mb-2">Anda Terduga TBC</h5>
          <p className="mb-0">
            Probabilitas: {(parseFloat(probabilitas) * 100).toFixed(2)}%
          </p>
        </div>

        <p className="mt-4 text-muted">
          Segera periksa ke Puskesmas atau RS terdekat untuk memastikan diagnosis dan mendapatkan pengobatan yang tepat.
        </p>

        <div className="d-grid gap-3 mt-4 col-10 col-md-6 mx-auto">
          <button className="btn btn-danger" onClick={handleHubungiKami}>
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