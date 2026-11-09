import { Router } from 'express';
import mongoose from 'mongoose';
import {
  DonHang, ThanhToan, SanPham, GianHang, DanhGia, GioHang,
} from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { loadCart } from './cart.js';
import {
  asyncHandler, bad, HttpError, isValidId, str, cleanPhone, maDon, maDonOf, EMAIL_RE, PHONE_RE,
} from '../utils/helpers.js';

const router = Router();
router.use(requireAuth);

// Gắn thêm: mã đơn, tên gian hàng, thanh toán, ảnh sản phẩm, cờ đã đánh giá theo đơn
async function present(orders, userId) {
  if (!orders.length) return [];
  const productIds = orders.flatMap((o) => o.danhSachSanPham.map((i) => i.sanPhamId));
  const orderIds = orders.map((o) => o._id);
  const [pays, shops, prods, reviews] = await Promise.all([
    ThanhToan.find({ donHangId: { $in: orderIds } }).lean(),
    GianHang.find({ _id: { $in: orders.map((o) => o.gianHangId) } }).select('tenGianHang').lean(),
    SanPham.find({ _id: { $in: productIds } }).select('hinhAnhSanPham').lean(),
    DanhGia.find({ nguoiDungIdDG: userId, donHangIdDG: { $in: orderIds }, sanPhamIdDG: { $in: productIds } })
      .select('donHangIdDG sanPhamIdDG').lean(),
  ]);
  const payBy = new Map(pays.map((p) => [String(p.donHangId), p]));
  const shopBy = new Map(shops.map((s) => [String(s._id), s.tenGianHang]));
  const imgBy = new Map(prods.map((p) => [String(p._id), p.hinhAnhSanPham?.[0] || '']));
  const reviewed = new Set(reviews.map((r) => `${r.donHangIdDG}:${r.sanPhamIdDG}`));

  return orders.map((o) => {
    const danhSachSanPham = o.danhSachSanPham.map((i) => ({
      ...i,
      hinhAnh: imgBy.get(String(i.sanPhamId)) || '',
      daDanhGia: reviewed.has(`${o._id}:${i.sanPhamId}`),
    }));
    const pay = payBy.get(String(o._id));
    return {
      ...o,
      ma: maDonOf(o),
      tenGianHang: shopBy.get(String(o.gianHangId)) || '',
      danhSachSanPham,
      thanhToan: pay
        ? { phuongThucTT: pay.phuongThucTT, trangThaiTT: pay.trangThaiTT, ngayThanhToan: pay.ngayThanhToan }
        : null,
      canDanhGia: o.trangThaiDH === 'hoanthanh' && danhSachSanPham.some((i) => !i.daDanhGia),
    };
  });
}

// POST /api/orders — Use case "Đặt hàng" (Bảng 3.8)
// Giỏ hàng có thể chứa nhiều gian hàng → tách thành mỗi gian hàng một đơn (DonHang.gianHangId).
router.post('/', asyncHandler(async (req, res) => {
  const uid = req.user._id;
  const b = req.body;
  const info = {
    tenNguoiNhan: str(b.tenNguoiNhan),
    sdtNhanHang: cleanPhone(b.sdtNhanHang),
    emailNhanHang: str(b.emailNhanHang).toLowerCase(),
    diaChiNhanHang: str(b.diaChiNhanHang),
    ghiChu: str(b.ghiChu).slice(0, 500),
  };
  if (!info.tenNguoiNhan) throw bad('Vui lòng nhập họ và tên người nhận');
  if (!PHONE_RE.test(info.sdtNhanHang)) throw bad('Số điện thoại không hợp lệ');
  if (info.emailNhanHang && !EMAIL_RE.test(info.emailNhanHang)) throw bad('Email không hợp lệ');
  if (!info.diaChiNhanHang) throw bad('Vui lòng nhập địa chỉ nhận hàng');

  const cart = await loadCart(uid);
  if (!cart.lines.length) throw bad('Giỏ hàng trống');
  const problem = cart.lines.find((l) => !l.khaDung || l.vuotTon);
  if (problem) throw bad(`${problem.tenSanPham}: ${problem.canhBao}`);

  const reserved = []; // dòng đã trừ kho, để hoàn lại nếu có lỗi
  const created = []; // đơn đã tạo, để xóa nếu có lỗi
  try {
    // Trừ kho nguyên tử: chỉ trừ khi còn đủ hàng
    for (const l of cart.lines) {
      const r = await SanPham.updateOne(
        { _id: l.sanPhamId, trangThaiSanPham: 'dangban', soLuongTon: { $gte: l.soLuong } },
        { $inc: { soLuongTon: -l.soLuong } }
      );
      if (r.modifiedCount !== 1) throw bad(`${l.tenSanPham} không đủ số lượng trong kho`);
      reserved.push(l);
    }

    const groups = new Map();
    for (const l of cart.lines) {
      const k = String(l.gianHangId);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(l);
    }
    for (const [gianHangId, ls] of groups) {
      const _id = new mongoose.Types.ObjectId();
      const order = await DonHang.create({
        _id,
        maDon: maDon(_id),
        khoDaTru: true, // kho đã trừ ở bước trên → người bán xác nhận đơn sẽ không trừ lần nữa
        nguoiMuaId: uid,
        gianHangId,
        danhSachSanPham: ls.map((l) => ({
          sanPhamId: l.sanPhamId, tenSanPham: l.tenSanPham, giaSanPham: l.giaSanPham, soLuong: l.soLuong,
        })),
        tongTienDH: ls.reduce((a, l) => a + l.thanhTien, 0),
        ...info,
        trangThaiDH: 'choxacnhan',
        ngayDat: new Date(),
      });
      created.push(order);
      await ThanhToan.create({
        donHangId: order._id, phuongThucTT: 'cod', soTienTT: order.tongTienDH, trangThaiTT: 'chuathanhtoan',
      });
    }
    await GioHang.updateOne({ nguoiDungId: uid }, { danhSachSanPham: [], tongTien: 0 });
    res.status(201).json({
      donHang: created.map((o) => ({ _id: o._id, ma: maDonOf(o), tongTienDH: o.tongTienDH })),
    });
  } catch (e) {
    for (const l of reserved) {
      await SanPham.updateOne({ _id: l.sanPhamId }, { $inc: { soLuongTon: l.soLuong } });
    }
    for (const o of created) {
      await ThanhToan.deleteMany({ donHangId: o._id });
      await DonHang.deleteOne({ _id: o._id });
    }
    throw e;
  }
}));

// GET /api/orders[?ids=a,b] — Use case "Lịch sử đặt hàng" (Bảng 3.10)
router.get('/', asyncHandler(async (req, res) => {
  const filter = { nguoiMuaId: req.user._id };
  const ids = str(req.query.ids);
  if (ids) {
    const list = ids.split(',').filter(isValidId).slice(0, 20);
    if (!list.length) throw bad('Mã đơn hàng không hợp lệ');
    filter._id = { $in: list };
  }
  const orders = await DonHang.find(filter).sort({ ngayDat: -1 }).lean();
  res.json(await present(orders, req.user._id));
}));

// GET /api/orders/:id — xem chi tiết một đơn
router.get('/:id', asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) throw new HttpError(404, 'Không tìm thấy đơn hàng');
  const o = await DonHang.findOne({ _id: req.params.id, nguoiMuaId: req.user._id }).lean();
  if (!o) throw new HttpError(404, 'Không tìm thấy đơn hàng');
  res.json((await present([o], req.user._id))[0]);
}));

export default router;
