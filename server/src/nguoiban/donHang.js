import mongoose from 'mongoose';
import { DonHang, SanPham, ThanhToan } from '../models/index.js';
import { HttpError } from '../utils/helpers.js';
import { FLOW, dtoDon, khoDangGiu } from './util.js';

const withFlow = (o) => ({ ...dtoDon(o), tiepTheo: FLOW[o.trangThaiDH] });

// Trừ kho nguyên tử cho từng dòng; thiếu hàng ở dòng nào thì hoàn lại các dòng đã trừ và báo lỗi
async function giuKho(items) {
  const done = [];
  try {
    for (const it of items) {
      const r = await SanPham.updateOne(
        { _id: it.sanPhamId, soLuongTon: { $gte: it.soLuong } },
        { $inc: { soLuongTon: -it.soLuong } }
      );
      if (r.modifiedCount !== 1) throw new HttpError(400, `Sản phẩm "${it.tenSanPham}" không đủ tồn kho.`);
      done.push(it);
    }
  } catch (e) {
    for (const it of done) await SanPham.updateOne({ _id: it.sanPhamId }, { $inc: { soLuongTon: it.soLuong } });
    throw e;
  }
}
const hoanKho = (items) =>
  Promise.all(items.map((it) => SanPham.updateOne({ _id: it.sanPhamId }, { $inc: { soLuongTon: it.soLuong } })));

// NB-07: danh sách đơn của gian hàng
export const danhSach = async (req, res) => {
  const f = { gianHangId: req.gianHang._id };
  if (req.query.trangThai) f.trangThaiDH = String(req.query.trangThai);
  const l = await DonHang.find(f).sort({ ngayDat: -1 }).populate('nguoiMuaId', 'hoTen');
  res.json(l.map(withFlow));
};
export const chiTiet = async (req, res) => {
  const o = mongoose.isValidObjectId(req.params.id)
    && await DonHang.findOne({ _id: req.params.id, gianHangId: req.gianHang._id }).populate('nguoiMuaId', 'hoTen');
  if (!o) throw new HttpError(404, 'Không tìm thấy đơn hàng.');
  res.json(withFlow(o));
};

// NB-07: cập nhật trạng thái theo luồng hợp lệ
//
// Quy tắc kho (thống nhất giữa khách hàng và người bán — mỗi đơn chỉ giữ kho MỘT lần):
//  - Đơn do khách đặt đã trừ kho ngay lúc đặt → xác nhận không trừ nữa.
//  - Đơn chưa giữ kho (dữ liệu cũ/mẫu) → trừ khi người bán xác nhận (thiếu hàng thì từ chối).
//  - Hủy đơn đang giữ kho (cả khi đang "chờ xử lý") → hoàn kho.
export const capNhatTrangThai = async (req, res) => {
  const o = mongoose.isValidObjectId(req.params.id)
    && await DonHang.findOne({ _id: req.params.id, gianHangId: req.gianHang._id });
  if (!o) throw new HttpError(404, 'Không tìm thấy đơn hàng.');
  const to = req.body.trangThai;
  if (!(FLOW[o.trangThaiDH] || []).includes(to)) throw new HttpError(400, 'Không thể chuyển sang trạng thái này.');

  if (to === 'daxacnhan' && !khoDangGiu(o)) {
    await giuKho(o.danhSachSanPham);
    o.khoDaTru = true;
  }
  if (to === 'dahuy' && khoDangGiu(o)) {
    await hoanKho(o.danhSachSanPham);
    o.khoDaTru = false;
  }

  o.trangThaiDH = to;
  await o.save();
  if (to === 'hoanthanh') {
    // Giao xong coi như đã thu tiền (COD hoặc chuyển khoản khách đã chọn ở bước Thanh toán).
    // VNPay thì không: tiền chỉ được ghi nhận khi VNPay báo thành công (xem routes/payments.js).
    await ThanhToan.updateMany(
      { donHangId: o._id, trangThaiTT: 'chuathanhtoan', phuongThucTT: { $ne: 'vnpay' } },
      { trangThaiTT: 'dathanhtoan', ngayThanhToan: new Date() }
    );
  }
  res.json({ message: 'Cập nhật trạng thái đơn thành công.', trangThai: to });
};
