// Dịch vụ gọi API đến Backend Node.js
// API quản trị nằm trên backend dùng chung tại /api/admin (mặc định đi qua proxy của Vite).
// Khi triển khai ở tên miền khác: đặt VITE_API_URL=https://api.example.com/api khi build.
const API_BASE = (import.meta.env.VITE_API_URL || '/api') + '/admin';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('admin_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        // Hết phiên đăng nhập -> Xóa token và chuyển về trang login
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      throw new Error(data.message || 'Yêu cầu thất bại');
    }

    return data;
  } catch (error) {
    throw error;
  }
}

export const authApi = {
  login: (username, matKhau) => request('/auth/login', {
    method: 'POST',
    body: { username, matKhau }
  }),
  getMe: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' })
};

export const khachHangApi = {
  getAll: (q = '') => request(`/khach-hang${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  update: (id, data) => request(`/khach-hang/${id}`, {
    method: 'PUT',
    body: data
  }),
  delete: (id) => request(`/khach-hang/${id}`, {
    method: 'DELETE'
  })
};

export const danhMucApi = {
  getAll: (q = '') => request(`/danh-muc${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  create: (data) => request('/danh-muc', {
    method: 'POST',
    body: data
  }),
  update: (id, data) => request(`/danh-muc/${id}`, {
    method: 'PUT',
    body: data
  }),
  delete: (id) => request(`/danh-muc/${id}`, {
    method: 'DELETE'
  })
};

export const nguoiBanApi = {
  getAll: (q = '') => request(`/nguoi-ban${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  update: (id, data) => request(`/nguoi-ban/${id}`, {
    method: 'PUT',
    body: data
  }),
  delete: (id) => request(`/nguoi-ban/${id}`, {
    method: 'DELETE'
  })
};

export const hoSoApi = {
  getProfile: () => request('/ho-so')
};
