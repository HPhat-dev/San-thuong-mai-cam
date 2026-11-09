import { NguoiDung } from '../models/index.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const postLogin = async (req, res) => {
  const { username, matKhau } = req.body;

  try {
    if (!username || !matKhau) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.'
      });
    }

    const cleanUsername = username.trim();
    const adminUser = await NguoiDung.findOne({
      $or: [
        { username: cleanUsername },
        { email: cleanUsername.toLowerCase() }
      ]
    });

    if (!adminUser) {
      return res.status(400).json({
        success: false,
        message: 'Sai tên đăng nhập hoặc mật khẩu, vui lòng nhập lại.'
      });
    }

    const isMatch = bcrypt.compareSync(matKhau, adminUser.matKhau);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Sai tên đăng nhập hoặc mật khẩu, vui lòng nhập lại.'
      });
    }

    if (adminUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản không có quyền truy cập hệ thống quản trị.'
      });
    }

    if (!adminUser.trangThai) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản quản trị viên này đã bị khóa.'
      });
    }

    const token = jwt.sign(
      {
        id: adminUser._id,
        username: adminUser.username,
        role: adminUser.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({
      success: true,
      message: 'Đăng nhập thành công.',
      token,
      admin: {
        id: adminUser._id,
        username: adminUser.username,
        hoTen: adminUser.hoTen,
        email: adminUser.email,
        soDienThoai: adminUser.soDienThoai,
        role: adminUser.role
      }
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống trong quá trình đăng nhập.'
    });
  }
};

const getMe = async (req, res) => {
  return res.json({
    success: true,
    admin: req.admin
  });
};

const logout = (req, res) => {
  return res.json({
    success: true,
    message: 'Đã đăng xuất thành công.'
  });
};

export {
  postLogin,
  getMe,
  logout
};
