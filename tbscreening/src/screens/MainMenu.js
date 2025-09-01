import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function MainMenu() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(null);
    }
  }, []);

  const handleScreening = () => {
    if (!user) {
      navigate('/login', {
        state: { redirectTo: '/informasi-awal' },
      });
    } else {
      navigate('/informasi-awal');
    }
  };

  const handleRiwayat = () => {
    navigate('/riwayat');
  };

  const handleKelolaUser = () => {
    navigate('/kelola-pengguna'); // ✅ Perubahan di sini
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    navigate('/');
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header title="Menu Utama" showLogin={!user} />

      <div className="container my-5 flex-grow-1">
        <h2 className="text-center fw-bold mb-4">Selamat Datang di Aplikasi Deteksi TBC</h2>
        {user && (
          <p className="text-center text-muted">
            Login sebagai: <strong>{user.username}</strong>
          </p>
        )}
        <p className="text-center text-muted">
          Silakan pilih salah satu opsi di bawah ini untuk melanjutkan.
        </p>

        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 mt-4">
          {/* Tombol Screening */}
          <div className="col">
            <div
              className="card h-100 text-center p-3 shadow-sm border-0"
              onClick={handleScreening}
              style={{ cursor: 'pointer' }}
            >
              <img
                src="/assets/images/screening.png"
                className="card-img-top mx-auto"
                alt="Screening"
                style={{ maxWidth: 120 }}
              />
              <div className="card-body">
                <h5 className="card-title fw-bold">Screening TBC</h5>
                <p className="card-text">Lakukan pemeriksaan awal untuk mendeteksi potensi TBC.</p>
              </div>
            </div>
          </div>

          {/* Tombol Riwayat */}
          {user && (
            <div className="col">
              <div
                className="card h-100 text-center p-3 shadow-sm border-0"
                onClick={handleRiwayat}
                style={{ cursor: 'pointer' }}
              >
                <img
                  src="/assets/images/history.png"
                  className="card-img-top mx-auto"
                  alt="Riwayat"
                  style={{ maxWidth: 120 }}
                />
                <div className="card-body">
                  <h5 className="card-title fw-bold">Riwayat Pemeriksaan</h5>
                  <p className="card-text">Lihat kembali data hasil screening Anda.</p>
                </div>
              </div>
            </div>
          )}

          {/* Tombol Admin - Kelola Pengguna */}
          {user?.role === 'admin' && (
            <div className="col">
              <div
                className="card h-100 text-center p-3 shadow-sm border-0"
                onClick={handleKelolaUser}
                style={{ cursor: 'pointer' }}
              >
                <img
                  src="/assets/images/admin.png"
                  className="card-img-top mx-auto"
                  alt="Admin"
                  style={{ maxWidth: 120 }}
                />
                <div className="card-body">
                  <h5 className="card-title fw-bold">Kelola Pengguna</h5>
                  <p className="card-text">Lihat dan atur akun pengguna lainnya.</p>
                </div>
              </div>
            </div>
          )}

          {/* Tombol Logout */}
          {user && (
            <div className="col">
              <div
                className="card h-100 text-center p-3 shadow-sm border-0 bg-light"
                onClick={handleLogout}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-body">
                  <h5 className="card-title fw-bold text-danger">Keluar</h5>
                  <p className="card-text text-muted">Keluar dari aplikasi</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
