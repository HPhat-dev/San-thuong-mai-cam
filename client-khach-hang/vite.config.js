import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Giao diện KHÁCH HÀNG chạy ở http://localhost:5173
// Khi dev, /api và /uploads (ảnh sản phẩm) được chuyển tiếp sang backend dùng chung (cổng 5000)
const API = 'http://localhost:5000';
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true, proxy: { '/api': API, '/uploads': API } },
  preview: { port: 5173, strictPort: true, proxy: { '/api': API, '/uploads': API } },
});
