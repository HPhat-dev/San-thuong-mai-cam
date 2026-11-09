import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import Stepper from '../components/Stepper';
import Thumb from '../components/Thumb';
import { PayBadge } from '../components/Badge';
import { fmtDate, fmtMoney } from '../utils';

const METHODS = [
  { v: 'cod', title: 'Thanh toán khi nhận hàng (COD)', desc: 'Thanh toán bằng tiền mặt khi nhận được hàng' },
  { v: 'chuyenkhoan', title: 'Chuyển khoản ngân hàng', desc: 'Chuyển khoản theo thông tin hướng dẫn sau khi xác nhận' },
  { v: 'vnpay', title: 'Thanh toán online qua VNPay', desc: 'Thẻ ATM nội địa, QR hoặc thẻ quốc tế (môi trường thử nghiệm)' },
];

export default function Payment() {
  const [sp] = useSearchParams();
  const ids = sp.get('ids') || '';
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [method, setMethod] = useState('cod');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    api.get('/orders', { params: { ids } })
      .then((r) => {
        setOrders(r.data);
        const m = r.data[0]?.thanhToan?.phuongThucTT;
        if (m === 'cod' || m === 'chuyenkhoan' || m === 'vnpay') setMethod(m);
      })
      .catch((e) => setError(errMsg(e)));
  }, [ids]);

  if (error) return <div className="container page"><div className="card empty"><p>{error}</p><Link to="/don-hang" className="btn btn-primary">Xem đơn hàng của tôi</Link></div></div>;
  if (!orders) return <div className="container page empty">Đang tải...</div>;

  const tong = orders.reduce((a, o) => a + o.tongTienDH, 0);
  const items = orders.flatMap((o) => o.danhSachSanPham);
  const allPaid = orders.every((o) => o.thanhToan?.trangThaiTT === 'dathanhtoan');
  const cancelled = orders.some((o) => o.trangThaiDH === 'dahuy');
  const payStatus = allPaid ? 'dathanhtoan' : orders[0]?.thanhToan?.trangThaiTT;

  const confirm = async () => {
    setError('');
    setBusy(true);
    try {
      const donHangIds = orders.map((o) => o._id);
      if (method === 'vnpay') {
        // Chuyển sang cổng VNPay; thanh toán xong VNPay đưa khách về /thanh-toan/ket-qua
        const { data } = await api.post('/payments/vnpay/create', { donHangIds });
        window.location.href = data.paymentUrl;
        return;
      }
      const { data } = await api.post('/payments/confirm', { donHangIds, phuongThucTT: method });
      setDone(data);
    } catch (e) {
      setError(errMsg(e));
      setBusy(false);
    }
  };

  return (
    <div className="container page">
      <Stepper current={3} />
      <div className="two-col">
        <div className="card pad">
          {done ? (
            <>
              <h2>Đặt hàng thành công 🎉</h2>
              <p className="muted">
                {done.phuongThucTT === 'cod'
                  ? 'Bạn sẽ thanh toán bằng tiền mặt khi nhận hàng.'
                  : 'Vui lòng chuyển khoản theo thông tin bên dưới. Người bán sẽ xác nhận khi nhận được tiền.'}
              </p>
              {done.chuyenKhoan && (
                <div className="bank">
                  <div><span className="muted">Ngân hàng</span><b>{done.chuyenKhoan.nganHang || 'Đang cập nhật'}</b></div>
                  <div><span className="muted">Số tài khoản</span><b>{done.chuyenKhoan.soTaiKhoan || 'Đang cập nhật'}</b></div>
                  <div><span className="muted">Chủ tài khoản</span><b>{done.chuyenKhoan.chuTaiKhoan || 'Đang cập nhật'}</b></div>
                  <div><span className="muted">Số tiền</span><b>{fmtMoney(done.chuyenKhoan.soTien)}</b></div>
                  <div><span className="muted">Nội dung</span><b>{done.chuyenKhoan.noiDung}</b></div>
                </div>
              )}
              <div className="actions">
                <Link to="/don-hang" className="btn btn-primary">Xem lịch sử đơn hàng</Link>
                <Link to="/" className="btn btn-outline">Tiếp tục mua sắm</Link>
              </div>
            </>
          ) : (
            <>
              <h2>Chọn phương thức thanh toán</h2>
              <p className="muted">
                {orders.length === 1 ? `Đơn hàng ${orders[0].ma}` : `Các đơn hàng ${orders.map((o) => o.ma).join(', ')}`} đã được tạo. Vui lòng chọn phương thức và xác nhận thanh toán.
              </p>
              {error && <div className="alert alert-error">{error}</div>}
              {allPaid && <div className="alert alert-ok">Đơn hàng đã được thanh toán.</div>}
              {cancelled && <div className="alert alert-error">Đơn hàng đã bị hủy.</div>}
              {METHODS.map((m) => (
                <label key={m.v} className={`radio-card ${method === m.v ? 'on' : ''}`}>
                  <input type="radio" name="pm" checked={method === m.v} onChange={() => setMethod(m.v)} />
                  <div><div className="strong">{m.title}</div><div className="muted small">{m.desc}</div></div>
                </label>
              ))}
              <button className="btn btn-primary" disabled={busy || allPaid || cancelled} onClick={confirm}>
                {busy ? 'Đang xử lý...' : method === 'vnpay' ? 'Thanh toán với VNPay' : 'Xác nhận thanh toán'}
              </button>
            </>
          )}
        </div>

        <aside className="card pad summary">
          <h2>Thông tin đơn hàng</h2>
          <div className="sum-row"><span className="muted">Mã đơn hàng</span><b>{orders.map((o) => o.ma).join(', ')}</b></div>
          <div className="sum-row"><span className="muted">Ngày đặt</span><b>{fmtDate(orders[0]?.ngayDat)}</b></div>
          <div className="sum-row"><span className="muted">Trạng thái thanh toán</span><PayBadge value={payStatus} /></div>
          <hr />
          {items.map((i) => (
            <div key={`${i.sanPhamId}`} className="mini-line">
              <Thumb src={i.hinhAnh} name={i.tenSanPham} size="xs" />
              <div className="grow"><div className="strong">{i.tenSanPham}</div><div className="muted small">Số lượng: {i.soLuong}</div></div>
              <b>{fmtMoney(i.giaSanPham * i.soLuong)}</b>
            </div>
          ))}
          <hr />
          <div className="sum-row total"><span>Tổng thanh toán</span><span className="price big">{fmtMoney(tong)}</span></div>
        </aside>
      </div>
    </div>
  );
}
