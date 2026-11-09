import { NguoiDung } from '../models/index.js';
import { HttpError, isEmail, isPhone } from '../utils/helpers.js';

const dto = (u, g) => ({ username: u.username, hoTen: u.hoTen, email: u.email, soDienThoai: u.soDienThoai || '', diaChi: u.diaChi || '', tenGianHang: g.tenGianHang });

// NB-08: xem / sửa hồ sơ
export const xem = (req, res) => res.json(dto(req.user, req.gianHang));
export const sua = async (req, res) => {
  const b = req.body, errors = {};
  const hoTen = String(b.hoTen || '').trim(), email = String(b.email || '').trim().toLowerCase();
  const sdt = String(b.soDienThoai || '').trim(), tenGH = String(b.tenGianHang || '').trim();
  if (!hoTen) errors.hoTen = 'Họ và tên không được để trống.';
  if (!isEmail(email)) errors.email = 'Email không hợp lệ.';
  else if (await NguoiDung.exists({ email, _id: { $ne: req.user._id } })) errors.email = 'Email đã được sử dụng.';
  if (sdt && !isPhone(sdt)) errors.soDienThoai = 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0.';
  if (!tenGH) errors.tenGianHang = 'Tên gian hàng không được để trống.';
  if (Object.keys(errors).length) throw new HttpError(400, Object.values(errors)[0], errors);
  Object.assign(req.user, { hoTen, email, soDienThoai: sdt, diaChi: String(b.diaChi || '').trim() });
  req.gianHang.tenGianHang = tenGH;
  await Promise.all([req.user.save(), req.gianHang.save()]);
  res.json({ message: 'Cập nhật hồ sơ thành công.', hoTen });
};
