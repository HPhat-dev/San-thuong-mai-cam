import { maDonOf } from '../utils/helpers.js';

// Luồng trạng thái đơn hàng hợp lệ (người bán chuyển đơn theo các bước này)
export const FLOW = {
  choxacnhan: ['daxacnhan', 'dahuy'],
  daxacnhan: ['danggiao', 'dahuy'],
  danggiao: ['hoanthanh'],
  hoanthanh: [],
  dahuy: [],
};
export const DA_XU_LY = ['daxacnhan', 'danggiao', 'hoanthanh'];

// Kho đã được giữ cho đơn này chưa?
//  - Đơn tạo từ phía khách hàng: luôn đã trừ kho ngay lúc đặt (khoDaTru = true).
//  - Đơn cũ/dữ liệu mẫu không có cờ này: theo quy tắc cũ, kho chỉ bị trừ khi người bán xác nhận.
export const khoDangGiu = (o) =>
  typeof o.khoDaTru === 'boolean' ? o.khoDaTru : DA_XU_LY.includes(o.trangThaiDH);

export const dtoDon = (o) => ({
  id: o._id,
  maDon: maDonOf(o),
  khachHang: o.nguoiMuaId && o.nguoiMuaId.hoTen,
  sdt: o.sdtNhanHang,
  diaChi: o.diaChiNhanHang,
  items: (o.danhSachSanPham || []).map((i) => ({ ten: i.tenSanPham, gia: i.giaSanPham, soLuong: i.soLuong })),
  tongTien: o.tongTienDH,
  trangThai: o.trangThaiDH,
  ngayDat: o.ngayDat,
});
