import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Giao diện QUẢN TRỊ chạy ở http://localhost:5175 (khác địa chỉ với khách hàng :5173 và người bán :5174)
// Khi dev, /api được chuyển tiếp sang backend dùng chung (cổng 5000)
const API = { target: 'http://localhost:5000', changeOrigin: true, secure: false };
export default defineConfig({
  plugins: [react()],
  server: { port: 5175, strictPort: true, proxy: { '/api': API } },
  preview: { port: 5175, strictPort: true, proxy: { '/api': API } },
});
