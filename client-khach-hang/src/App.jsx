import { Link, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import VnpayResult from './pages/VnpayResult';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import Chat from './pages/Chat';

const guard = (el) => <ProtectedRoute>{el}</ProtectedRoute>;

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/san-pham/:id" element={<ProductDetail />} />
          <Route path="/dang-nhap" element={<Login />} />
          <Route path="/dang-ky" element={<Register />} />
          <Route path="/quen-mat-khau" element={<ForgotPassword />} />
          <Route path="/gio-hang" element={guard(<Cart />)} />
          <Route path="/dat-hang" element={guard(<Checkout />)} />
          <Route path="/thanh-toan" element={guard(<Payment />)} />
          <Route path="/thanh-toan/ket-qua" element={<VnpayResult />} />
          <Route path="/don-hang" element={guard(<Orders />)} />
          <Route path="/ho-so" element={guard(<Profile />)} />
          <Route path="/chat" element={guard(<Chat />)} />
          <Route path="*" element={<div className="container page"><div className="card empty"><p>Không tìm thấy trang.</p><Link to="/" className="btn btn-primary">Về trang chủ</Link></div></div>} />
        </Routes>
      </main>
    </>
  );
}
