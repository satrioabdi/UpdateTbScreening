import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [currentRole, setCurrentRole] = useState('user');
  const navigate = useNavigate();

  useEffect(() => {
    const savedRole = localStorage.getItem('role');
    if (savedRole) setCurrentRole(savedRole);
  }, []);

  const showAlert = (title, message, callback) => {
    alert(`${title}\n\n${message}`);
    if (callback) callback();
  };

  const handleRegister = async () => {
    if (!username || !password) {
      showAlert('Error', 'Semua field wajib diisi.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          role,
          current_user_role: currentRole,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        showAlert('Sukses', 'Registrasi berhasil', () => {
          setUsername('');
          setPassword('');
          navigate('/login');
        });
      } else {
        showAlert('Gagal', result.message || 'Terjadi kesalahan saat registrasi.');
      }
    } catch (error) {
      showAlert('Error', 'Tidak dapat terhubung ke server.');
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: 500 }}>
      <h3 className="text-center text-danger mb-4">Form Registrasi</h3>

      <div className="mb-3">
        <input
          type="text"
          placeholder="Username"
          className="form-control"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <input
          type="password"
          placeholder="Password"
          className="form-control"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {currentRole === 'admin' && (
        <div className="mb-3">
          <label className="form-label">Pilih Role:</label>
          <div className="d-flex gap-3">
            <button
              className={`btn btn-outline-secondary ${role === 'user' ? 'active' : ''}`}
              onClick={() => setRole('user')}
            >
              User
            </button>
            <button
              className={`btn btn-outline-secondary ${role === 'admin' ? 'active' : ''}`}
              onClick={() => setRole('admin')}
            >
              Admin
            </button>
          </div>
        </div>
      )}

      <button className="btn btn-danger w-100" onClick={handleRegister}>
        Daftar
      </button>
    </div>
  );
}
