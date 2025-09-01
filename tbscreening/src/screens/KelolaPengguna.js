// src/pages/KelolaPengguna.js
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function KelolaPengguna() {
  const [pengguna, setPengguna] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', role: 'user' });
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchPengguna = async () => {
    try {
      const res = await fetch('http://localhost:5000/kelola-pengguna');
      if (!res.ok) throw new Error('Gagal mengambil data');
      const data = await res.json();
      setPengguna(data);
    } catch (err) {
      console.error('Gagal memuat data pengguna:', err);
      alert('Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const parsedUser = userData ? JSON.parse(userData) : null;
    if (!parsedUser || parsedUser.role !== 'admin') {
      alert('Akses ditolak. Hanya admin yang dapat mengakses.');
      navigate('/login');
      return;
    }
    setUserInfo(parsedUser);
    fetchPengguna();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const result = await res.json();
      if (res.ok) {
        alert('Pengguna berhasil ditambahkan');
        setForm({ username: '', password: '', role: 'user' });
        fetchPengguna();
      } else {
        alert(result.message || 'Gagal menambahkan pengguna');
      }
    } catch (err) {
      console.error('Error saat menambah pengguna:', err);
      alert('Terjadi kesalahan saat menambahkan pengguna');
    }
  };

  const handleHapus = async (id) => {
    if (!window.confirm('Yakin ingin menghapus pengguna ini?')) return;

    try {
      const res = await fetch(`http://localhost:5000/hapus-pengguna/${id}`, {
        method: 'DELETE',
      });

      const result = await res.json();
      if (res.ok) {
        alert('Pengguna berhasil dihapus');
        fetchPengguna();
      } else {
        alert(result.message || 'Gagal menghapus pengguna');
      }
    } catch (err) {
      console.error('Error saat menghapus:', err);
      alert('Terjadi kesalahan saat menghapus pengguna');
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <div className="container my-4 flex-grow-1">
        <h3 className="mb-3">Kelola Pengguna</h3>

        {/* Form Tambah Pengguna */}
        <form onSubmit={handleSubmit} className="mb-4 border rounded p-3 shadow-sm bg-light">
          <h5>Tambah Pengguna</h5>
          <div className="row">
            <div className="col-md-3">
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                className="form-control mb-2"
                placeholder="Username"
                required
              />
            </div>
            <div className="col-md-3">
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="form-control mb-2"
                placeholder="Password"
                required
              />
            </div>
            <div className="col-md-2">
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="form-select mb-2"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="col-md-2">
              <button type="submit" className="btn btn-success w-100 mb-2">
                Tambah
              </button>
            </div>
          </div>
        </form>

        {/* Tabel Pengguna */}
        {loading ? (
          <p>Memuat data pengguna...</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-striped align-middle text-center">
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pengguna.length > 0 ? (
                  pengguna.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.username}</td>
                      <td>{user.role}</td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleHapus(user.id)}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-muted">
                      Tidak ada data pengguna.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
