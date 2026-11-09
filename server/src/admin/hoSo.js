import { NguoiDung } from '../models/index.js';

const getHoSo = async (req, res) => {
  try {
    const admin = await NguoiDung.findById(req.admin._id).select('-matKhau').lean();
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin quản trị viên.'
      });
    }

    return res.json({
      success: true,
      admin
    });
  } catch (error) {
    console.error('Lỗi lấy hồ sơ quản trị viên:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy thông tin hồ sơ.'
    });
  }
};

export {
  getHoSo
};
