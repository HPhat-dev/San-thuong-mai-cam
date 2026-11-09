import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Token hết hạn/không hợp lệ → xóa token và báo cho AuthContext đăng xuất
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(err);
  }
);

// Ảnh do người bán tải lên có dạng /uploads/...; nếu gọi API bằng địa chỉ tuyệt đối (VITE_API_URL)
// thì ghép với origin của backend, còn mặc định đi qua proxy cùng origin.
const apiOrigin = /^https?:/.test(import.meta.env.VITE_API_URL || '') ? new URL(import.meta.env.VITE_API_URL).origin : '';
export const assetUrl = (u) => (u && u.startsWith('/uploads/') ? apiOrigin + u : u);

export const SELLER_URL = import.meta.env.VITE_SELLER_URL || 'http://localhost:5174';

export const errMsg = (e) =>
  e.response?.data?.message || (e.request ? 'Không kết nối được máy chủ' : e.message);

export default api;
