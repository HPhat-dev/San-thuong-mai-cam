import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import LogoutModal from './LogoutModal';
import { authApi } from '../services/api';

export default function Sidebar() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // Continue even if network error
    } finally {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      setShowLogoutModal(false);
      navigate('/login');
    }
  };

  return (
    <>
      <aside className="admin-sidebar">
        <div className="sidebar-logo-area">
          <div className="sidebar-logo-icon">
            <svg viewBox="0 0 36 36" aria-hidden="true">
              <path d="M18 10c-1-5 3-8 9-7-1 5-4 8-9 8" fill="#65a30d" />
              <circle cx="17" cy="21" r="12" fill="#f97316" />
            </svg>
          </div>
          <div className="sidebar-logo-text">
            <h2>Sàn Cam</h2>
            <span>Quản trị hệ thống</span>
          </div>
        </div>

        <ul className="sidebar-nav">
          <li className="sidebar-nav-item">
            <NavLink
              to="/khach-hang"
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <span className="sidebar-dot">●</span>
              <span>Quản lý Khách hàng</span>
            </NavLink>
          </li>
          <li className="sidebar-nav-item">
            <NavLink
              to="/danh-muc"
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <span className="sidebar-dot">●</span>
              <span>Quản lý Danh mục</span>
            </NavLink>
          </li>
          <li className="sidebar-nav-item">
            <NavLink
              to="/nguoi-ban"
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <span className="sidebar-dot">●</span>
              <span>Quản lý Người bán</span>
            </NavLink>
          </li>
          <li className="sidebar-nav-item">
            <NavLink
              to="/ho-so"
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <span className="sidebar-dot">●</span>
              <span>Quản lý Hồ sơ</span>
            </NavLink>
          </li>
          <li className="sidebar-nav-item">
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              style={{ width: '100%' }}
            >
              <span className="sidebar-dot">●</span>
              <span>Đăng xuất</span>
            </button>
          </li>
        </ul>
      </aside>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </>
  );
}
