import { Router } from 'express';
import { DonHang, ThanhToan } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, bad, HttpError, isValidId, str, maDonOf } from '../utils/helpers.js';
import {
  buildPaymentUrl, verifyParams, vnpayEnabled, vnpayMessage, makeTxnRef, clientIp,
} from '../services/vnpay.js';

const router = Router();

// ───────────── VNPay: hai đường công khai (không có JWT, được bảo vệ bằng chữ ký) ─────────────

// Xử lý kết quả VNPay trả về. Dùng chung cho IPN (VNPay gọi máy chủ) và Return URL (trình duyệt quay về),
// nên chạy lại nhiều lần vẫn an toàn: đơn đã thanh toán thì không bị ghi đè.
// rsp là mã RspCode theo quy định của VNPay cho IPN.
async function applyVnpayResult(q) {
  if (!verifyParams(q)) return { rsp: '97', message: 'Invalid signature' };

  const ref = q.vnp_TxnRef;
  const pays = await ThanhToan.find({ maThamChieuVNP: ref }).lean();
  if (!pays.length) return { rsp: '01', message: 'Order not found' };

  const orders = await DonHang.find({ _id: { $in: pays.map((p) => p.donHangId) } }).lean();
  const amount = orders.reduce((a, o) => a + o.tongTienDH, 0);
  if (Number(q.vnp_Amount) !== amount * 100) return { rsp: '04', message: 'Invalid amount' };

  const info = {
    donHangIds: orders.map((o) => String(o._id)),
    maDon: orders.map((o) => maDonOf(o)),
    amount,
    responseCode: q.vnp_ResponseCode,
  };
  if (pays.every((p) => p.trangThaiTT === 'dathanhtoan')) {
    return { rsp: '02', message: 'Order already confirmed', ok: true, ...info };
  }

  const ok = q.vnp_ResponseCode === '00' && q.vnp_TransactionStatus === '00';
  await ThanhToan.updateMany(
    { maThamChieuVNP: ref, trangThaiTT: { $ne: 'dathanhtoan' } },
    {
      trangThaiTT: ok ? 'dathanhtoan' : 'thatbai',
      ...(ok && { ngayThanhToan: new Date() }),
      maGiaoDichVNP: q.vnp_TransactionNo,
      nganHangVNP: q.vnp_BankCode,
    }
  );
  return { rsp: '00', message: 'Confirm Success', ok, ...info };
}

// GET /api/payments/vnpay/ipn — VNPay gọi từ máy chủ của họ (cần địa chỉ công khai, vd. ngrok).
// Luôn trả HTTP 200 kèm { RspCode, Message } như tài liệu VNPay yêu cầu.
router.get('/vnpay/ipn', async (req, res) => {
  try {
    const r = await applyVnpayResult(req.query);
    res.json({ RspCode: r.rsp, Message: r.message });
  } catch (e) {
    console.error(e);
    res.json({ RspCode: '99', Message: 'Unknown error' });
  }
});

// GET /api/payments/vnpay/return?vnp_... — trang kết quả (React) chuyển nguyên query của VNPay sang đây.
// Chạy local không có IPN thì bước này vẫn ghi nhận thanh toán nhờ cùng một hàm xử lý.
router.get('/vnpay/return', asyncHandler(async (req, res) => {
  const r = await applyVnpayResult(req.query);
  if (r.rsp === '97') throw bad('Chữ ký VNPay không hợp lệ');
  if (r.rsp === '01') throw new HttpError(404, 'Không tìm thấy giao dịch');
  if (r.rsp === '04') throw bad('Số tiền giao dịch không khớp');
  res.json({
    thanhCong: r.ok,
    thongBao: vnpayMessage(r.responseCode),
    maDon: r.maDon,
    donHangIds: r.donHangIds,
    soTien: r.amount,
  });
}));

// ───────────── Các đường còn lại yêu cầu đăng nhập ─────────────
router.use(requireAuth);

