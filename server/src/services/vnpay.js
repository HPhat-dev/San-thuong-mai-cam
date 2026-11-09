// Tích hợp cổng thanh toán VNPay (API 2.1.0, môi trường Sandbox).
// Chữ ký: HMAC-SHA512 trên chuỗi tham số vnp_* đã sắp xếp theo tên và mã hóa URL.
import crypto from 'node:crypto';
import { stripAccents } from '../utils/helpers.js';

export const vnpayConfig = () => ({
  tmnCode: process.env.VNP_TMN_CODE || '',
  hashSecret: process.env.VNP_HASH_SECRET || '',
  url: process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  returnUrl: process.env.VNP_RETURN_URL || 'http://localhost:5173/thanh-toan/ket-qua',
});

export const vnpayEnabled = () => {
  const c = vnpayConfig();
  return Boolean(c.tmnCode && c.hashSecret);
};

// Sắp xếp theo tên tham số, mã hóa giá trị (khoảng trắng → '+') rồi nối "k=v&k=v".
// Đây đúng là chuỗi VNPay dùng để ký, và cũng là query string gửi đi.
function toSignData(params) {
  return Object.keys(params)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k]).replace(/%20/g, '+')}`)
    .join('&');
}

const hmac = (data) =>
  crypto.createHmac('sha512', vnpayConfig().hashSecret).update(Buffer.from(data, 'utf-8')).digest('hex');

// VNPay yêu cầu giờ Việt Nam (GMT+7) dạng yyyyMMddHHmmss, không phụ thuộc múi giờ của máy chủ.
const vnTime = (date) => new Date(date.getTime() + 7 * 3600 * 1000).toISOString().replace(/[-:T]/g, '').slice(0, 14);

// Mã tham chiếu giao dịch (vnp_TxnRef) — duy nhất cho MỖI LẦN thanh toán.
export const makeTxnRef = () => `${Date.now()}${crypto.randomInt(1000, 10000)}`;

// Địa chỉ IP khách; ::1 / ::ffff:127.0.0.1 khi chạy local được đổi về 127.0.0.1
export function clientIp(req) {
  const raw = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
  const ip = raw.replace(/^::ffff:/, '');
  return !ip || ip === '::1' ? '127.0.0.1' : ip;
}

// vnp_OrderInfo: tiếng Việt không dấu, không ký tự đặc biệt
const cleanInfo = (s) => stripAccents(s).replace(/[^A-Za-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);

export function buildPaymentUrl({ txnRef, amount, orderInfo, ipAddr, bankCode, locale }) {
  const c = vnpayConfig();
  const now = new Date();
  const params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: c.tmnCode,
    vnp_Locale: locale === 'en' ? 'en' : 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: cleanInfo(orderInfo),
    vnp_OrderType: 'other',
    vnp_Amount: Math.round(amount) * 100, // VNPay nhân số tiền với 100
    vnp_ReturnUrl: c.returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: vnTime(now),
    vnp_ExpireDate: vnTime(new Date(now.getTime() + 15 * 60 * 1000)), // hết hạn sau 15 phút
  };
  if (bankCode) params.vnp_BankCode = bankCode;
  const signData = toSignData(params);
  return `${c.url}?${signData}&vnp_SecureHash=${hmac(signData)}`;
}

// Xác thực dữ liệu VNPay trả về (query của IPN hoặc Return URL). true = chữ ký hợp lệ.
export function verifyParams(query) {
  const { vnp_SecureHash: given, vnp_SecureHashType: _type, ...rest } = query || {};
  if (typeof given !== 'string' || !vnpayEnabled()) return false;
  const data = {};
  for (const [k, v] of Object.entries(rest)) {
    if (k.startsWith('vnp_') && typeof v === 'string') data[k] = v;
  }
  const expected = Buffer.from(hmac(toSignData(data)));
  const actual = Buffer.from(given.toLowerCase());
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

// Mã phản hồi vnp_ResponseCode → thông báo cho khách
const RESPONSE_MESSAGES = {
  '00': 'Giao dịch thành công',
  '07': 'Tiền đã bị trừ nhưng giao dịch bị nghi ngờ (gian lận/bất thường)',
  '09': 'Thẻ/tài khoản chưa đăng ký dịch vụ Internet Banking',
  '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
  '11': 'Đã hết thời gian chờ thanh toán',
  '12': 'Thẻ/tài khoản bị khóa',
  '13': 'Nhập sai mật khẩu xác thực giao dịch (OTP)',
  '24': 'Bạn đã hủy giao dịch',
  '51': 'Tài khoản không đủ số dư',
  '65': 'Tài khoản đã vượt hạn mức giao dịch trong ngày',
  '75': 'Ngân hàng thanh toán đang bảo trì',
  '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định',
  '99': 'Lỗi khác',
};
export const vnpayMessage = (code) => RESPONSE_MESSAGES[code] || 'Giao dịch không thành công';
