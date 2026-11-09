import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NguoiDung, GianHang } from '../models/index.js';
import { HttpError, isEmail } from '../utils/helpers.js';

const sign = (u, days) => jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, { expiresIn: days + 'd' });
const pub = (u) => ({ id: u._id, username: u.username, hoTen: u.hoTen, email: u.email, role: u.role });

// NB-01 Đăng nhập
export const dangNhap = async (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  const u = await NguoiDung.findOne({ username });
  if (!u || u.role !== 'nguoiban' || !(await bcrypt.compare(password, u.matKhau)))
    throw new HttpError(401, 'Sai tên đăng nhập hoặc mật khẩu. Đăng nhập thất bại.');
  if (!u.trangThai) throw new HttpError(403, 'Tài khoản đã bị khóa.');
  res.json({ token: sign(u, req.body.ghiNho ? 7 : 1), user: pub(u) });
};

// NB-02 Đăng ký người bán (tự tạo kèm 1 gian hàng)
export const dangKy = async (req, res) => {
  const un = String(req.body.username || '').trim();
  const em = String(req.body.email || '').trim().toLowerCase();
  const pw = String(req.body.password || '');
  const errors = {};
  if (un.length < 4) errors.username = 'Tên đăng nhập tối thiểu 4 ký tự.';
  else if (await NguoiDung.exists({ username: un })) errors.username = 'Tài khoản đã tồn tại, vui lòng chọn tên khác.';
  if (!isEmail(em)) errors.email = 'Email không hợp lệ.';
  else if (await NguoiDung.exists({ email: em })) errors.email = 'Email đã được sử dụng.';
  if (pw.length < 6) errors.password = 'Mật khẩu tối thiểu 6 ký tự.';
  if (pw !== String(req.body.xacNhanMatKhau || '')) errors.xacNhanMatKhau = 'Mật khẩu xác nhận không trùng khớp.';
  if (Object.keys(errors).length) throw new HttpError(400, 'Dữ liệu không hợp lệ.', errors);
  const u = await NguoiDung.create({ username: un, email: em, matKhau: await bcrypt.hash(pw, 10), hoTen: un, role: 'nguoiban' });
  await GianHang.create({ tenGianHang: 'Gian hàng ' + un, nguoiBanId: u._id });
  res.status(201).json({ message: 'Đăng ký thành công.' });
};

// NB-03 Quên mật khẩu – bước 1: gửi mã
const tim = (k) => NguoiDung.findOne({ role: 'nguoiban', $or: [{ username: k }, { email: k.toLowerCase() }] });
export const guiMa = async (req, res) => {
  const k = String(req.body.taiKhoan || '').trim();
  const u = k && await tim(k);
  if (!u) throw new HttpError(404, 'Tài khoản/email không tồn tại trong hệ thống.', { taiKhoan: 'Tài khoản/email không tồn tại trong hệ thống.' });
  const ma = String(Math.floor(100000 + Math.random() * 900000));
  u.maDatLai = ma; u.hanMaDatLai = new Date(Date.now() + 10 * 60 * 1000);
  await u.save();
  console.log(`[Quên mật khẩu] Mã cho ${u.email}: ${ma}`);   // Thay bằng nodemailer khi triển khai thật
  const dev = process.env.NODE_ENV === 'production' ? {} : { maDev: ma };
  res.json({ message: 'Đã gửi mã xác nhận.', email: u.email, ...dev });
};
// Bước 2: xác nhận mã -> trả về token đặt lại (10 phút)
export const xacNhanMa = async (req, res) => {
  const u = await tim(String(req.body.taiKhoan || '').trim());
  const ma = String(req.body.ma || '').trim();
  if (!u || !u.maDatLai || u.maDatLai !== ma || u.hanMaDatLai < new Date())
    throw new HttpError(400, 'Mã xác nhận không đúng hoặc đã hết hạn.', { ma: 'Mã xác nhận không đúng hoặc đã hết hạn.' });
  res.json({ resetToken: jwt.sign({ id: u._id, purpose: 'reset' }, process.env.JWT_SECRET, { expiresIn: '10m' }) });
};
// Bước 3: đặt mật khẩu mới
export const datLaiMatKhau = async (req, res) => {
  let p;
  try { p = jwt.verify(String(req.body.resetToken || ''), process.env.JWT_SECRET); } catch (e) { throw new HttpError(400, 'Phiên đặt lại đã hết hạn, vui lòng làm lại.'); }
  if (p.purpose !== 'reset') throw new HttpError(400, 'Token không hợp lệ.');
  const errors = {};
  const mk = String(req.body.matKhauMoi || '');
  if (mk.length < 6) errors.matKhauMoi = 'Mật khẩu tối thiểu 6 ký tự.';
  if (mk !== String(req.body.nhapLai || '')) errors.nhapLai = 'Mật khẩu nhập lại không khớp.';
  if (Object.keys(errors).length) throw new HttpError(400, 'Dữ liệu không hợp lệ.', errors);
  await NguoiDung.updateOne({ _id: p.id }, { matKhau: await bcrypt.hash(mk, 10), $unset: { maDatLai: 1, hanMaDatLai: 1 } });
  res.json({ message: 'Đổi mật khẩu thành công.' });
};
