import jwt from 'jsonwebtoken';
import { NguoiDung } from '../models/index.js';

export const signToken = (user) =>
  jwt.sign({ id: String(user._id), role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

export const publicUser = (u) => ({
  id: u._id,
  username: u.username,
  email: u.email,
  hoTen: u.hoTen,
  soDienThoai: u.soDienThoai || '',
  diaChi: u.diaChi || '',
  anhDaiDien: u.anhDaiDien || '',
  role: u.role,
  thamGia: u._id.getTimestamp(), // "Tham gia 01/2026": lấy từ thời điểm tạo _id
});

// Chỉ cho phép tài khoản khách hàng (role = nguoimua) còn hoạt động.
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Vui lòng đăng nhập' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.purpose) throw new Error('token không dùng để đăng nhập');
    const user = await NguoiDung.findById(payload.id);
    if (!user || !user.trangThai) {
      return res.status(401).json({ message: 'Tài khoản không khả dụng' });
    }
    if (user.role !== 'nguoimua') {
      return res.status(403).json({ message: 'Chức năng này chỉ dành cho tài khoản khách hàng' });
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' });
  }
}
