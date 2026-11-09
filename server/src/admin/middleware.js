import jwt from 'jsonwebtoken';
import { NguoiDung } from '../models/index.js';

// Chỉ cho phép quản trị viên đã đăng nhập (token Bearer, ký bằng JWT_SECRET dùng chung)
export const requireAdmin = async (req, res, next) => {
  try {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : '';
    if (!token) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập. Vui lòng đăng nhập với quyền quản trị.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
    }
    // Token đặt lại mật khẩu (purpose = 'reset') không được dùng như token đăng nhập
    if (decoded.purpose) {
      return res.status(401).json({ success: false, message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
    }

    const adminUser = await NguoiDung.findById(decoded.id).select('-matKhau');
    if (!adminUser) {
      return res.status(401).json({ success: false, message: 'Tài khoản quản trị không tồn tại.' });
    }
    if (adminUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Từ chối truy cập: Bạn không có quyền quản trị viên.' });
    }
    if (!adminUser.trangThai) {
      return res.status(403).json({ success: false, message: 'Tài khoản quản trị viên của bạn đã bị vô hiệu hóa.' });
    }

    req.admin = adminUser;
    next();
  } catch (error) {
    console.error('Lỗi xác thực quản trị viên:', error);
    return res.status(500).json({ success: false, message: 'Lỗi xác thực hệ thống.' });
  }
};
