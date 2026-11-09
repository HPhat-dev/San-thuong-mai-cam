import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NguoiDung } from '../models/index.js';
import { signToken, publicUser } from '../middleware/auth.js';
import {
  asyncHandler, bad, HttpError, str, cleanPhone, EMAIL_RE, PHONE_RE,
} from '../utils/helpers.js';

const router = Router();

const checkPassword = (pw) => {
  if (pw.length < 6) throw bad('Mật khẩu tối thiểu 6 ký tự');
  if (pw.length > 72) throw bad('Mật khẩu tối đa 72 ký tự');
};

// POST /api/auth/register — Use case "Đăng ký" (Bảng 3.1)
router.post('/register', asyncHandler(async (req, res) => {
  const hoTen = str(req.body.hoTen);
  const email = str(req.body.email).toLowerCase();
  const soDienThoai = cleanPhone(req.body.soDienThoai);
  const diaChi = str(req.body.diaChi);
  const matKhau = typeof req.body.matKhau === 'string' ? req.body.matKhau : '';
  const xacNhan = typeof req.body.xacNhanMatKhau === 'string' ? req.body.xacNhanMatKhau : '';

  if (!hoTen) throw bad('Vui lòng nhập họ và tên');
  if (!EMAIL_RE.test(email)) throw bad('Email không hợp lệ');
  if (!PHONE_RE.test(soDienThoai)) throw bad('Số điện thoại không hợp lệ');
  checkPassword(matKhau);
  if (matKhau !== xacNhan) throw bad('Mật khẩu xác nhận không trùng khớp');
  if (await NguoiDung.exists({ email })) throw new HttpError(409, 'Email đã được sử dụng');

  // username là trường bắt buộc/duy nhất trong DB: tự sinh từ phần đầu của email
  const base = email.split('@')[0].replace(/[^a-z0-9._-]/g, '').slice(0, 30) || 'user';
  let username = base;
  while (await NguoiDung.exists({ username })) {
    username = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
  }

  const user = await NguoiDung.create({
    username, email, hoTen, soDienThoai, diaChi,
    matKhau: await bcrypt.hash(matKhau, 10),
    role: 'nguoimua',
    trangThai: true,
  });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}));

// POST /api/auth/login — Use case "Đăng nhập" (Bảng 3.2). identifier = email hoặc username
router.post('/login', asyncHandler(async (req, res) => {
  const identifier = str(req.body.identifier);
  const matKhau = typeof req.body.matKhau === 'string' ? req.body.matKhau : '';
  if (!identifier || !matKhau) throw bad('Vui lòng nhập email và mật khẩu');

  const user = await NguoiDung.findOne({
    $or: [{ email: identifier.toLowerCase() }, { username: identifier }],
  });
  const ok = user && (await bcrypt.compare(matKhau, user.matKhau));
  if (!ok) throw new HttpError(401, 'Email hoặc mật khẩu không đúng');
  if (!user.trangThai) throw new HttpError(403, 'Tài khoản đã bị khóa');
  if (user.role !== 'nguoimua') {
    throw new HttpError(403, 'Đây không phải tài khoản khách hàng');
  }
  res.json({ token: signToken(user), user: publicUser(user) });
}));

// POST /api/auth/forgot-password — Use case "Quên mật khẩu" (Bảng 3.3)
// Theo đặc tả: kiểm tra email, nếu đúng thì cho phép vào trang đổi mật khẩu.
// Chưa có dịch vụ gửi email nên API trả về resetToken (sống 10 phút, dùng 1 lần).
router.post('/forgot-password', asyncHandler(async (req, res) => {
  const email = str(req.body.email).toLowerCase();
  if (!EMAIL_RE.test(email)) throw bad('Email không hợp lệ');
  const user = await NguoiDung.findOne({ email, role: 'nguoimua' });
  if (!user) throw new HttpError(404, 'Email không tồn tại trong hệ thống');
  const resetToken = jwt.sign(
    { id: String(user._id), purpose: 'reset', fp: user.matKhau.slice(-12) },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );
  res.json({ resetToken });
}));

// POST /api/auth/reset-password
router.post('/reset-password', asyncHandler(async (req, res) => {
  const matKhauMoi = typeof req.body.matKhauMoi === 'string' ? req.body.matKhauMoi : '';
  checkPassword(matKhauMoi);
  let payload;
  try {
    payload = jwt.verify(str(req.body.resetToken), process.env.JWT_SECRET);
  } catch {
    throw bad('Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
  }
  const user = payload.purpose === 'reset' ? await NguoiDung.findById(payload.id) : null;
  // fp đổi sau khi đặt lại mật khẩu → token chỉ dùng được một lần
  if (!user || user.matKhau.slice(-12) !== payload.fp) {
    throw bad('Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
  }
  user.matKhau = await bcrypt.hash(matKhauMoi, 10);
  await user.save();
  res.json({ message: 'Đặt lại mật khẩu thành công' });
}));

export default router;
