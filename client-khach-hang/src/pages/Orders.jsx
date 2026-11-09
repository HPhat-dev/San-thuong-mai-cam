import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import Modal from '../components/Modal';
import Stars from '../components/Stars';
import Thumb from '../components/Thumb';
import { OrderBadge, PayBadge } from '../components/Badge';
import { useToast } from '../context/ToastContext';
import { PAY_METHOD, fmtDate, fmtMoney } from '../utils';

function ReviewModal({ order, item, onClose, onDone }) {
  const toast = useToast();
  const [soSao, setSoSao] = useState(5);
  const [noiDung, setNoiDung] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await api.post('/reviews', { donHangId: order._id, sanPhamId: item.sanPhamId, soSao, noiDungDanhGia: noiDung });
      toast('Cảm ơn bạn đã đánh giá!');
      onDone();
    } catch (e) {
      setError(errMsg(e));
      setBusy(false);
    }
  };

  return (
    <Modal title="Đánh giá sản phẩm" subtitle={`${item.tenSanPham} · Đơn hàng ${order.ma}`} onClose={onClose}>
      <div className="label">Chất lượng sản phẩm</div>
      <Stars value={soSao} onChange={setSoSao} size={34} />
      <label className="field"><span className="label">Nhận xét của bạn</span>
        <textarea className="input" rows={5} maxLength={1000} value={noiDung} onChange={(e) => setNoiDung(e.target.value)} placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..." />
      </label>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="modal-actions">
        <button className="btn btn-outline" onClick={onClose}>Hủy</button>
        <button className="btn btn-primary" disabled={busy} onClick={submit}>{busy ? 'Đang gửi...' : 'Gửi đánh giá'}</button>
      </div>
    </Modal>
  );
}

function DetailModal({ order, onClose, onReview }) {
  return (
    <Modal wide title={`Đơn hàng ${order.ma}`} subtitle={`Đặt ngày ${fmtDate(order.ngayDat)} · Gian hàng ${order.tenGianHang}`} onClose={onClose}>
      <div className="detail-badges"><OrderBadge value={order.trangThaiDH} /> <PayBadge value={order.thanhToan?.trangThaiTT} /> <span className="muted small">{PAY_METHOD[order.thanhToan?.phuongThucTT]}</span></div>
      <table className="table compact">
        <thead><tr><th>Sản phẩm</th><th>Đơn giá</th><th>SL</th><th>Thành tiền</th><th>Đánh giá</th></tr></thead>
        <tbody>
          {order.danhSachSanPham.map((i) => (
            <tr key={String(i.sanPhamId)}>
              <td><div className="cell-product"><Thumb src={i.hinhAnh} name={i.tenSanPham} size="xs" /><Link to={`/san-pham/${i.sanPhamId}`} onClick={onClose}>{i.tenSanPham}</Link></div></td>
              <td>{fmtMoney(i.giaSanPham)}</td><td>{i.soLuong}</td><td>{fmtMoney(i.giaSanPham * i.soLuong)}</td>
              <td>{i.daDanhGia ? <span className="muted small">Đã đánh giá</span> : order.trangThaiDH === 'hoanthanh' ? <button className="btn btn-primary btn-sm" onClick={() => onReview(i)}>Đánh giá</button> : <span className="muted small">Sau khi hoàn thành</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="sum-row total"><span>Tổng tiền</span><span className="price big">{fmtMoney(order.tongTienDH)}</span></div>
      <div className="ship">
        <div><span className="muted">Người nhận</span> <b>{order.tenNguoiNhan || '—'}</b></div>
        <div><span className="muted">Điện thoại</span> <b>{order.sdtNhanHang}</b></div>
        <div><span className="muted">Địa chỉ</span> <b>{order.diaChiNhanHang}</b></div>
        {order.ghiChu && <div><span className="muted">Ghi chú</span> <b>{order.ghiChu}</b></div>}
      </div>
      <div className="modal-actions"><button className="btn btn-outline" onClick={onClose}>Đóng</button></div>
    </Modal>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const [review, setReview] = useState(null);

  const load = () => api.get('/orders').then((r) => {
    setOrders(r.data);
    return r.data;
  }).catch((e) => {
    setError(errMsg(e));
    return null;
  });
  useEffect(() => { load(); }, []);

  return (
    <div className="container page">
      <h1 className="page-title">Lịch sử đặt hàng</h1>
      {error && <div className="alert alert-error">{error}</div>}
      {!orders ? (
        !error && <div className="empty">Đang tải...</div>
      ) : orders.length === 0 ? (
        <div className="card empty"><p>Bạn chưa có đơn hàng nào.</p><Link to="/" className="btn btn-primary">Mua sắm ngay</Link></div>
      ) : (
        <div className="card table-card">
          <table className="table">
            <thead><tr><th>Mã đơn</th><th>Ngày đặt</th><th>Sản phẩm</th><th>Tổng tiền</th><th>Thanh toán</th><th>Trạng thái đơn</th><th>Thao tác</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td className="strong">{o.ma}</td>
                  <td>{fmtDate(o.ngayDat)}</td>
                  <td>{o.danhSachSanPham[0]?.tenSanPham}{o.danhSachSanPham.length > 1 && ` +${o.danhSachSanPham.length - 1} sản phẩm`}</td>
                  <td className="strong">{fmtMoney(o.tongTienDH)}</td>
                  <td><PayBadge value={o.thanhToan?.trangThaiTT} /></td>
                  <td><OrderBadge value={o.trangThaiDH} /></td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => setDetail(o)}>Xem chi tiết</button>
                      {o.thanhToan?.phuongThucTT === 'vnpay' && o.thanhToan.trangThaiTT !== 'dathanhtoan' && o.trangThaiDH !== 'dahuy' && (
                        <Link to={`/thanh-toan?ids=${o._id}`} className="btn btn-primary btn-sm">Thanh toán</Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {detail && <DetailModal order={detail} onClose={() => setDetail(null)} onReview={(item) => {
        setReview({ order: detail, item });
        setDetail(null);
      }} />}
      {review && <ReviewModal order={review.order} item={review.item} onClose={() => {
        setDetail(review.order);
        setReview(null);
      }} onDone={async () => {
        setReview(null);
        const updatedOrders = await load();
        const updatedDetail = updatedOrders?.find((order) => order._id === review.order._id);
        if (updatedDetail) setDetail(updatedDetail);
      }} />}
    </div>
  );
}
