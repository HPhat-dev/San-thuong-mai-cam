import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import Thumb from '../components/Thumb';
import { fmtMoney } from '../utils';
import { errMsg } from '../api';

export default function Cart() {
  const { cart, loaded, setQty, remove } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const run = async (fn) => {
    try { await fn(); } catch (e) { toast(errMsg(e), 'err'); }
  };
  const blocked = cart.lines.some((l) => !l.khaDung || l.vuotTon);

  if (!loaded) return <div className="container page empty">Đang tải giỏ hàng...</div>;
  if (cart.lines.length === 0) {
    return (
      <div className="container page">
        <h1 className="page-title">Giỏ hàng của bạn</h1>
        <div className="card empty">
          <p>Giỏ hàng đang trống.</p>
          <Link to="/" className="btn btn-primary">Tiếp tục mua sắm</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page">
      <h1 className="page-title">Giỏ hàng của bạn <span className="sub">({cart.soDong} sản phẩm)</span></h1>
      <div className="cart-layout">
        <div className="card table-card">
          <table className="table">
            <thead>
              <tr><th>Sản phẩm</th><th>Đơn giá</th><th>Số lượng</th><th>Thành tiền</th><th /></tr>
            </thead>
            <tbody>
              {cart.lines.map((l) => (
                <tr key={l.sanPhamId}>
                  <td>
                    <div className="cell-product">
                      <Thumb src={l.hinhAnh} name={l.tenSanPham} size="sm" />
                      <div>
                        <Link to={`/san-pham/${l.sanPhamId}`} className="strong">{l.tenSanPham}</Link>
                        <div className="muted small">Gian hàng: {l.tenGianHang}</div>
                        {l.canhBao && <div className="warn small">{l.canhBao}</div>}
                      </div>
                    </div>
                  </td>
                  <td>{fmtMoney(l.giaSanPham)}</td>
                  <td>
                    <div className="qty">
                      <button onClick={() => run(() => setQty(l.sanPhamId, l.soLuong - 1))} disabled={l.soLuong <= 1} aria-label="Giảm">−</button>
                      <span>{l.soLuong}</span>
                      <button onClick={() => run(() => setQty(l.sanPhamId, l.soLuong + 1))} disabled={!l.khaDung || l.soLuong >= l.soLuongTon} aria-label="Tăng">+</button>
                    </div>
                  </td>
                  <td className="strong">{fmtMoney(l.thanhTien)}</td>
                  <td><button className="btn btn-danger-outline btn-sm" onClick={() => run(() => remove(l.sanPhamId))}>Xóa</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="card summary">
          <h2>Tóm tắt đơn hàng</h2>
          <div className="sum-row"><span className="muted">Tạm tính ({cart.tongSanPham} sản phẩm)</span><b>{fmtMoney(cart.tongTien)}</b></div>
          <hr />
          <div className="sum-row total"><span>Tổng cộng</span><span className="price big">{fmtMoney(cart.tongTien)}</span></div>
          <button className="btn btn-primary btn-block" disabled={blocked} onClick={() => navigate('/dat-hang')}>Tiến hành đặt hàng</button>
          {blocked && <p className="warn small">Vui lòng điều chỉnh hoặc xóa các sản phẩm đang báo lỗi trước khi đặt hàng.</p>}
          <Link to="/" className="btn btn-outline btn-block">Tiếp tục mua sắm</Link>
        </aside>
      </div>
    </div>
  );
}
