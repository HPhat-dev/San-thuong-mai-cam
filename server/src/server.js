import 'dotenv/config';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';

if (!process.env.JWT_SECRET) {
  console.error('Thiếu JWT_SECRET trong file .env (xem .env.example).');
  process.exit(1);
}

const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => createApp().listen(PORT, () => {
    console.log(`API dùng chung chạy tại http://localhost:${PORT}`);
    console.log('  • Khách hàng: /api/...        • Người bán: /api/nguoi-ban/...');
  }))
  .catch((e) => {
    console.error('Không kết nối được MongoDB:', e.message);
    process.exit(1);
  });
