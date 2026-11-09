// Toàn bộ API của tác nhân NGƯỜI BÁN — được gắn tại /api/nguoi-ban (xem src/app.js)
import { Router } from 'express';
import { asyncHandler as wrap } from '../utils/helpers.js';
import { requireSeller } from './middleware.js';
import upload from './upload.js';
import * as auth from './auth.js';
import * as sp from './sanPham.js';
import * as dh from './donHang.js';
import * as tk from './thongKe.js';
import * as hs from './hoSo.js';
import * as ai from './chatbot.js';

const router = Router();

// Không cần đăng nhập
router.post('/auth/dang-nhap', wrap(auth.dangNhap));
router.post('/auth/dang-ky', wrap(auth.dangKy));
router.post('/auth/quen-mat-khau/gui-ma', wrap(auth.guiMa));
router.post('/auth/quen-mat-khau/xac-nhan-ma', wrap(auth.xacNhanMa));
router.post('/auth/quen-mat-khau/dat-lai', wrap(auth.datLaiMatKhau));

// Cần đăng nhập với vai trò người bán
router.use(requireSeller);
router.get('/thong-ke', wrap(tk.thongKe));
router.get('/danh-muc', wrap(sp.danhMuc));
router.get('/san-pham', wrap(sp.danhSach));
router.get('/san-pham/:id', wrap(sp.chiTiet));
router.post('/san-pham', upload.array('hinhAnh', 10), wrap(sp.them));
router.put('/san-pham/:id', upload.array('hinhAnh', 10), wrap(sp.sua));
router.delete('/san-pham/:id', wrap(sp.xoa));
router.get('/don-hang', wrap(dh.danhSach));
router.get('/don-hang/:id', wrap(dh.chiTiet));
router.patch('/don-hang/:id/trang-thai', wrap(dh.capNhatTrangThai));
router.get('/ho-so', hs.xem);
router.put('/ho-so', wrap(hs.sua));
router.post('/chatbot', wrap(ai.hoi));
router.get('/chatbot/lich-su', wrap(ai.lichSu));

export default router;
