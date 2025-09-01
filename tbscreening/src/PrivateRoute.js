// src/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ element: Element, allowedRoles = [] }) => {
  const user = JSON.parse(localStorage.getItem("user")); // Ambil data login

  if (!user) {
    // Belum login
    return <Navigate to="/login" />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Role tidak diizinkan, kembalikan ke halaman utama (mainmenu)
    return <Navigate to="/mainmenu" />;
  }

  return <Element />;
};

export default PrivateRoute;
