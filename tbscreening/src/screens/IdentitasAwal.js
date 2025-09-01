import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function IdentitasAwal() {
  const navigate = useNavigate();
  const location = useLocation();
  const { namaLengkap, nomorNIK } = location.state || {};

  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      alert('Silakan login terlebih dahulu sebelum melakukan screening.');
      navigate('/login', {
        state: {
          redirectTo: '/informasi-awal',
        },
      });
    } else {
      setLoading(false);
    }
  }, [navigate]);

  const handleNext = () => {
    if (!gender) {
      alert('Jenis kelamin harus dipilih.');
      return;
    }
    if (!phone.trim()) {
      alert('No Telepon harus diisi.');
      return;
    }
    if (!age.trim()) {
      alert('Usia harus diisi.');
      return;
    }
    if (!address.trim()) {
      alert('Alamat domisili harus diisi.');
      return;
    }

    const identitasLengkap = {
      nama: namaLengkap,
      nik: nomorNIK,
      jenisKelamin: gender === 'L' ? 'Laki-laki' : 'Perempuan',
      telepon: phone,
      usia: age,
      alamat: address,
    };

    navigate('/screening', { state: { identitas: identitasLengkap } });
  };

  if (loading) return null;

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
            <h5 className="card-title text-danger fw-bold mb-3">Identitas Lanjutan</h5>

            <div className="mb-3">
              <label className="form-label">Jenis Kelamin</label>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className={`btn ${gender === 'L' ? 'btn-danger' : 'btn-outline-secondary'}`}
                  onClick={() => setGender('L')}
                >
                  Laki-laki
                </button>
                <button
                  type="button"
                  className={`btn ${gender === 'P' ? 'btn-danger' : 'btn-outline-secondary'}`}
                  onClick={() => setGender('P')}
                >
                  Perempuan
                </button>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">No Telepon/HP</label>
              <input
                type="tel"
                className="form-control"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Usia (Tahun)</label>
              <input
                type="number"
                className="form-control"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Contoh: 25"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Alamat Domisili</label>
              <textarea
                className="form-control"
                rows="2"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Contoh: Jl. Jambangan no 107"
              />
            </div>

            <div className="d-flex justify-content-between">
              <button className="btn btn-secondary" onClick={() => navigate(-1)}>
                Sebelumnya
              </button>
              <button className="btn btn-danger" onClick={handleNext}>
                Selanjutnya
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
