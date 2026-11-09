import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import KhachHangPage from './pages/KhachHangPage';
import DanhMucPage from './pages/DanhMucPage';
import NguoiBanPage from './pages/NguoiBanPage';
import HoSoPage from './pages/HoSoPage';
import PrivateRoute from './components/PrivateRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/khach-hang"
        element={
          <PrivateRoute>
            <KhachHangPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/danh-muc"
        element={
          <PrivateRoute>
            <DanhMucPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/nguoi-ban"
        element={
          <PrivateRoute>
            <NguoiBanPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/ho-so"
        element={
          <PrivateRoute>
            <HoSoPage />
          </PrivateRoute>
        }
      />
      <Route path="/" element={<Navigate to="/khach-hang" replace />} />
      <Route path="*" element={<Navigate to="/khach-hang" replace />} />
    </Routes>
  );
}
