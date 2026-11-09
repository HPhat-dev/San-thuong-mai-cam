export const fmtMoney = (n) => `${Number(n || 0).toLocaleString('vi-VN')}đ`;
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '');
export const fmtMonth = (d) => {
  if (!d) return '';
  const x = new Date(d);
  return `${String(x.getMonth() + 1).padStart(2, '0')}/${x.getFullYear()}`;
};

export const ORDER_STATUS = {
  choxacnhan: ['Chờ xác nhận', 'b-yellow'],
  daxacnhan: ['Đã xác nhận', 'b-blue'],
  danggiao: ['Đang giao', 'b-indigo'],
  hoanthanh: ['Hoàn thành', 'b-green'],
  dahuy: ['Đã hủy', 'b-red'],
};
export const PAY_STATUS = {
  chuathanhtoan: ['Chưa thanh toán', 'b-yellow'],
  dathanhtoan: ['Đã thanh toán', 'b-green'],
  thatbai: ['Thất bại', 'b-red'],
};
export const PAY_METHOD = { cod: 'Thanh toán khi nhận hàng (COD)', chuyenkhoan: 'Chuyển khoản ngân hàng', vnpay: 'VNPay', khac: 'Khác' };

export const PHONE_RE = /^(0|\+84)\d{9}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Tách moTaSanPham thành phần giới thiệu + bảng thông số.
// Quy ước: mỗi dòng "Tên thông số: giá trị" (tên tối đa 6 từ) là một thông số,
// các dòng còn lại là phần giới thiệu.
//   Thương hiệu: SoundMax
//   Bảo hành: 12 tháng
export function parseMoTa(text = '') {
  const gioiThieu = [];
  const thongSo = [];
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^[-•*]?\s*([^:：]{1,40}?)\s*[:：]\s*(\S.*)$/u);
    if (m && m[1].trim().split(/\s+/).length <= 6 && !m[2].startsWith('//')) { // '//' = đường link http(s)://
      thongSo.push({ ten: m[1].trim(), giaTri: m[2].trim() });
    } else {
      gioiThieu.push(line);
    }
  }
  return { gioiThieu: gioiThieu.join('\n'), thongSo };
}
