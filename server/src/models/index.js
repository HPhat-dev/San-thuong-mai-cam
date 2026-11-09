// Các model bám sát thiết kế Collection trong tài liệu (Bảng 3.37 → 3.45).
// Tên collection được chỉ định rõ để khớp với database `thuongmaidientu` đã có.
// DÙNG CHUNG cho cả hai tác nhân (khách hàng + người bán) — chỉ có một bộ model duy nhất.
import mongoose from 'mongoose';

const { Schema, model } = mongoose;
const ref = (name, extra = {}) => ({ type: Schema.Types.ObjectId, ref: name, ...extra });
const opts = { versionKey: false };

export const NguoiDung = model(
  'NguoiDung',
  new Schema(
    {
      username: { type: String, required: true, unique: true, trim: true },
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      matKhau: { type: String, required: true },
      hoTen: { type: String, required: true, trim: true },
      soDienThoai: { type: String, trim: true },
      diaChi: { type: String, trim: true },
      anhDaiDien: { type: String },
      role: { type: String, enum: ['admin', 'nguoimua', 'nguoiban'], default: 'nguoimua' },
      trangThai: { type: Boolean, default: true },
      // Quên mật khẩu của người bán (mã 6 số, hết hạn sau 10 phút)
      maDatLai: String,
      hanMaDatLai: Date,
    },
    opts
  ),
  'NguoiDung'
);

export const GianHang = model(
  'GianHang',
  new Schema(
    {
      tenGianHang: { type: String, required: true },
      moTaGianHang: String,
      logo: String,
      nguoiBanId: ref('NguoiDung'),
      trangThai: { type: String, default: 'hoatdong' }, // hoatdong | tamkhoa
    },
    opts
  ),
  'GianHang'
);

export const DanhMuc = model(
  'DanhMuc',
  new Schema({ tenDanhMuc: { type: String, required: true }, moTaDanhMuc: String }, opts),
  'DanhMuc'
);

export const SanPham = model(
  'SanPham',
  new Schema(
    {
      tenSanPham: { type: String, required: true },
      moTaSanPham: String,
      giaSanPham: { type: Number, required: true, min: 0 },
      soLuongTon: { type: Number, default: 0, min: 0 },
      hinhAnhSanPham: [String],
      trangThaiSanPham: { type: String, enum: ['dangban', 'ngungban'], default: 'dangban' },
      danhMucId: ref('DanhMuc'),
      gianHangId: ref('GianHang'),
    },
    opts
  ),
  'SanPham'
);

export const GioHang = model(
  'GioHang',
  new Schema(
    {
      nguoiDungId: ref('NguoiDung', { required: true, unique: true }),
      danhSachSanPham: [
        { _id: false, sanPhamId: ref('SanPham'), soLuong: { type: Number, min: 1, default: 1 } },
      ],
      tongTien: { type: Number, default: 0 },
    },
    opts
  ),
  'GioHang'
);

export const DonHang = model(
  'DonHang',
  new Schema(
    {
      maDon: String, // mã hiển thị; đơn cũ không có thì tính từ _id (xem maDonOf trong utils/helpers.js)
      nguoiMuaId: ref('NguoiDung', { required: true }),
      gianHangId: ref('GianHang', { required: true }),
      danhSachSanPham: [
        {
          _id: false,
          sanPhamId: ref('SanPham'),
          tenSanPham: String,
          giaSanPham: Number,
          soLuong: Number,
        },
      ],
      tongTienDH: { type: Number, required: true },
      diaChiNhanHang: { type: String, required: true },
      sdtNhanHang: { type: String, required: true },
      // Các trường bổ sung (giao diện KH-07 có nhưng bảng 3.42 chưa có):
      tenNguoiNhan: String,
      emailNhanHang: String,
      ghiChu: String,
      // true = kho đã được trừ cho đơn này (khách đặt hàng trừ ngay). Không có giá trị mặc định:
      // đơn cũ không có cờ → suy ra từ trạng thái, xem khoDangGiu() trong nguoiban/util.js
      khoDaTru: Boolean,
      trangThaiDH: {
        type: String,
        enum: ['choxacnhan', 'daxacnhan', 'danggiao', 'hoanthanh', 'dahuy'],
        default: 'choxacnhan',
      },
      ngayDat: { type: Date, default: Date.now },
    },
    opts
  ),
  'DonHang'
);

export const ThanhToan = model(
  'ThanhToan',
  new Schema(
    {
      donHangId: ref('DonHang', { required: true }),
      phuongThucTT: { type: String, enum: ['cod', 'chuyenkhoan', 'vnpay', 'khac'], default: 'cod' },
      soTienTT: Number,
      trangThaiTT: {
        type: String,
        enum: ['chuathanhtoan', 'dathanhtoan', 'thatbai'],
        default: 'chuathanhtoan',
      },
      ngayThanhToan: Date,
      // VNPay: một lần thanh toán có thể gộp nhiều đơn → các ThanhToan cùng mang một mã tham chiếu (vnp_TxnRef)
      maThamChieuVNP: { type: String, index: true },
      maGiaoDichVNP: String, // vnp_TransactionNo — mã giao dịch phía VNPay
      nganHangVNP: String, // vnp_BankCode
    },
    opts
  ),
  'ThanhToan'
);

export const DanhGia = model(
  'DanhGia',
  new Schema(
    {
      soSao: { type: Number, min: 1, max: 5, required: true },
      noiDungDanhGia: String,
      sanPhamIdDG: ref('SanPham', { required: true }),
      nguoiDungIdDG: ref('NguoiDung', { required: true }),
      donHangIdDG: ref('DonHang'),
      ngayDanhGia: { type: Date, default: Date.now },
    },
    opts
  ),
  'DanhGia'
);

export const TinNhanAI = model(
  'TinNhanAI',
  new Schema(
    {
      nguoiDungIdTN: ref('NguoiDung', { required: true }),
      cauHoi: String,
      cauTraLoi: String,
      thoiGian: { type: Date, default: Date.now },
    },
    opts
  ),
  'TinNhanAI'
);
