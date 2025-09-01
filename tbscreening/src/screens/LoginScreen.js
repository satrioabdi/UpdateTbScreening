// src/screens/LoginScreen.js
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.redirectTo || null;
  const redirectParams = location.state?.params || {};

  const showAlert = (title, message) => {
    window.alert(`${title}\n\n${message}`);
  };

  const handleLogin = async () => {
    if (!username || !password) {
      showAlert('Login Gagal', 'Harap isi username dan password terlebih dahulu.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (response.ok && result.user) {
  const userData = {
    user_id: result.user.user_id,
    username: result.user.username,
    role: result.user.role || 'user',
  };

  localStorage.setItem('user', JSON.stringify(userData));

  showAlert('Login Berhasil', `Selamat datang, ${result.user.username}!`);

  if (redirectTo) {
    navigate(redirectTo, { state: redirectParams });
  } else {
    navigate('/mainmenu');
  }
} else {
        if (result.message) {
          showAlert('Login Gagal', result.message);
        } else if (response.status === 401) {
          showAlert('Login Gagal', 'Kata sandi salah.');
        } else if (response.status === 404) {
          showAlert('Login Gagal', 'Username tidak ditemukan.');
        } else {
          showAlert('Login Gagal', 'Terjadi kesalahan saat login.');
        }
      }
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Gagal terhubung ke server. Coba lagi nanti.');
    }
  };

  const goToRegister = () => {
    navigate('/register');
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Login</h2>

      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={styles.input}
        autoCapitalize="none"
      />

      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={styles.input}
      />

      <button style={styles.button} onClick={handleLogin}>
        Masuk
      </button>

      <div style={styles.link}>
        <button onClick={goToRegister} style={{ background: 'none', border: 'none', color: '#555' }}>
          Belum punya akun? Daftar di sini
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '400px',
    margin: 'auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: '24px',
    color: '#d10000',
    fontWeight: 'bold',
    marginBottom: '20px',
    textAlign: 'center',
  },
  input: {
    border: '1px solid #999',
    borderRadius: '6px',
    padding: '10px',
    marginBottom: '12px',
    fontSize: '16px',
  },
  button: {
    backgroundColor: '#d10000',
    color: '#fff',
    padding: '12px',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  link: {
    marginTop: '15px',
    textAlign: 'center',
  },
};
