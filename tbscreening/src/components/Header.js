import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  const fetchUser = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUsername(user.username);
      setIsLoggedIn(true);
    } else {
      setUsername('');
      setIsLoggedIn(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-white">
      <img
        src="/assets/images/rekat.png"
        alt="Logo"
        style={{ width: 40, height: 40 }}
      />
      <div>
        {isLoggedIn ? (
          <span className="fw-bold text-danger">Login sebagai: {username}</span>
        ) : (
          <button className="btn btn-danger btn-sm" onClick={handleLogin}>
            Login
          </button>
        )}
      </div>
    </div>
  );
}
