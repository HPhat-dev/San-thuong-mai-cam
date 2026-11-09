import mongoose from 'mongoose';

export class HttpError extends Error {
  constructor(status, message, errors = {}) {
    super(message);
    this.status = status;
    this.errors = errors; // lỗi theo từng trường (giao diện người bán dùng để tô đỏ ô nhập)
  }
}
export const bad = (message) => new HttpError(400, message);

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const isValidId = (v) => typeof v === 'string' && /^[a-f\d]{24}$/i.test(v) && mongoose.isValidObjectId(v);

// Chỉ nhận chuỗi: chặn NoSQL injection kiểu { "$ne": "" } gửi qua JSON body.
export const str = (v) => (typeof v === 'string' ? v.trim() : '');

export const cleanPhone = (v) => str(v).replace(/[\s.-]/g, '');
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^(0|\+84)\d{9}$/;

// Mã đơn hiển thị cho người dùng, ví dụ DH01F89E (6 ký tự cuối của _id).
export const maDon = (id) => 'DH' + String(id).slice(-6).toUpperCase();
// Mã đơn thống nhất giữa khách hàng và người bán: dùng mã đã lưu (dữ liệu mẫu "DH0126"), nếu không có thì tính từ _id
export const maDonOf = (o) => o.maDon || maDon(o._id);

// Tiện ích riêng của phần người bán
export const isEmail = (s) => EMAIL_RE.test(s);
export const isPhone = (s) => /^0\d{9}$/.test(s);
export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const TRANG_THAI_DON = {
  choxacnhan: 'Chờ xác nhận',
  daxacnhan: 'Đã xác nhận',
  danggiao: 'Đang giao',
  hoanthanh: 'Hoàn thành',
  dahuy: 'Đã hủy',
};

export const stripAccents = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');

const VI = {
  a: 'aàáảãạăằắẳẵặâầấẩẫậ',
  e: 'eèéẻẽẹêềếểễệ',
  i: 'iìíỉĩị',
  o: 'oòóỏõọôồốổỗộơờớởỡợ',
  u: 'uùúủũụưừứửữự',
  y: 'yỳýỷỹỵ',
  d: 'dđ',
};

// Tạo RegExp tìm kiếm KHÔNG phân biệt dấu & hoa/thường: "dien thoai" khớp "Điện thoại".
export function viRegex(input) {
  const base = stripAccents(input).toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 100);
  let out = '';
  for (const ch of base) {
    if (VI[ch]) out += `[${VI[ch]}${VI[ch].toUpperCase()}]`;
    else out += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(out, 'i');
}
