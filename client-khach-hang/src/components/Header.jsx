import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Header() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [sp] = useSearchParams();
  const [q, setQ] = useState(sp.get('q') || '');
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    const onDoc = (e) => menuRef.current && !menuRef.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/?q=${encodeURIComponent(q.trim())}` : '/');
  };
  const doLogout = () => {
    logout();
    navigate('/dang-nhap');
  };

  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/" className="logo">
          <svg className="logo-mark" viewBox="0 0 36 36" aria-hidden="true">
            <path d="M18 10c-1-5 3-8 9-7-1 5-4 8-9 8" fill="#65a30d" />
            <circle cx="17" cy="21" r="12" fill="currentColor" />
          </svg>
          Sàn Cam
        </Link>
        <form className="search" onSubmit={submit}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm kiếm sản phẩm theo tên..." aria-label="Tìm kiếm sản phẩm" />
          <button type="submit">Tìm kiếm</button>
        </form>
        <nav className="nav">
          <NavLink to="/gio-hang" className="nav-link">
            Giỏ hàng {user && cart.soDong > 0 && <span className="cart-badge">{cart.soDong}</span>}
          </NavLink>
          <NavLink to="/chat" className="nav-link">Chatbox AI</NavLink>
          {user ? (
            <div className="user-menu" ref={menuRef}>
              <button className="user-btn" onClick={() => setOpen((o) => !o)}>
                <span className="avatar">{user.hoTen?.trim().slice(0, 1).toUpperCase()}</span>
                Xin chào, {user.hoTen} ▾
              </button>
              {open && (
                <div className="dropdown">
                  <Link to="/ho-so">Hồ sơ</Link>
                  <Link to="/don-hang">Lịch sử đơn hàng</Link>
                  <button className="danger" onClick={doLogout}>Đăng xuất</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/dang-nhap" className="btn btn-outline btn-sm">Đăng nhập</Link>
              <Link to="/dang-ky" className="btn btn-primary btn-sm">Đăng ký</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
