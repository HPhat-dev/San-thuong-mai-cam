import { Router } from 'express';
import { NguoiDung } from '../models/index.js';
import { requireAuth, publicUser } from '../middleware/auth.js';
import {
  asyncHandler, bad, HttpError, str, cleanPhone, EMAIL_RE, PHONE_RE,
} from '../utils/helpers.js';

const router = Router();
router.use(requireAuth);

// GET /api/profile — Use case "Hồ sơ" (Bảng 3.11)
router.get('/', (req, res) => res.json(publicUser(req.user)));

// PUT /api/profile
router.put('/', asyncHandler(async (req, res) => {
  const hoTen = str(req.body.hoTen);
  const email = str(req.body.email).toLowerCase();
  const soDienThoai = cleanPhone(req.body.soDienThoai);
  const diaChi = str(req.body.diaChi);

  if (!hoTen) throw bad('Vui lòng nhập họ và tên');
  if (!EMAIL_RE.test(email)) throw bad('Email không hợp lệ');
  if (!PHONE_RE.test(soDienThoai)) throw bad('Số điện thoại không hợp lệ');
  if (!diaChi) throw bad('Vui lòng nhập địa chỉ');
  if (email !== req.user.email && (await NguoiDung.exists({ email, _id: { $ne: req.user._id } }))) {
    throw new HttpError(409, 'Email đã được sử dụng bởi tài khoản khác');
  }
  req.user.set({ hoTen, email, soDienThoai, diaChi });
  await req.user.save();
  res.json(publicUser(req.user));
}));

export default router;
