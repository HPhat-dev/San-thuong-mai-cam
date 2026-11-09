import jwt from 'jsonwebtoken';
import { NguoiDung, GianHang } from '../models/index.js';

// Chỉ cho phép người bán đã đăng nhập; nạp sẵn gian hàng của họ vào req
export const requireSeller = async (req, res, next) => {
  try {
    const h = req.headers.authorization || '';
    if (!h.startsWith('Bearer ')) return res.status(401).json({ message: 'Bạn chưa đăng nhập.' });
    const payload = jwt.verify(h.slice(7), process.env.JWT_SECRET);
    // Token đặt lại mật khẩu (purpose = 'reset') không được dùng như token đăng nhập
    if (payload.purpose) return res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ.' });
    const user = await NguoiDung.findById(payload.id);
    if (!user || user.role !== 'nguoiban' || !user.trangThai) {
      return res.status(403).json({ message: 'Không có quyền truy cập.' });
    }
    const gianHang = await GianHang.findOne({ nguoiBanId: user._id });
    if (!gianHang) return res.status(403).json({ message: 'Tài khoản chưa có gian hàng.' });
    req.user = user;
    req.gianHang = gianHang;
    next();
  } catch {
    res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn.' });
  }
};
