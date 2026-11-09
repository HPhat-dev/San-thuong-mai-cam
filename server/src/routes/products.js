import { Router } from 'express';
import { SanPham, GianHang, DanhMuc, DanhGia } from '../models/index.js';
import { asyncHandler, bad, HttpError, isValidId, str, viRegex } from '../utils/helpers.js';

export const productRouter = Router();
export const categoryRouter = Router();

const activeShopIds = () => GianHang.find({ trangThai: 'hoatdong' }).distinct('_id');

// GET /api/categories
categoryRouter.get('/', asyncHandler(async (req, res) => {
  res.json(await DanhMuc.find().sort({ tenDanhMuc: 1 }).lean());
}));

// GET /api/products?q=&danhMuc=&sort=moi|gia-tang|gia-giam&page=&limit=
// Use case "Tìm kiếm sản phẩm" (Bảng 3.5)
productRouter.get('/', asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(48, Math.max(1, parseInt(req.query.limit, 10) || 12));
  const filter = { trangThaiSanPham: 'dangban', gianHangId: { $in: await activeShopIds() } };

  const q = str(req.query.q);
  if (q) filter.tenSanPham = viRegex(q);
  const danhMuc = str(req.query.danhMuc);
  if (danhMuc) {
    if (!isValidId(danhMuc)) throw bad('Danh mục không hợp lệ');
    filter.danhMucId = danhMuc;
  }
  const sorts = { moi: { _id: -1 }, 'gia-tang': { giaSanPham: 1, _id: -1 }, 'gia-giam': { giaSanPham: -1, _id: -1 } };
  const sort = sorts[str(req.query.sort)] || sorts.moi;

  const [items, total] = await Promise.all([
    SanPham.find(filter).sort(sort).skip((page - 1) * limit).limit(limit)
      .populate('gianHangId', 'tenGianHang').populate('danhMucId', 'tenDanhMuc').lean(),
    SanPham.countDocuments(filter),
  ]);

  // điểm đánh giá trung bình cho các sản phẩm của trang này
  const stats = await DanhGia.aggregate([
    { $match: { sanPhamIdDG: { $in: items.map((p) => p._id) } } },
    { $group: { _id: '$sanPhamIdDG', tb: { $avg: '$soSao' }, soLuot: { $sum: 1 } } },
  ]);
  const byId = new Map(stats.map((s) => [String(s._id), s]));
  for (const p of items) {
    const s = byId.get(String(p._id));
    p.diemTB = s ? Math.round(s.tb * 10) / 10 : 0;
    p.soLuotDanhGia = s ? s.soLuot : 0;
  }
  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}));

// GET /api/products/:id — Use case "Xem chi tiết sản phẩm" (Bảng 3.6)
productRouter.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) throw new HttpError(404, 'Sản phẩm không tồn tại');
  const p = await SanPham.findById(id)
    .populate('gianHangId', 'tenGianHang moTaGianHang logo trangThai')
    .populate('danhMucId', 'tenDanhMuc').lean();
  if (!p) throw new HttpError(404, 'Sản phẩm không tồn tại');
  if (p.trangThaiSanPham !== 'dangban' || p.gianHangId?.trangThai !== 'hoatdong') {
    throw new HttpError(404, 'Sản phẩm hiện không còn kinh doanh');
  }
  const reviews = await DanhGia.find({ sanPhamIdDG: id }).sort({ ngayDanhGia: -1 }).limit(50)
    .populate('nguoiDungIdDG', 'hoTen').lean();
  const soLuotDanhGia = reviews.length;
  const diemTB = soLuotDanhGia
    ? Math.round((reviews.reduce((a, r) => a + r.soSao, 0) / soLuotDanhGia) * 10) / 10 : 0;
  // Sản phẩm tương tự: cùng danh mục, đang bán, gian hàng hoạt động
  const tuongTu = p.danhMucId
    ? await SanPham.find({
        _id: { $ne: id }, danhMucId: p.danhMucId._id, trangThaiSanPham: 'dangban',
        gianHangId: { $in: await activeShopIds() },
      }).sort({ _id: -1 }).limit(4).populate('gianHangId', 'tenGianHang').lean()
    : [];
  res.json({
    ...p,
    tuongTu,
    diemTB,
    soLuotDanhGia,
    danhGia: reviews.map((r) => ({
      _id: r._id, soSao: r.soSao, noiDungDanhGia: r.noiDungDanhGia,
      ngayDanhGia: r.ngayDanhGia, tenNguoiDanhGia: r.nguoiDungIdDG?.hoTen || 'Khách hàng',
    })),
  });
}));
