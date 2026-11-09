import express from 'express';
import cors from 'cors';
import { HttpError } from './utils/helpers.js';
import { UPLOAD_DIR } from './config/paths.js';
// --- tác nhân KHÁCH HÀNG: /api/...
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import { productRouter, categoryRouter } from './routes/products.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';
import reviewRoutes from './routes/reviews.js';
import chatRoutes from './routes/chat.js';
// --- tác nhân NGƯỜI BÁN: /api/nguoi-ban/...
import sellerRoutes from './nguoiban/index.js';
// --- tác nhân QUẢN TRỊ VIÊN: /api/admin/...
import adminRoutes from './admin/index.js';

// Ba giao diện chạy ở ba địa chỉ khác nhau → cho phép cả ba origin gọi API.
// Khai báo trong .env: CLIENT_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175
const origins = (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://localhost:5174,http://localhost:5175')
  .split(',').map((s) => s.trim()).filter(Boolean);

export function createApp() {
  const app = express();
  app.use(cors({ origin: origins }));
  app.use(express.json({ limit: '100kb' }));
  app.use('/uploads', express.static(UPLOAD_DIR)); // ảnh sản phẩm (người bán tải lên, khách hàng xem)

  app.get('/api/health', (req, res) => res.json({ ok: true }));

  app.use('/api/admin', adminRoutes);
  app.use('/api/nguoi-ban', sellerRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/categories', categoryRouter);
  app.use('/api/products', productRouter);
  app.use('/api/cart', cartRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/chat', chatRoutes);

  app.use('/api', (req, res) => res.status(404).json({ message: 'Không tìm thấy đường dẫn' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof HttpError) return res.status(err.status).json({ message: err.message, errors: err.errors });
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'Ảnh tối đa 2MB.', errors: {} });
    if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') return res.status(400).json({ message: 'Mỗi lần chỉ được tải lên tối đa 10 ảnh.', errors: {} });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Dữ liệu gửi lên không hợp lệ' });
    if (err.name === 'CastError') return res.status(400).json({ message: 'Mã định danh không hợp lệ' });
    if (err.code === 11000) return res.status(409).json({ message: 'Dữ liệu đã tồn tại' });
    console.error(err);
    res.status(500).json({ message: 'Lỗi máy chủ, vui lòng thử lại sau' });
  });
  return app;
}