// POST /api/payments/vnpay/create { donHangIds: [] } → { paymentUrl }
// Gộp các đơn chưa thanh toán thành MỘT giao dịch VNPay; mỗi lần bấm thanh toán (kể cả thử lại) sinh mã mới.
router.post('/vnpay/create', asyncHandler(async (req, res) => {
  if (!vnpayEnabled()) throw new HttpError(503, 'VNPay chưa được cấu hình trên máy chủ (thiếu VNP_TMN_CODE / VNP_HASH_SECRET).');
  const ids = Array.isArray(req.body.donHangIds) ? [...new Set(req.body.donHangIds.filter(isValidId))] : [];
  if (!ids.length || ids.length > 20) throw bad('Chưa chọn đơn hàng cần thanh toán');

  const orders = await DonHang.find({ _id: { $in: ids }, nguoiMuaId: req.user._id }).lean();
  if (orders.length !== ids.length) throw new HttpError(404, 'Không tìm thấy đơn hàng');
  if (orders.some((o) => o.trangThaiDH === 'dahuy')) throw bad('Đơn hàng đã bị hủy');

  const pays = await ThanhToan.find({ donHangId: { $in: ids } }).lean();
  const paid = new Set(pays.filter((p) => p.trangThaiTT === 'dathanhtoan').map((p) => String(p.donHangId)));
  const unpaid = orders.filter((o) => !paid.has(String(o._id)));
  if (!unpaid.length) throw bad('Đơn hàng đã được thanh toán');

  const txnRef = makeTxnRef();
  await ThanhToan.updateMany(
    { donHangId: { $in: unpaid.map((o) => o._id) }, trangThaiTT: { $ne: 'dathanhtoan' } },
    { phuongThucTT: 'vnpay', trangThaiTT: 'chuathanhtoan', maThamChieuVNP: txnRef }
  );

  const paymentUrl = buildPaymentUrl({
    txnRef,
    amount: unpaid.reduce((a, o) => a + o.tongTienDH, 0),
    orderInfo: `Thanh toan don hang ${unpaid.map((o) => maDonOf(o)).join(' ')}`,
    ipAddr: clientIp(req),
  });
  res.json({ paymentUrl });
}));

// POST /api/payments/confirm { donHangIds: [], phuongThucTT: 'cod' | 'chuyenkhoan' }
// Use case "Thanh toán" (Bảng 3.9). Đề tài chưa tích hợp cổng thanh toán thật nên chỉ ghi nhận
// phương thức; trạng thái "Đã thanh toán" do người bán/quản trị cập nhật khi đã nhận tiền.
router.post('/confirm', asyncHandler(async (req, res) => {
  const ids = Array.isArray(req.body.donHangIds) ? [...new Set(req.body.donHangIds.filter(isValidId))] : [];
  const phuongThucTT = str(req.body.phuongThucTT);
  if (!['cod', 'chuyenkhoan'].includes(phuongThucTT)) throw bad('Phương thức thanh toán không hợp lệ');
  if (!ids.length || ids.length > 20) throw bad('Chưa chọn đơn hàng cần thanh toán');

  const orders = await DonHang.find({ _id: { $in: ids }, nguoiMuaId: req.user._id }).lean();
  if (orders.length !== ids.length) throw new HttpError(404, 'Không tìm thấy đơn hàng');
  if (orders.some((o) => o.trangThaiDH === 'dahuy')) throw bad('Đơn hàng đã bị hủy');

  await ThanhToan.updateMany(
    { donHangId: { $in: ids }, trangThaiTT: { $ne: 'dathanhtoan' } },
    { phuongThucTT }
  );
  res.json({
    phuongThucTT,
    chuyenKhoan:
      phuongThucTT === 'chuyenkhoan'
        ? {
            nganHang: process.env.BANK_NAME || '',
            soTaiKhoan: process.env.BANK_ACCOUNT || '',
            chuTaiKhoan: process.env.BANK_OWNER || '',
            noiDung: orders.map((o) => maDonOf(o)).join(' '),
            soTien: orders.reduce((a, o) => a + o.tongTienDH, 0),
          }
        : null,
  });
}));

export default router;
