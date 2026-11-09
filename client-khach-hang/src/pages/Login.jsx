import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg, SELLER_URL } from '../api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim() || !matKhau) return setError('Vui lòng nhập email và mật khẩu');
    setBusy(true);
    try {
      await login(identifier.trim(), matKhau);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card card" onSubmit={submit}>
        <h1>Đăng nhập</h1>
        <p className="muted">Chào mừng bạn quay lại Sàn Online</p>
        {error && <div className="alert alert-error">{error}</div>}
        <label className="field"><span className="label">Email hoặc tên đăng nhập</span>
          <input className="input" value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" autoFocus />
        </label>
        <label className="field"><span className="label">Mật khẩu</span>
          <input className="input" type="password" value={matKhau} onChange={(e) => setMatKhau(e.target.value)} autoComplete="current-password" />
        </label>
        <div className="right"><Link to="/quen-mat-khau" className="link small">Quên mật khẩu?</Link></div>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
        <p className="center muted">Chưa có tài khoản? <Link to="/dang-ky" className="link">Đăng ký</Link></p>
        <p className="center muted small">Bạn là người bán? <a href={SELLER_URL} className="link">Vào Kênh Người Bán</a></p>
      </form>
    </div>
  );
}
