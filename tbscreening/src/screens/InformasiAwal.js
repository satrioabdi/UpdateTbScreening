import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function InformasiAwal() {
  const navigate = useNavigate();
  const [nama, setNama] = useState('');
  const [nik, setNik] = useState('');

  // ✅ Cek login saat halaman dimuat
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      navigate('/login', {
        state: { redirectTo: '/informasi-awal' },
      });
    }
  }, [navigate]);

  const showAlert = (title, message) => {
    window.alert(`${title}\n\n${message}`);
  };

  const handleNext = () => {
    if (!nama.trim()) {
      showAlert('Validasi Gagal', 'Nama lengkap harus diisi.');
      return;
    }

    if (nik.length < 16) {
      showAlert('Validasi Gagal', 'NIK harus minimal 16 digit.');
      return;
    }

    navigate('/identitas-awal', {
      state: {
        namaLengkap: nama,
        nomorNIK: nik,
      },
    });
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Header />

      <div className="container flex-grow-1 py-4">
        <h1 className="text-center text-danger fw-bold mb-3">SCREENING TBC</h1>
        <p className="text-center mb-4">
          TBC itu bisa diobati kok. Telaten minum obat dan rutin kontrol. Jangan takut untuk memeriksakan diri!
        </p>

        <div className="card border-danger shadow mx-auto" style={{ maxWidth: '500px' }}>
          <div className="card-body">
            <h5 className="card-title text-danger fw-bold mb-3">Identitas Awal</h5>

            <div className="mb-3">
              <label className="form-label">Nama Lengkap</label>
              <input
                type="text"
                className="form-control"
                placeholder="Masukkan nama lengkap Anda"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Nomor Induk Kependudukan (NIK)</label>
              <input
                type="text"
                className="form-control"
                placeholder="Masukkan NIK (16 digit)"
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/[^0-9]/g, ''))}
                maxLength={16}
              />
            </div>

            <button className="btn btn-danger w-100" onClick={handleNext}>
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
