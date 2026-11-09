import { NguoiDung, DonHang, GioHang, DanhGia, TinNhanAI } from '../models/index.js';
import { escapeRegex } from '../utils/helpers.js';

const getDanhSachKhachHang = async (req, res) => {
  try {
    const q = req.query.q ? req.query.q.trim() : '';
    const filter = { role: 'nguoimua' };

    if (q) {
      filter.$or = [
        { hoTen: { $regex: escapeRegex(q), $options: 'i' } },
        { email: { $regex: escapeRegex(q), $options: 'i' } },
        { username: { $regex: escapeRegex(q), $options: 'i' } }
      ];
    }

    const khachHangs = await NguoiDung.find(filter).select('-matKhau').lean();

    const formattedList = khachHangs.map((kh, index) => {
      const codeIndex = String(index + 1).padStart(3, '0');
      let ngayThamGia = '01/2026';
      if (kh._id) {
        try {
          const timestamp = kh._id.getTimestamp();
          const month = String(timestamp.getMonth() + 1).padStart(2, '0');
          const year = timestamp.getFullYear();
          ngayThamGia = `${month}/${year}`;
        } catch (e) {
          ngayThamGia = '01/2026';
        }
      }

      return {
        ...kh,
        maKH: `KH${codeIndex}`,
        ngayThamGia
      };
    });

    const totalCount = await NguoiDung.countDocuments({ role: 'nguoimua' });

    return res.json({
      success: true,
      totalCount,
      khachHangs: formattedList
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách khách hàng:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tải danh sách khách hàng.'
    });
  }
};

const updateKhachHang = async (req, res) => {
  const { id } = req.params;
  const { hoTen, email, soDienThoai } = req.body;

  try {
    const targetUser = await NguoiDung.findById(id);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Khách hàng không tồn tại.' });
    }

    if (targetUser.role !== 'nguoimua') {
      return res.status(403).json({ success: false, message: 'Chỉ được phép chỉnh sửa tài khoản khách hàng.' });
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

    return res.json({
      success: true,
      message: 'Cập nhật tài khoản khách hàng thành công.',
      khachHang: targetUser
    });
  } catch (error) {
    console.error('Lỗi cập nhật khách hàng:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi cập nhật khách hàng.' });
  }
};

const deleteKhachHang = async (req, res) => {
  const { id } = req.params;

  try {
    const targetUser = await NguoiDung.findById(id);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Khách hàng không tồn tại.' });
    }

    if (targetUser.role !== 'nguoimua') {
      return res.status(403).json({ success: false, message: 'Chỉ được phép xóa tài khoản khách hàng, tuyệt đối không xóa Admin.' });
    }

    const orderCount = await DonHang.countDocuments({ nguoiMuaId: id });
    const reviewCount = await DanhGia.countDocuments({ nguoiDungIdDG: id });

    // Có đơn hàng hoặc đánh giá (hiển thị trên trang sản phẩm) → khóa thay vì xóa để không mất dữ liệu lịch sử
    if (orderCount > 0 || reviewCount > 0) {
      targetUser.trangThai = false;
      await targetUser.save();
      return res.json({
        success: true,
        message: `Khách hàng đã có ${orderCount} đơn hàng và ${reviewCount} đánh giá lịch sử. Hệ thống đã khóa tài khoản để bảo toàn dữ liệu.`
      });
    }

    await GioHang.deleteMany({ nguoiDungId: id });
    await TinNhanAI.deleteMany({ nguoiDungIdTN: id });
    await NguoiDung.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: 'Đã xóa tài khoản khách hàng thành công.'
    });
  } catch (error) {
    console.error('Lỗi xóa khách hàng:', error);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống khi xóa khách hàng.' });
  }
};

export {
  getDanhSachKhachHang,
  updateKhachHang,
  deleteKhachHang
};
