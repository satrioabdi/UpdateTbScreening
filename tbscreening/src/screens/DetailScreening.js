import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { fieldKeys } from '../screens/fieldKeys';
import { allQuestions as pertanyaanList } from '../screens/question';


export default function DetailScreening() {
  const location = useLocation();
  const navigate = useNavigate();
  const { item } = location.state || {};
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  const jawabanArray = fieldKeys.map((key) => item?.[key]);

  const convertJawaban = (val) => {
    if (val === 'ya' || val === 1 || val === '1') return 'Ya';
    if (val === 'tidak' || val === 0 || val === '0') return 'Tidak';
    return 'Tidak tersedia';
  };

  const parsedProbabilitas = parseFloat(item?.probabilitas);

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (currentUser?.role === 'admin' || currentUser?.user_id === item?.user_id) {
      setAllowed(true);
    }
    setChecking(false);
  }, [item?.user_id]);

  if (checking) {
    return (
      <div className="container text-center mt-5">
        <h5>Mengecek izin akses...</h5>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="container text-center mt-5">
        <div className="alert alert-danger">
          ❌ Anda tidak memiliki izin untuk melihat detail screening ini.
        </div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          🔙 Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <div className="container my-4 flex-grow-1">
        <h2 className="mb-4">📝 Detail Screening</h2>

        <p><strong>👤 Nama:</strong> {item?.nama_pasien}</p>
        <p>
          <strong>📅 Tanggal:</strong>{' '}
          {item?.tanggal_screening
            ? new Date(item.tanggal_screening).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })
            : 'Tidak tersedia'}
        </p>

        {parsedProbabilitas >= 0 && !isNaN(parsedProbabilitas) && (
          <p><strong>📈 Probabilitas:</strong> {(parsedProbabilitas * 100).toFixed(2)}%</p>
        )}

        {item?.hasil && (
          <p>
            <strong>⚠️ Hasil:</strong>{' '}
            <span className={`fw-bold ${item.hasil.toLowerCase().includes('positif') ? 'text-danger' : 'text-success'}`}>
              {item.hasil}
            </span>
          </p>
        )}

        <h5 className="mt-4">🗒️ Jawaban:</h5>
        <div className="list-group">
          {pertanyaanList.map((pertanyaan, index) => {
            const jawabanTeks = convertJawaban(jawabanArray[index]);
            let badgeClass = 'bg-secondary';
            if (jawabanTeks === 'Ya') badgeClass = 'bg-success';
            else if (jawabanTeks === 'Tidak') badgeClass = 'bg-danger';

            return (
              <div
                key={index}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <span>{index + 1}. {pertanyaan}</span>
                <span className={`badge rounded-pill ${badgeClass}`}>
                  {jawabanTeks}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
}
