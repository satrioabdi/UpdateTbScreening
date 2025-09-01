import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import Header from '../components/Header';

export default function DataScreening() {
  const [data, setData] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const parsedUser = userData ? JSON.parse(userData) : null;

    if (!parsedUser) {
      navigate('/login');
      return;
    }

    setUserInfo(parsedUser);

    const fetchData = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/riwayat-screening?user_id=${parsedUser.user_id}&role=${parsedUser.role}`
        );
        const result = await response.json();

        if (response.ok) {
          setData(result);
        } else {
          console.error('Gagal memuat data:', result);
        }
      } catch (error) {
        console.error('Gagal mengambil data:', error);
      }
    };

    fetchData();
  }, [navigate]);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Yakin ingin menghapus data ini?');
    if (!confirmDelete) return;

    try {
      const response = await fetch(`http://localhost:5000/hapus-screening/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        alert('Data berhasil dihapus dari database');
        // Refresh data
        const user = JSON.parse(localStorage.getItem('user'));
        const updated = await fetch(
          `http://localhost:5000/riwayat-screening?user_id=${user.user_id}&role=${user.role}`
        );
        const updatedResult = await updated.json();
        setData(updatedResult);
      } else {
        alert(result.message || 'Gagal menghapus data');
      }
    } catch (error) {
      console.error('Gagal menghapus:', error);
      alert('Terjadi kesalahan saat menghapus data');
    }
  };

  const handleDetail = (item) => {
    navigate(`/detail/${item.id}`, { state: { item } });
  };

  const handleBack = () => {
    navigate('/MainMenu');
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <div className="container my-4 flex-grow-1">
        <div className="text-muted mb-3">
          Login sebagai: <strong>{userInfo?.username || 'Belum Login'}</strong>
        </div>

        {data.length === 0 ? (
          <div className="alert alert-info text-center">
            {userInfo ? 'Belum ada data screening.' : 'Memuat data...'}
          </div>
        ) : (
          data.map((item, index) => (
            <div key={index} className="card mb-3 shadow-sm">
              <div className="card-body">
                <h5 className="card-title">{item.nama_pasien}</h5>
                <p className="card-text mb-1">
                  <strong>Tanggal:</strong>{' '}
                  {item.tanggal_screening
                    ? new Date(item.tanggal_screening).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Tidak tersedia'}
                </p>
                <p className="card-text mb-1">
                  <strong>Probabilitas:</strong>{' '}
                  {(item.probabilitas * 100).toFixed(2)}%
                </p>
                <p className="card-text">
                  <strong>Hasil:</strong>{' '}
                  <span
                    style={{
                      color: item.hasil === 'Positif' ? 'red' : 'green',
                      fontWeight: 'bold',
                    }}
                  >
                    {item.hasil}
                  </span>
                </p>
                <div className="d-flex gap-2">
                  <button className="btn btn-primary" onClick={() => handleDetail(item)}>
                    Lihat Detail
                  </button>
                  {userInfo?.role === 'admin' && (
                    <button className="btn btn-danger" onClick={() => handleDelete(item.id)}>
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <Footer />
    </div>
  );
}
