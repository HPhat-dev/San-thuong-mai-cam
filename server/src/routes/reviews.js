import { Router } from 'express';
import { DonHang, DanhGia } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, bad, HttpError, isValidId, str } from '../utils/helpers.js';

const router = Router();
router.use(requireAuth);

// POST /api/reviews { donHangId, sanPhamId, soSao, noiDungDanhGia }
// Chỉ đánh giá được sản phẩm trong đơn đã hoàn thành của chính mình, mỗi sản phẩm mỗi đơn một lần.
router.post('/', asyncHandler(async (req, res) => {
  const { donHangId, sanPhamId } = req.body;
  const soSao = Number(req.body.soSao);
  const noiDungDanhGia = str(req.body.noiDungDanhGia).slice(0, 1000);

  if (!isValidId(donHangId) || !isValidId(sanPhamId)) throw bad('Dữ liệu không hợp lệ');
  if (!Number.isInteger(soSao) || soSao < 1 || soSao > 5) throw bad('Số sao phải từ 1 đến 5');

  const order = await DonHang.findOne({ _id: donHangId, nguoiMuaId: req.user._id }).lean();
  if (!order) throw new HttpError(404, 'Không tìm thấy đơn hàng');
  if (order.trangThaiDH !== 'hoanthanh') throw bad('Chỉ đánh giá được sau khi đơn hàng hoàn thành');
  if (!order.danhSachSanPham.some((i) => String(i.sanPhamId) === sanPhamId)) {
    throw bad('Sản phẩm không thuộc đơn hàng này');
  }
  if (await DanhGia.exists({ donHangIdDG: order._id, sanPhamIdDG: sanPhamId, nguoiDungIdDG: req.user._id })) {
    throw new HttpError(409, 'Bạn đã đánh giá sản phẩm này trong đơn hàng rồi');
  }
  const dg = await DanhGia.create({
    soSao, noiDungDanhGia, sanPhamIdDG: sanPhamId, nguoiDungIdDG: req.user._id,
    donHangIdDG: order._id, ngayDanhGia: new Date(),
  });
  res.status(201).json(dg);
}));

export default router;
