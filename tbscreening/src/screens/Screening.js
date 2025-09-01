import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { keluhanQuestions, informasiLainnyaQuestions } from './question';

export default function ScreeningPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const identitas = location.state?.identitas || {};

  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      alert('Silakan login terlebih dahulu sebelum melakukan screening.');
      navigate('/login', {
        state: {
          redirectTo: '/screening',
          params: { identitas },
        },
      });
    } else {
      setLoading(false);
    }
  }, [navigate, identitas]);

  const toggleAnswer = (question, value) => {
    setAnswers((prev) => ({ ...prev, [question]: value }));
  };

  const handleNext = () => {
    const allQuestions = [...keluhanQuestions, ...informasiLainnyaQuestions];
    for (let q of allQuestions) {
      if (!(q in answers)) {
        alert(`Pertanyaan "${q}" belum dijawab.`);
        return;
      }
    }

    navigate('/review', {
      state: {
        identitas,
        screeningAnswers: answers,
      },
    });
  };

  if (loading) return null;

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />

      <div className="container my-4 flex-grow-1">
        <h2 className="text-center text-danger">SCREENING TBC</h2>
        <p className="text-center">
          TBC itu bisa diobati kok, Telaten minum obat dan rutin kontrol. Jangan takut untuk memeriksakan diri!
        </p>

        <div className="card border-danger">
          <div className="card-body">
            <h5 className="text-danger mb-3">Keluhan Yang Dirasakan</h5>
            {keluhanQuestions.map((question, index) => (
              <div className="mb-3" key={index}>
                <label className="form-label">{index + 1}. {question}</label>
                <div>
                  <button
                    type="button"
                    className={`btn me-2 ${answers[question] === 'Ya' ? 'btn-danger' : 'btn-outline-secondary'}`}
                    onClick={() => toggleAnswer(question, 'Ya')}
                  >
                    Ya
                  </button>
                  <button
                    type="button"
                    className={`btn ${answers[question] === 'Tidak' ? 'btn-danger' : 'btn-outline-secondary'}`}
                    onClick={() => toggleAnswer(question, 'Tidak')}
                  >
                    Tidak
                  </button>
                </div>
              </div>
            ))}

            <h5 className="text-danger mt-4 mb-3">Informasi Lainnya</h5>
            {informasiLainnyaQuestions.map((question, index) => (
              <div className="mb-3" key={keluhanQuestions.length + index}>
                <label className="form-label">
                  {keluhanQuestions.length + index + 1}. {question}
                </label>
                <div>
                  <button
                    type="button"
                    className={`btn me-2 ${answers[question] === 'Ya' ? 'btn-danger' : 'btn-outline-secondary'}`}
                    onClick={() => toggleAnswer(question, 'Ya')}
                  >
                    Ya
                  </button>
                  <button
                    type="button"
                    className={`btn ${answers[question] === 'Tidak' ? 'btn-danger' : 'btn-outline-secondary'}`}
                    onClick={() => toggleAnswer(question, 'Tidak')}
                  >
                    Tidak
                  </button>
                </div>
              </div>
            ))}

            <div className="d-flex justify-content-between mt-4">
              <button className="btn btn-secondary" onClick={() => navigate(-1)}>Sebelumnya</button>
              <button className="btn btn-danger" onClick={handleNext}>Review</button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
