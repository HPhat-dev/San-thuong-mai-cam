import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!username.trim()) {
      newErrors.username = 'Vui lòng nhập tên đăng nhập';
    }
    if (!matKhau) {
      newErrors.matKhau = 'Vui lòng nhập mật khẩu';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setServerError('');
    setLoading(true);

    try {
      const data = await authApi.login(username.trim(), matKhau);
      if (data.success) {
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_user', JSON.stringify(data.admin));
        navigate('/khach-hang');
      } else {
        setServerError(data.message || 'Sai tên đăng nhập hoặc mật khẩu, vui lòng nhập lại.');
      }
    } catch (err) {
      setServerError(err.message || 'Sai tên đăng nhập hoặc mật khẩu, vui lòng nhập lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-banner">
        <div className="login-brand-logo">
          <div className="login-brand-icon">
            <svg viewBox="0 0 36 36" aria-hidden="true">
              <path d="M18 10c-1-5 3-8 9-7-1 5-4 8-9 8" fill="#65a30d" />
              <circle cx="17" cy="21" r="12" fill="#f97316" />
            </svg>
          </div>
          <span className="login-brand-name">Sàn Cam</span>
        </div>
        <h1 className="login-banner-title">
          Hệ Thống<br />
          Quản Trị<br />
          Sàn Online
        </h1>
        <p className="login-banner-desc">
          Giải pháp quản lý sàn thương mại điện tử toàn diện dành cho Quản trị viên hệ thống.
        </p>
      </div>

      <div className="login-form-container">
        <div className="login-card">
          <h2 className="login-title">Đăng nhập</h2>
          <p className="login-subtitle">Nhập thông tin tài khoản quản trị để tiếp tục</p>

          {serverError && (
            <div className="alert-banner danger" style={{ marginBottom: '20px' }}>
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                Tên đăng nhập
              </label>
              <input
                id="username"
                type="text"
                className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                placeholder="Nhập tên đăng nhập"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errors.username) setErrors({ ...errors, username: null });
                }}
              />
              {errors.username && (
                <span className="error-feedback">{errors.username}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="matKhau">
                Mật khẩu
              </label>
              <input
                id="matKhau"
                type="password"
                className={`form-control ${errors.matKhau ? 'is-invalid' : ''}`}
                placeholder="Nhập mật khẩu"
                value={matKhau}
                onChange={(e) => {
                  setMatKhau(e.target.value);
                  if (errors.matKhau) setErrors({ ...errors, matKhau: null });
                }}
              />
              {errors.matKhau && (
                <span className="error-feedback">{errors.matKhau}</span>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary-block"
              disabled={loading}
            >
              {loading ? 'Đang xác thực...' : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
