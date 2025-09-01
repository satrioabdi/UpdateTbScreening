// src/App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Screens
import MainMenu from './screens/MainMenu';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import InformasiAwal from './screens/InformasiAwal';
import IdentitasAwal from './screens/IdentitasAwal';
import Screening from './screens/Screening';
import ReviewJawaban from './screens/ReviewJawaban';
import HasilPositif from './screens/HasilPositif';
import HasilNegatif from './screens/HasilNegatif';
import DataScreening from './screens/DataScreening';
import DetailScreening from './screens/DetailScreening';
import KelolaPengguna from './screens/KelolaPengguna';

// Komponen proteksi
import PrivateRoute from './PrivateRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Halaman publik */}
        <Route path="/" element={<LoginScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />

        {/* Halaman private (hanya untuk user yang sudah login) */}
        <Route path="/mainmenu" element={<PrivateRoute element={MainMenu} />} />
        <Route path="/informasi-awal" element={<PrivateRoute element={InformasiAwal} />} />
        <Route path="/identitas-awal" element={<PrivateRoute element={IdentitasAwal} />} />
        <Route path="/screening" element={<PrivateRoute element={Screening} />} />
        <Route path="/review" element={<PrivateRoute element={ReviewJawaban} />} />
        <Route path="/hasil-positif" element={<PrivateRoute element={HasilPositif} />} />
        <Route path="/hasil-negatif" element={<PrivateRoute element={HasilNegatif} />} />

        {/* Halaman khusus user dan admin */}
        <Route
          path="/riwayat"
          element={<PrivateRoute element={DataScreening} allowedRoles={['user', 'admin']} />}
        />
        <Route
          path="/detail/:id"
          element={<PrivateRoute element={DetailScreening} allowedRoles={['user', 'admin']} />}
        />
        <Route
          path="/kelola-pengguna"
          element={<PrivateRoute element={KelolaPengguna} allowedRoles={['admin']} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
