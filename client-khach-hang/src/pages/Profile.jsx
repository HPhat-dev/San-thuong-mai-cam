import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { EMAIL_RE, PHONE_RE, fmtMonth } from '../utils';

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const init = () => ({ hoTen: user.hoTen, soDienThoai: user.soDienThoai, email: user.email, diaChi: user.diaChi });
  const [f, setF] = useState(init);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setError('');
    if (!f.hoTen.trim()) return setError('Vui lòng nhập họ và tên');
    if (!PHONE_RE.test(f.soDienThoai.replace(/[\s.-]/g, ''))) return setError('Số điện thoại không hợp lệ');
    if (!EMAIL_RE.test(f.email.trim())) return setError('Email không hợp lệ');
    if (!f.diaChi.trim()) return setError('Vui lòng nhập địa chỉ');
    setBusy(true);
    try {
      const { data } = await api.put('/profile', f);
      setUser(data);
      setF({ hoTen: data.hoTen, soDienThoai: data.soDienThoai, email: data.email, diaChi: data.diaChi });
      toast('Đã lưu thay đổi');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container page">
      <h1 className="page-title">Hồ sơ cá nhân</h1>
      <div className="profile-layout">
        <aside className="card side-menu">
          <Link to="/ho-so" className="active">Hồ sơ cá nhân</Link>
          <Link to="/don-hang">Lịch sử đơn hàng</Link>
          <button className="danger" onClick={() => { logout(); navigate('/dang-nhap'); }}>Đăng xuất</button>
        </aside>
        <form className="card pad" onSubmit={save}>
          <div className="profile-head">
            <span className="avatar xl">{user.hoTen?.trim().slice(0, 1).toUpperCase()}</span>
            <div><div className="name">{user.hoTen}</div><div className="muted">Khách hàng · Tham gia {fmtMonth(user.thamGia)}</div></div>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="row2">
            <label className="field"><span className="label">Họ và tên</span><input className="input" value={f.hoTen} onChange={set('hoTen')} /></label>
            <label className="field"><span className="label">Số điện thoại</span><input className="input" value={f.soDienThoai} onChange={set('soDienThoai')} /></label>
          </div>
          <label className="field"><span className="label">Email</span><input className="input" type="email" value={f.email} onChange={set('email')} /></label>
          <label className="field"><span className="label">Địa chỉ</span><input className="input" value={f.diaChi} onChange={set('diaChi')} /></label>
          <div className="actions">
            <button className="btn btn-primary" disabled={busy}>{busy ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
            <button type="button" className="btn btn-outline" onClick={() => { setF(init()); setError(''); }}>Hủy</button>
          </div>
        </form>
      </div>
    </div>
  );
}
