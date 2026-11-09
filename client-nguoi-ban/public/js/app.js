// Tiện ích dùng chung cho mọi trang
// API của người bán nằm trên backend dùng chung tại /api/nguoi-ban (mặc định đi qua proxy của Vite).
// Khi triển khai ở tên miền khác, khai báo window.API_URL = 'https://api.example.com/api/nguoi-ban' trước khi nạp app.js
const API = window.API_URL || '/api/nguoi-ban';
const API_ORIGIN = /^https?:/.test(API) ? new URL(API).origin : '';
const imgUrl = (u) => (u && u.startsWith('/') ? API_ORIGIN + u : u);
// Địa chỉ giao diện khách hàng (để chuyển nhanh giữa hai kênh)
const KHACH_HANG_URL = window.KHACH_HANG_URL || 'http://localhost:5173';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';
const fmtDate = (d) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

// Phiên đăng nhập: "Ghi nhớ" -> localStorage, ngược lại -> sessionStorage
const Auth = {
  get token() { return localStorage.getItem('token') || sessionStorage.getItem('token'); },
  get user() { try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')); } catch (e) { return null; } },
  save(t, u, remember) { this.clear(); const s = remember ? localStorage : sessionStorage; s.setItem('token', t); s.setItem('user', JSON.stringify(u)); },
  setUser(u) { (localStorage.getItem('token') ? localStorage : sessionStorage).setItem('user', JSON.stringify(u)); },
  clear() { localStorage.clear(); sessionStorage.clear(); }
};

async function api(path, o = {}) {
  const h = {}; let body;
  if (Auth.token) h.Authorization = 'Bearer ' + Auth.token;
  if (o.form) body = o.form; else if (o.body) { h['Content-Type'] = 'application/json'; body = JSON.stringify(o.body); }
  let r;
  try { r = await fetch(API + path, { method: o.method || 'GET', headers: h, body }); }
  catch (e) { throw { message: 'Không kết nối được máy chủ.', errors: {} }; }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 401 && !o.noRedirect) { Auth.clear(); location.href = 'login.html'; }
    throw { status: r.status, message: d.message || 'Có lỗi xảy ra.', errors: d.errors || {} };
  }
  return d;
}

const STATUS = { choxacnhan: ['Chờ xử lý', 'cho'], daxacnhan: ['Đã xử lý', 'da'], danggiao: ['Đang giao', 'giao'], hoanthanh: ['Hoàn thành', 'xong'], dahuy: ['Đã hủy', 'huy'] };
const badge = (s) => { const t = STATUS[s] || [s, 'cho']; return `<span class="badge b-${t[1]}">${t[0]}</span>`; };

const COLORS = ['#6366f1', '#0ea5e9', '#ca8a04', '#10b981', '#e11d48', '#8b5cf6', '#f97316'];
function tile(name, img) {
  if (img) return `<img class="thumb" src="${esc(imgUrl(img))}" alt="">`;
  const w = String(name).trim().split(/\s+/); let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `<span class="thumb" style="background:${COLORS[h % COLORS.length]}">${esc(w[0])}${w[1] ? '<br>' + esc(w[1]) : ''}</span>`;
}

function toast(msg, bad) {
  let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  const d = document.createElement('div'); d.textContent = msg; if (bad) d.className = 'bad'; t.appendChild(d);
  setTimeout(() => d.remove(), 3800);
}

// Gắn lỗi vào form: input[name=k] đỏ + .msg[data-for=k] hiện thông báo
function setErrors(form, errors = {}) {
  $$('.err', form).forEach(e => e.classList.remove('err'));
  $$('.msg', form).forEach(m => m.textContent = '');
  for (const [k, v] of Object.entries(errors)) {
    const i = form.querySelector(`[name="${k}"]`); if (i) i.classList.add('err');
    const m = form.querySelector(`.msg[data-for="${k}"]`); if (m) m.textContent = v;
  }
}

function confirmModal({ icon = '', title, html, ok = 'Xác nhận', danger = false }) {
  return new Promise(res => {
    const o = document.createElement('div'); o.className = 'overlay';
    o.innerHTML = `<div class="modal">${icon ? `<div class="m-icon">${icon}</div>` : ''}<h3>${title}</h3><p>${html}</p><div class="m-btns"><button class="btn btn-light" data-r="0">Hủy</button><button class="btn ${danger ? 'btn-danger' : ''}" data-r="1">${ok}</button></div></div>`;
    o.onclick = (e) => { const b = e.target.closest('[data-r]'); if (b || e.target === o) { o.remove(); res(!!b && b.dataset.r === '1'); } };
    document.body.appendChild(o);
  });
}

// Khung giao diện chung: thanh bên + thanh trên + xác nhận đăng xuất
const Layout = {
  init(active, title) {
    if (!Auth.token) { location.href = 'login.html'; return false; }
    const u = Auth.user || {};
    const nav = [['dashboard', 'Thống kê', 'dashboard.html'], ['sanpham', 'Quản lý sản phẩm', 'san-pham.html'], ['donhang', 'Xử lý đơn hàng', 'don-hang.html'], ['chatbox', 'Chatbox AI', 'chatbox.html'], ['hoso', 'Hồ sơ', 'ho-so.html']];
    $('#side').innerHTML = `<div class="logo"><i><svg viewBox="0 0 36 36" aria-hidden="true"><path d="M18 10c-1-5 3-8 9-7-1 5-4 8-9 8" fill="#65a30d"/><circle cx="17" cy="21" r="12" fill="#f97316"/></svg></i>Sàn Cam</div><small>Kênh Người Bán</small>` +
      nav.map(n => `<a href="${n[2]}" class="${n[0] === active ? 'on' : ''}">${n[1]}</a>`).join('') + `<a id="logout">Đăng xuất</a>`;
    $('#top').innerHTML = `<h1>${title}</h1><div class="u"><span id="uname">${esc(u.hoTen || u.username)}</span><span class="av" id="uav">${esc((u.hoTen || u.username || '?')[0].toUpperCase())}</span></div>`;
    $('#logout').onclick = async () => {
      if (await confirmModal({ title: 'Xác nhận đăng xuất', html: 'Bạn có chắc muốn đăng xuất khỏi tài khoản người bán?', ok: 'Đăng xuất' })) { Auth.clear(); location.href = 'login.html'; }
    };
    return true;
  },
  setName(n) { $('#uname').textContent = n; $('#uav').textContent = n[0].toUpperCase(); }
};
