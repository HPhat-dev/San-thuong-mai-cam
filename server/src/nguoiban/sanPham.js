import mongoose from 'mongoose';
import { SanPham, DanhMuc } from '../models/index.js';
import { HttpError, escapeRegex } from '../utils/helpers.js';
import { deleteCloudinaryImages, uploadProductImages } from './imageStorage.js';

const dto = (p) => ({
  id: p._id, ten: p.tenSanPham, moTa: p.moTaSanPham, gia: p.giaSanPham, ton: p.soLuongTon,
  hinhAnh: (p.hinhAnhSanPham || [])[0] || null, hinhAnhs: p.hinhAnhSanPham || [], trangThai: p.trangThaiSanPham,
  danhMuc: p.danhMucId && p.danhMucId._id ? { id: p.danhMucId._id, ten: p.danhMucId.tenDanhMuc } : { id: p.danhMucId, ten: '' }
});

async function kiemTra(b) {
  const errors = {};
  const ten = String(b.tenSanPham || '').trim();
  if (!ten) errors.tenSanPham = 'Tên sản phẩm không được để trống.';
  const gia = Number(b.giaSanPham);
  if (b.giaSanPham === '' || !(gia > 0)) errors.giaSanPham = 'Giá bán phải là số lớn hơn 0.';
  const ton = Number(b.soLuongTon);
  if (b.soLuongTon === '' || b.soLuongTon == null || !Number.isInteger(ton) || ton < 0) errors.soLuongTon = 'Số lượng tồn kho phải là số nguyên không âm.';
  if (!mongoose.isValidObjectId(b.danhMucId) || !(await DanhMuc.exists({ _id: b.danhMucId }))) errors.danhMucId = 'Vui lòng chọn danh mục.';
  if (Object.keys(errors).length) throw new HttpError(400, Object.values(errors)[0], errors);
  return {
    tenSanPham: ten, moTaSanPham: String(b.moTaSanPham || '').trim(), giaSanPham: gia, soLuongTon: ton,
    danhMucId: b.danhMucId, trangThaiSanPham: b.trangThaiSanPham === 'ngungban' ? 'ngungban' : 'dangban'
  };
}

// NB-05: danh sách + tìm kiếm trong gian hàng
export const danhSach = async (req, res) => {
  const f = { gianHangId: req.gianHang._id };
  const q = String(req.query.q || '').trim();
  if (q) f.tenSanPham = new RegExp(escapeRegex(q), 'i');
  const l = await SanPham.find(f).populate('danhMucId', 'tenDanhMuc').sort({ _id: -1 });
  res.json(l.map(dto));
};
export const chiTiet = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'Không tìm thấy sản phẩm.');
  const p = await SanPham.findOne({ _id: req.params.id, gianHangId: req.gianHang._id }).populate('danhMucId', 'tenDanhMuc');
  if (!p) throw new HttpError(404, 'Không tìm thấy sản phẩm.');
  res.json(dto(p));
};
// NB-06: thêm
export const them = async (req, res) => {
  const d = await kiemTra(req.body);
  const images = await uploadProductImages(req.files);
  if (images.length) d.hinhAnhSanPham = images.map((image) => image.url);
  let p;
  try {
    p = await SanPham.create({ ...d, gianHangId: req.gianHang._id });
  } catch (error) {
    await deleteCloudinaryImages(images);
    throw error;
  }
  res.status(201).json({ message: 'Thêm sản phẩm thành công.', id: p._id });
};
// NB-06: sửa
export const sua = async (req, res) => {
  const p = mongoose.isValidObjectId(req.params.id) && await SanPham.findOne({ _id: req.params.id, gianHangId: req.gianHang._id });
  if (!p) throw new HttpError(404, 'Không tìm thấy sản phẩm.');
  const d = await kiemTra(req.body);
  let removedImages = [];
  if (req.body.hinhAnhXoa !== undefined) {
    try {
      removedImages = JSON.parse(req.body.hinhAnhXoa);
    } catch {
      throw new HttpError(400, 'Danh sách ảnh sản phẩm không hợp lệ.');
    }
    const currentImages = p.hinhAnhSanPham || [];
    if (!Array.isArray(removedImages) || !removedImages.every((image) => typeof image === 'string' && currentImages.includes(image))) {
      throw new HttpError(400, 'Danh sách ảnh sản phẩm không hợp lệ.');
    }
  }
  const images = await uploadProductImages(req.files);
  Object.assign(p, d);
  if (removedImages.length) {
    p.hinhAnhSanPham = (p.hinhAnhSanPham || []).filter((image) => !removedImages.includes(image));
  }
  if (images.length) p.hinhAnhSanPham.push(...images.map((image) => image.url));
  try {
    await p.save();
  } catch (error) {
    await deleteCloudinaryImages(images);
    throw error;
  }
  res.json({ message: 'Cập nhật sản phẩm thành công.' });
};
// NB-05: xóa
export const xoa = async (req, res) => {
  const r = mongoose.isValidObjectId(req.params.id) && await SanPham.findOneAndDelete({ _id: req.params.id, gianHangId: req.gianHang._id });
  if (!r) throw new HttpError(404, 'Không tìm thấy sản phẩm.');
  res.json({ message: 'Đã xóa sản phẩm.' });
};
export const danhMuc = async (req, res) => {
  const l = await DanhMuc.find().sort({ tenDanhMuc: 1 });
  res.json(l.map(d => ({ id: d._id, ten: d.tenDanhMuc })));
};
