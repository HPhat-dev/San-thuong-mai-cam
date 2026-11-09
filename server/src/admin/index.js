// Toàn bộ API của tác nhân QUẢN TRỊ VIÊN — được gắn tại /api/admin (xem src/app.js)
import { Router } from 'express';
import { requireAdmin } from './middleware.js';
import * as auth from './auth.js';
import * as kh from './khachHang.js';
import * as dm from './danhMuc.js';
import * as nb from './nguoiBan.js';
import * as hs from './hoSo.js';

const router = Router();

// Không cần đăng nhập
router.post('/auth/login', auth.postLogin);
router.post('/auth/logout', auth.logout);
router.get('/auth/logout', auth.logout);

// Cần đăng nhập với vai trò admin
router.use(requireAdmin);
router.get('/auth/me', auth.getMe);

router.get('/khach-hang', kh.getDanhSachKhachHang);
router.put('/khach-hang/:id', kh.updateKhachHang);
router.delete('/khach-hang/:id', kh.deleteKhachHang);

router.get('/danh-muc', dm.getDanhSachDanhMuc);
router.post('/danh-muc', dm.createDanhMuc);
router.put('/danh-muc/:id', dm.updateDanhMuc);
router.delete('/danh-muc/:id', dm.deleteDanhMuc);

router.get('/nguoi-ban', nb.getDanhSachNguoiBan);
router.put('/nguoi-ban/:id', nb.updateNguoiBan);
router.delete('/nguoi-ban/:id', nb.deleteNguoiBan);

router.get('/ho-so', hs.getHoSo);

export default router;
