import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Stepper from '../components/Stepper';
import Thumb from '../components/Thumb';
import { EMAIL_RE, PHONE_RE, fmtMoney } from '../utils';

export default function Checkout() {
  const { user } = useAuth();
  const { cart, loaded, refresh } = useCart();
  const navigate = useNavigate();
  const [f, setF] = useState({
    tenNguoiNhan: user?.hoTen || '', sdtNhanHang: user?.soDienThoai || '',
    emailNhanHang: user?.email || '', diaChiNhanHang: user?.diaChi || '', ghiChu: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => { refresh().catch(() => {}); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!loaded) return <div className="container page empty">Đang tải...</div>;
  if (cart.lines.length === 0 && !busy) return <Navigate to="/gio-hang" replace />;
  const blocked = cart.lines.some((l) => !l.khaDung || l.vuotTon);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!f.tenNguoiNhan.trim()) return setError('Vui lòng nhập họ và tên người nhận');
    if (!PHONE_RE.test(f.sdtNhanHang.replace(/[\s.-]/g, ''))) return setError('Số điện thoại không hợp lệ');
    if (f.emailNhanHang.trim() && !EMAIL_RE.test(f.emailNhanHang.trim())) return setError('Email không hợp lệ');
    if (!f.diaChiNhanHang.trim()) return setError('Vui lòng nhập địa chỉ nhận hàng');
    setBusy(true);
    try {
      const { data } = await api.post('/orders', f);
      await refresh();
      navigate(`/thanh-toan?ids=${data.donHang.map((o) => o._id).join(',')}`, { replace: true });
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <div className="container page">
      <Stepper current={2} />
      <form className="two-col" onSubmit={submit}>
        <div className="card pad">
          <h2>Thông tin nhận hàng</h2>
          {error && <div className="alert alert-error">{error}</div>}
          <label className="field"><span className="label">Họ và tên người nhận</span>
            <input className="input" value={f.tenNguoiNhan} onChange={set('tenNguoiNhan')} /></label>
          <div className="row2">
            <label className="field"><span className="label">Số điện thoại</span>
              <input className="input" value={f.sdtNhanHang} onChange={set('sdtNhanHang')} /></label>
            <label className="field"><span className="label">Email</span>
              <input className="input" type="email" value={f.emailNhanHang} onChange={set('emailNhanHang')} /></label>
          </div>
          <label className="field"><span className="label">Địa chỉ nhận hàng</span>
            <input className="input" value={f.diaChiNhanHang} onChange={set('diaChiNhanHang')} /></label>
          <label className="field"><span className="label">Ghi chú cho người bán (không bắt buộc)</span>
            <textarea className="input" rows={4} maxLength={500} placeholder="Giao giờ hành chính..." value={f.ghiChu} onChange={set('ghiChu')} /></label>
        </div>

        <aside className="card pad summary">
          <h2>Đơn hàng của bạn</h2>
          {cart.lines.map((l) => (
            <div key={l.sanPhamId} className="mini-line">
              <Thumb src={l.hinhAnh} name={l.tenSanPham} size="xs" />
              <div className="grow"><div className="strong">{l.tenSanPham}</div><div className="muted small">Số lượng: {l.soLuong}</div></div>
              <b>{fmtMoney(l.thanhTien)}</b>
            </div>
          ))}
          <hr />
          <div className="sum-row total"><span>Tổng cộng</span><span className="price big">{fmtMoney(cart.tongTien)}</span></div>
          {blocked && <p className="warn small">Có sản phẩm không đủ hàng hoặc không còn kinh doanh. Vui lòng quay lại giỏ hàng để điều chỉnh.</p>}
          <button className="btn btn-primary btn-block" disabled={busy || blocked}>{busy ? 'Đang tạo đơn...' : 'Xác nhận đặt hàng'}</button>
          <Link to="/gio-hang" className="btn btn-outline btn-block">Quay lại giỏ hàng</Link>
        </aside>
      </form>
    </div>
  );
}
