import { Router } from 'express';
import { GioHang, SanPham } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, bad, HttpError, isValidId } from '../utils/helpers.js';

const router = Router();
router.use(requireAuth);

// Đọc giỏ hàng + đối chiếu giá/tồn kho hiện tại. Dùng lại khi đặt hàng.
export async function loadCart(userId) {
  const cart = await GioHang.findOne({ nguoiDungId: userId }).lean();
  const items = cart?.danhSachSanPham || [];
  const prods = await SanPham.find({ _id: { $in: items.map((i) => i.sanPhamId) } })
    .populate('gianHangId', 'tenGianHang trangThai').lean();
  const byId = new Map(prods.map((p) => [String(p._id), p]));

  const lines = items.map((i) => {
    const p = byId.get(String(i.sanPhamId));
    const dangBan = !!p && p.trangThaiSanPham === 'dangban' && p.gianHangId?.trangThai === 'hoatdong';
    const khaDung = dangBan && p.soLuongTon > 0;
    const vuotTon = dangBan && i.soLuong > p.soLuongTon;
    let canhBao = null;
    if (!dangBan) canhBao = 'Sản phẩm không còn kinh doanh';
    else if (p.soLuongTon <= 0) canhBao = 'Sản phẩm đã hết hàng';
    else if (vuotTon) canhBao = `Sản phẩm chỉ còn ${p.soLuongTon} trong kho, vui lòng giảm số lượng`;
    else if (i.soLuong === p.soLuongTon) canhBao = `Sản phẩm chỉ còn ${p.soLuongTon} trong kho`;
    return {
      sanPhamId: i.sanPhamId,
      tenSanPham: p?.tenSanPham || '(Sản phẩm không còn tồn tại)',
      giaSanPham: p?.giaSanPham || 0,
      hinhAnh: p?.hinhAnhSanPham?.[0] || '',
      gianHangId: p?.gianHangId?._id,
      tenGianHang: p?.gianHangId?.tenGianHang || '',
      soLuong: i.soLuong,
      soLuongTon: p?.soLuongTon || 0,
      khaDung, vuotTon, canhBao,
      thanhTien: khaDung ? p.giaSanPham * i.soLuong : 0,
    };
  });
  return {
    lines,
    soDong: lines.length,
    tongSanPham: lines.filter((l) => l.khaDung).reduce((s, l) => s + l.soLuong, 0),
    tongTien: lines.reduce((s, l) => s + l.thanhTien, 0),
  };
}

// trả về giỏ hàng mới nhất và đồng bộ trường tongTien trong DB
async function respond(res, userId) {
  const view = await loadCart(userId);
  await GioHang.updateOne({ nguoiDungId: userId }, { tongTien: view.tongTien });
  res.json(view);
}

const parseQty = (v) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1 || n > 99) throw bad('Số lượng phải từ 1 đến 99');
  return n;
};

async function getSellable(sanPhamId) {
  if (!isValidId(sanPhamId)) throw new HttpError(404, 'Sản phẩm không tồn tại');
  const p = await SanPham.findById(sanPhamId).populate('gianHangId', 'trangThai').lean();
  if (!p || p.trangThaiSanPham !== 'dangban' || p.gianHangId?.trangThai !== 'hoatdong') {
    throw bad('Sản phẩm không còn kinh doanh');
  }
  return p;
}

// GET /api/cart
router.get('/', asyncHandler(async (req, res) => respond(res, req.user._id)));

// POST /api/cart/items  { sanPhamId, soLuong }  — thêm vào giỏ (Bảng 3.7)
router.post('/items', asyncHandler(async (req, res) => {
  const { sanPhamId } = req.body;
  const soLuong = parseQty(req.body.soLuong ?? 1);
  const p = await getSellable(sanPhamId);

  let cart = await GioHang.findOne({ nguoiDungId: req.user._id });
  if (!cart) cart = new GioHang({ nguoiDungId: req.user._id, danhSachSanPham: [], tongTien: 0 });
  const line = cart.danhSachSanPham.find((i) => String(i.sanPhamId) === sanPhamId);
  const moi = (line?.soLuong || 0) + soLuong;
  if (moi > p.soLuongTon) throw bad(`Chỉ còn ${p.soLuongTon} sản phẩm trong kho`);
  if (line) line.soLuong = moi;
  else cart.danhSachSanPham.push({ sanPhamId, soLuong: moi });
  await cart.save();
  await respond(res, req.user._id);
}));

// PATCH /api/cart/items/:sanPhamId  { soLuong } — đổi số lượng
router.patch('/items/:sanPhamId', asyncHandler(async (req, res) => {
  const { sanPhamId } = req.params;
  const soLuong = parseQty(req.body.soLuong);
  const cart = await GioHang.findOne({ nguoiDungId: req.user._id });
  const line = cart?.danhSachSanPham.find((i) => String(i.sanPhamId) === sanPhamId);
  if (!line) throw new HttpError(404, 'Sản phẩm không có trong giỏ hàng');
  const p = await getSellable(sanPhamId);
  if (soLuong > p.soLuongTon) throw bad(`Chỉ còn ${p.soLuongTon} sản phẩm trong kho`);
  line.soLuong = soLuong;
  await cart.save();
  await respond(res, req.user._id);
}));

// DELETE /api/cart/items/:sanPhamId — xóa khỏi giỏ
router.delete('/items/:sanPhamId', asyncHandler(async (req, res) => {
  if (!isValidId(req.params.sanPhamId)) throw bad('Sản phẩm không hợp lệ');
  await GioHang.updateOne(
    { nguoiDungId: req.user._id },
    { $pull: { danhSachSanPham: { sanPhamId: req.params.sanPhamId } } }
  );
  await respond(res, req.user._id);
}));

export default router;
