import { DanhMuc, SanPham } from '../models/index.js';
import { escapeRegex } from '../utils/helpers.js';

const getDanhSachDanhMuc = async (req, res) => {
  try {
    const q = req.query.q ? req.query.q.trim() : '';
    const filter = {};

    if (q) {
      filter.$or = [
        { tenDanhMuc: { $regex: escapeRegex(q), $options: 'i' } },
        { moTaDanhMuc: { $regex: escapeRegex(q), $options: 'i' } }
      ];
    }

    const danhMucs = await DanhMuc.find(filter).lean();

    const productCounts = await SanPham.aggregate([
      {
        $group: {
          _id: '$danhMucId',
          count: { $sum: 1 }
        }
      }
    ]);

    const countMap = {};
    productCounts.forEach((item) => {
      countMap[String(item._id)] = item.count;
    });

    const formattedList = danhMucs.map((dm) => ({
      ...dm,
      soSanPham: countMap[String(dm._id)] || 0
    }));

    return res.json({
      success: true,
      totalCount: formattedList.length,
      danhMucs: formattedList
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách danh mục:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tải danh sách danh mục.'
    });
  }
};

const createDanhMuc = async (req, res) => {
  const { tenDanhMuc, moTaDanhMuc } = req.body;

  try {
    if (!tenDanhMuc || !tenDanhMuc.trim()) {
      return res.status(400).json({
        success: false,
        field: 'tenDanhMuc',
        message: 'Tên danh mục không được để trống.'
      });
    }

    const trimmedName = tenDanhMuc.trim();
    const existing = await DanhMuc.findOne({
      tenDanhMuc: { $regex: `^${escapeRegex(trimmedName)}$`, $options: 'i' }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        field: 'tenDanhMuc',
        message: 'Danh mục đã tồn tại, vui lòng nhập tên khác.'
      });
    }

    const newDM = new DanhMuc({
      tenDanhMuc: trimmedName,
      moTaDanhMuc: moTaDanhMuc ? moTaDanhMuc.trim() : ''
    });

    await newDM.save();

    return res.json({
      success: true,
      message: 'Thêm danh mục mới thành công.',
      danhMuc: newDM
    });
  } catch (error) {
    console.error('Lỗi tạo danh mục:', error);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống khi thêm danh mục.' });
  }
};

const updateDanhMuc = async (req, res) => {
  const { id } = req.params;
  const { tenDanhMuc, moTaDanhMuc } = req.body;

  try {
    const targetDM = await DanhMuc.findById(id);

    if (!targetDM) {
      return res.status(404).json({ success: false, message: 'Danh mục không tồn tại.' });
    }

    if (!tenDanhMuc || !tenDanhMuc.trim()) {
      return res.status(400).json({
        success: false,
        field: 'tenDanhMuc',
        message: 'Tên danh mục không được để trống.'
      });
    }

    const trimmedName = tenDanhMuc.trim();
    const existing = await DanhMuc.findOne({
      _id: { $ne: id },
      tenDanhMuc: { $regex: `^${escapeRegex(trimmedName)}$`, $options: 'i' }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        field: 'tenDanhMuc',
        message: 'Danh mục đã tồn tại, vui lòng nhập tên khác.'
      });
    }

    targetDM.tenDanhMuc = trimmedName;
    targetDM.moTaDanhMuc = moTaDanhMuc ? moTaDanhMuc.trim() : '';
    await targetDM.save();

    return res.json({
      success: true,
      message: 'Cập nhật danh mục thành công.',
      danhMuc: targetDM
    });
  } catch (error) {
    console.error('Lỗi cập nhật danh mục:', error);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống khi cập nhật danh mục.' });
  }
};

const deleteDanhMuc = async (req, res) => {
  const { id } = req.params;

  try {
    const targetDM = await DanhMuc.findById(id);

    if (!targetDM) {
      return res.status(404).json({ success: false, message: 'Danh mục không tồn tại.' });
    }

    const productCount = await SanPham.countDocuments({ danhMucId: id });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa danh mục "${targetDM.tenDanhMuc}" vì đang có ${productCount} sản phẩm liên kết. Vui lòng chuyển hoặc xóa sản phẩm trước.`
      });
    }

    await DanhMuc.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: 'Đã xóa danh mục thành công.'
    });
  } catch (error) {
    console.error('Lỗi xóa danh mục:', error);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống khi xóa danh mục.' });
  }
};

export {
  getDanhSachDanhMuc,
  createDanhMuc,
  updateDanhMuc,
  deleteDanhMuc
};
