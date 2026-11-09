import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api, { errMsg } from '../api';
import { fmtMoney } from '../utils';

// VNPay đưa khách về đây (VNP_RETURN_URL) kèm các tham số vnp_...
// Trang chỉ chuyển nguyên query cho máy chủ; máy chủ kiểm tra chữ ký rồi mới ghi nhận thanh toán.
export default function VnpayResult() {
  const { search } = useLocation();
  const [res, setRes] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/payments/vnpay/return${search}`)
      .then((r) => setRes(r.data))
      .catch((e) => setError(errMsg(e)));
  }, [search]);

  if (error) {
    return (
      <div className="container page">
        <div className="card empty">
          <p>{error}</p>
          <Link to="/don-hang" className="btn btn-primary">Xem đơn hàng của tôi</Link>
        </div>
      </div>
    );
  }
  if (!res) return <div className="container page empty">Đang xác nhận kết quả thanh toán...</div>;

  return (
    <div className="container page">
      <div className="card pad">
        <h2>{res.thanhCong ? 'Thanh toán thành công 🎉' : 'Thanh toán chưa thành công'}</h2>
        <div className={`alert ${res.thanhCong ? 'alert-ok' : 'alert-error'}`}>{res.thongBao}</div>
        <div className="sum-row"><span className="muted">Mã đơn hàng</span><b>{res.maDon.join(', ')}</b></div>
        <div className="sum-row"><span className="muted">Số tiền</span><b>{fmtMoney(res.soTien)}</b></div>
        <div className="actions">
          {!res.thanhCong && (
            <Link to={`/thanh-toan?ids=${res.donHangIds.join(',')}`} className="btn btn-primary">Thanh toán lại</Link>
          )}
          <Link to="/don-hang" className={`btn ${res.thanhCong ? 'btn-primary' : 'btn-outline'}`}>Xem lịch sử đơn hàng</Link>
          <Link to="/" className="btn btn-outline">Tiếp tục mua sắm</Link>
        </div>
      </div>
    </div>
  );
}
