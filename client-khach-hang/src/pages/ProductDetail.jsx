import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import Thumb from '../components/Thumb';
import Stars from '../components/Stars';
import { fmtMoney, parseMoTa } from '../utils';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const fmtRate = (n) => Number(n).toLocaleString('vi-VN', { maximumFractionDigits: 1 }); // 4,6

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { add } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [p, setP] = useState(null);
  const [error, setError] = useState('');
  const [img, setImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setP(null); setError(''); setImg(0); setQty(1);
    window.scrollTo(0, 0);
    api.get(`/products/${id}`).then((r) => setP(r.data)).catch((e) => setError(errMsg(e)));
  }, [id]);

  if (error) {
    return (
      <div className="container page">
        <div className="card empty">
          <p>{error}</p>
          <Link to="/" className="btn btn-primary">Về trang chủ</Link>
        </div>
      </div>
    );
  }
  if (!p) return <div className="container page empty">Đang tải...</div>;

  const hetHang = p.soLuongTon <= 0;
  const { gioiThieu, thongSo } = parseMoTa(p.moTaSanPham);
  const addToCart = async () => {
    if (!user) return navigate('/dang-nhap', { state: { from: location } });
    setBusy(true);
    try {
      await add(p._id, qty);
      toast('Đã thêm vào giỏ hàng');
    } catch (e) {
      toast(errMsg(e), 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container page">
      <div className="crumbs">
        <Link to="/">Trang chủ</Link> › {p.danhMucId && <><Link to={`/?danhMuc=${p.danhMucId._id}`}>{p.danhMucId.tenDanhMuc}</Link> › </>}{p.tenSanPham}
      </div>

      <div className="detail card">
        <div className="gallery">
          <Thumb src={p.hinhAnhSanPham?.[img]} name={p.tenSanPham} size="hero" />
          {p.hinhAnhSanPham?.length > 1 && (
            <div className="gallery-thumbs">
              {p.hinhAnhSanPham.slice(0, 5).map((s, i) => (
                <button key={s + i} className={i === img ? 'active' : ''} onClick={() => setImg(i)} aria-label={`Ảnh ${i + 1}`}>
                  <Thumb src={s} name={p.tenSanPham} size="sm" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="info">
          <h1>{p.tenSanPham}</h1>
          <div className="rating-row">
            {p.soLuotDanhGia > 0 ? (
              <><Stars value={Math.floor(p.diemTB)} size={22} /> <b>{fmtRate(p.diemTB)}</b> <span className="muted">({p.soLuotDanhGia} đánh giá)</span></>
            ) : (
              <span className="muted">Chưa có đánh giá</span>
            )}
          </div>
          <div className="price big">{fmtMoney(p.giaSanPham)}</div>
          <div className="shop-row">
            <span className="muted">Gian hàng: <b className="ink">{p.gianHangId?.tenGianHang}</b></span>
            <span className={hetHang ? 'tag out' : 'tag'}>{hetHang ? 'Hết hàng' : 'Còn hàng'}</span>
          </div>
          {gioiThieu && <p className="desc-short">{gioiThieu}</p>}
          {!hetHang && (
            <div className="buy-actions">
              <div className="qty">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Giảm">−</button>
                <span>{qty}</span>
                <button onClick={() => setQty((q) => Math.min(p.soLuongTon, q + 1))} disabled={qty >= p.soLuongTon} aria-label="Tăng">+</button>
              </div>
              <button className="btn btn-primary" disabled={busy} onClick={addToCart}>Thêm vào giỏ hàng</button>
            </div>
          )}
        </div>
      </div>

      <div className="detail-grid">
        <section className="card about">
          <h2>Giới thiệu sản phẩm</h2>
          {gioiThieu && <p>{gioiThieu}</p>}
          {thongSo.length > 0 && (
            <div className="specs">
              {thongSo.map((t, i) => (
                <div key={i} className="spec"><span className="muted">{t.ten}</span><b>{t.giaTri}</b></div>
              ))}
            </div>
          )}
          {!gioiThieu && thongSo.length === 0 && <p className="muted">Người bán chưa cung cấp phần giới thiệu cho sản phẩm này.</p>}
        </section>

        <section className="card reviews">
          <div className="reviews-head">
            <h2>Đánh giá và nhận xét</h2>
            {p.soLuotDanhGia > 0 && <span className="muted">Trung bình <b className="ink">{fmtRate(p.diemTB)}/5</b></span>}
          </div>
          {p.danhGia.length === 0 ? (
            <p className="muted">Chưa có đánh giá nào. Hãy là người đầu tiên sau khi mua hàng!</p>
          ) : (
            p.danhGia.map((r) => (
              <div key={r._id} className="review">
                <span className="avatar">{r.tenNguoiDanhGia.trim().slice(0, 1).toUpperCase()}</span>
                <div>
                  <div><b>{r.tenNguoiDanhGia}</b> <Stars value={r.soSao} size={15} /></div>
                  {r.noiDungDanhGia && <p>{r.noiDungDanhGia}</p>}
                </div>
              </div>
            ))
          )}
        </section>
      </div>

      {p.tuongTu?.length > 0 && (
        <>
          <div className="similar-head">
            <h2>Sản phẩm tương tự</h2>
            {p.danhMucId && <Link to={`/?danhMuc=${p.danhMucId._id}`} className="link">Xem thêm ›</Link>}
          </div>
          <div className="similar-grid">
            {p.tuongTu.map((s) => (
              <Link key={s._id} to={`/san-pham/${s._id}`} className="sim card">
                <Thumb src={s.hinhAnhSanPham?.[0]} name={s.tenSanPham} size="sm" />
                <div>
                  <div className="name">{s.tenSanPham}</div>
                  <div className="muted small">{s.gianHangId?.tenGianHang}</div>
                  <div className="price">{fmtMoney(s.giaSanPham)}</div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
