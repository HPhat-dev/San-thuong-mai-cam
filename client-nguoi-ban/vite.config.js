import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readdirSync } from 'fs';

// Giao diện NGƯỜI BÁN chạy ở http://localhost:5174 (khác địa chỉ với khách hàng :5173)
// Khi dev, /api và /uploads được chuyển tiếp sang backend dùng chung (cổng 5000)
const API = 'http://localhost:5000';

// Giao diện gồm nhiều trang HTML: khai báo tất cả làm điểm vào khi build
const input = Object.fromEntries(
  readdirSync(__dirname).filter(f => f.endsWith('.html')).map(f => [f.replace('.html', ''), resolve(__dirname, f)])
);
export default defineConfig({
  server: { port: 5174, strictPort: true, proxy: { '/api': API, '/uploads': API } },
  preview: { port: 5174, strictPort: true, proxy: { '/api': API, '/uploads': API } },
  build: { rollupOptions: { input } },
});
