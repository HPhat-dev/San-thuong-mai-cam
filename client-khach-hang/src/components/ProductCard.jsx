import { Link, useLocation, useNavigate } from 'react-router-dom';
import Thumb from './Thumb';
import Stars from './Stars';
import { fmtMoney } from '../utils';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { errMsg } from '../api';

export default function ProductCard({ p }) {
  const { user } = useAuth();
  const { add } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const addToCart = async () => {
    if (!user) return navigate('/dang-nhap', { state: { from: location } });
    try {
      await add(p._id, 1);
      toast('Đã thêm vào giỏ hàng');
    } catch (e) {
      toast(errMsg(e), 'err');
    }
  };

  return (
    <div className="pcard card">
      <Link to={`/san-pham/${p._id}`} className="pcard-img"><Thumb src={p.hinhAnhSanPham?.[0]} name={p.tenSanPham} size="card" /></Link>
      <div className="pcard-body">
        <Link to={`/san-pham/${p._id}`} className="pcard-name">{p.tenSanPham}</Link>
        <div className="muted small">Gian hàng: {p.gianHangId?.tenGianHang}</div>
        <div className="pcard-rate">
          {p.soLuotDanhGia > 0 ? <><Stars value={p.diemTB} size={14} /> <span className="muted small">({p.soLuotDanhGia})</span></> : <span className="muted small">Chưa có đánh giá</span>}
        </div>
        <div className="price">{fmtMoney(p.giaSanPham)}</div>
        <button className="btn btn-outline btn-block" disabled={p.soLuongTon <= 0} onClick={addToCart}>
          {p.soLuongTon <= 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
        </button>
      </div>
    </div>
  );
}
