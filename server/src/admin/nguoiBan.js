import { NguoiDung, GianHang, SanPham, DonHang, TinNhanAI } from '../models/index.js';
import { escapeRegex } from '../utils/helpers.js';

const getDanhSachNguoiBan = async (req, res) => {
  try {
    const q = req.query.q ? req.query.q.trim() : '';
    const filter = { role: 'nguoiban' };

    if (q) {
      filter.$or = [
        { hoTen: { $regex: escapeRegex(q), $options: 'i' } },
        { email: { $regex: escapeRegex(q), $options: 'i' } },
        { username: { $regex: escapeRegex(q), $options: 'i' } }
      ];
    }

    const nguoiBans = await NguoiDung.find(filter).select('-matKhau').lean();

    const gianHangs = await GianHang.find().lean();
    const gianHangMap = {};
    gianHangs.forEach((gh) => {
      gianHangMap[String(gh.nguoiBanId)] = gh;
    });

    const formattedList = nguoiBans.map((nb, index) => {
      const codeIndex = String(index + 1).padStart(3, '0');
      const gh = gianHangMap[String(nb._id)];
      return {
        ...nb,
        maNB: `NB${codeIndex}`,
        tenGianHang: gh ? gh.tenGianHang : 'Chưa đăng ký',
        gianHangId: gh ? gh._id : null
      };
    });

    const totalCount = await NguoiDung.countDocuments({ role: 'nguoiban' });

    return res.json({
      success: true,
      totalCount,
      nguoiBans: formattedList
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách người bán:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tải danh sách người bán.'
    });
  }
};

const updateNguoiBan = async (req, res) => {
  const { id } = req.params;
  const { hoTen, email, soDienThoai, tenGianHang } = req.body;

  try {
    const targetUser = await NguoiDung.findById(id);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Người bán không tồn tại.' });
    }

    if (targetUser.role !== 'nguoiban') {
      return res.status(403).json({ success: false, message: 'Chỉ được phép chỉnh sửa tài khoản người bán.' });
    }

    if (!hoTen || !hoTen.trim()) {
      return res.status(400).json({ success: false, field: 'hoTen', message: 'Họ và tên không được để trống.' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, field: 'email', message: 'Email không được để trống.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, field: 'email', message: 'Định dạng email không hợp lệ.' });
    }

    const existingEmail = await NguoiDung.findOne({
      _id: { $ne: id },
      email: email.trim().toLowerCase()
    });

    if (existingEmail) {
      return res.status(400).json({ success: false, field: 'email', message: 'Email đã được sử dụng bởi tài khoản khác.' });
    }

    const cleanPhone = (soDienThoai || '').replace(/\s+/g, '');
    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    if (cleanPhone && !phoneRegex.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        field: 'soDienThoai',
        message: 'Số điện thoại không hợp lệ, vui lòng nhập lại.'
      });
    }

    targetUser.hoTen = hoTen.trim();
    targetUser.email = email.trim().toLowerCase();
    targetUser.soDienThoai = soDienThoai ? soDienThoai.trim() : '';
    await targetUser.save();

    if (tenGianHang && tenGianHang.trim()) {
      await GianHang.findOneAndUpdate(
        { nguoiBanId: id },
        { tenGianHang: tenGianHang.trim() }
      );
    }

    return res.json({
      success: true,
      message: 'Cập nhật tài khoản người bán thành công.',
      nguoiBan: targetUser
    });
  } catch (error) {
    console.error('Lỗi cập nhật người bán:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi cập nhật người bán.' });
  }
};

const deleteNguoiBan = async (req, res) => {
  const { id } = req.params;

  try {
    const targetUser = await NguoiDung.findById(id);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Người bán không tồn tại.' });
    }

    if (targetUser.role !== 'nguoiban') {
      return res.status(403).json({ success: false, message: 'Chỉ được phép xóa tài khoản người bán, không xóa Admin.' });
    }

    const gianHang = await GianHang.findOne({ nguoiBanId: id });
    let hasRelatedData = false;

    if (gianHang) {
      const productCount = await SanPham.countDocuments({ gianHangId: gianHang._id });
      const orderCount = await DonHang.countDocuments({ gianHangId: gianHang._id });

      if (productCount > 0 || orderCount > 0) {
        hasRelatedData = true;
      }
    }

    if (hasRelatedData) {
      targetUser.trangThai = false;
      await targetUser.save();

      if (gianHang) {
        gianHang.trangThai = 'ngunghoatdong';
        await gianHang.save();
      }

      return res.json({
        success: true,
        message: `Người bán đang có gian hàng/sản phẩm/đơn hàng liên kết. Hệ thống đã khóa tài khoản thay vì xóa cứng để bảo vệ dữ liệu.`
      });
    }

    if (gianHang) {
      await GianHang.findByIdAndDelete(gianHang._id);
    }
    await TinNhanAI.deleteMany({ nguoiDungIdTN: id });
    await NguoiDung.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: 'Đã xóa tài khoản người bán thành công.'
    });
  } catch (error) {
    console.error('Lỗi xóa người bán:', error);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống khi xóa người bán.' });
  }
};

export {
  getDanhSachNguoiBan,
  updateNguoiBan,
  deleteNguoiBan
};
