import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api';
import { EMAIL_RE, PHONE_RE } from '../utils';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState({ hoTen: '', email: '', soDienThoai: '', diaChi: '', matKhau: '', xacNhanMatKhau: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!f.hoTen.trim()) return setError('Vui lòng nhập họ và tên');
    if (!EMAIL_RE.test(f.email.trim())) return setError('Email không hợp lệ');
    if (!PHONE_RE.test(f.soDienThoai.replace(/[\s.-]/g, ''))) return setError('Số điện thoại không hợp lệ');
    if (f.matKhau.length < 6) return setError('Mật khẩu tối thiểu 6 ký tự');
    if (f.matKhau !== f.xacNhanMatKhau) return setError('Mật khẩu xác nhận không trùng khớp');
    setBusy(true);
    try {
      await register(f);
      navigate('/', { replace: true });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card card" onSubmit={submit}>
        <h1>Đăng ký tài khoản</h1>
        <p className="muted">Tạo tài khoản khách hàng để mua sắm</p>
        {error && <div className="alert alert-error">{error}</div>}
        <label className="field"><span className="label">Họ và tên</span>
          <input className="input" value={f.hoTen} onChange={set('hoTen')} autoFocus /></label>
        <div className="row2">
          <label className="field"><span className="label">Email</span>
            <input className="input" type="email" value={f.email} onChange={set('email')} autoComplete="email" /></label>
          <label className="field"><span className="label">Số điện thoại</span>
            <input className="input" value={f.soDienThoai} onChange={set('soDienThoai')} autoComplete="tel" /></label>
        </div>
        <label className="field"><span className="label">Địa chỉ (không bắt buộc)</span>
          <input className="input" value={f.diaChi} onChange={set('diaChi')} autoComplete="street-address" /></label>
        <div className="row2">
          <label className="field"><span className="label">Mật khẩu</span>
            <input className="input" type="password" value={f.matKhau} onChange={set('matKhau')} autoComplete="new-password" /></label>
          <label className="field"><span className="label">Xác nhận mật khẩu</span>
            <input className="input" type="password" value={f.xacNhanMatKhau} onChange={set('xacNhanMatKhau')} autoComplete="new-password" /></label>
        </div>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Đang tạo tài khoản...' : 'Đăng ký'}</button>
        <p className="center muted">Đã có tài khoản? <Link to="/dang-nhap" className="link">Đăng nhập</Link></p>
      </form>
    </div>
  );
}
