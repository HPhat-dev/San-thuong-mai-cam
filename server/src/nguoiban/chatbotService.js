import { SanPham, DonHang } from '../models/index.js';
import { DA_XU_LY } from './util.js';
const vnd = (n) => n.toLocaleString('vi-VN') + 'đ';

async function nguCanh(gh) {
  const [sp, dons] = await Promise.all([SanPham.find({ gianHangId: gh._id }), DonHang.find({ gianHangId: gh._id })]);
  return {
    soSanPham: sp.length, soDon: dons.length,
    choXuLy: dons.filter(o => o.trangThaiDH === 'choxacnhan').length,
    daXuLy: dons.filter(o => DA_XU_LY.includes(o.trangThaiDH)).length,
    doanhThu: dons.filter(o => o.trangThaiDH === 'hoanthanh').reduce((s, o) => s + o.tongTienDH, 0),
    sapHet: sp.filter(p => p.soLuongTon <= 10 && p.trangThaiSanPham === 'dangban').map(p => `${p.tenSanPham} (${p.soLuongTon})`)
  };
}
// Bộ trả lời theo luật – dùng khi chưa cấu hình AI_BASE_URL, AI_MODEL hoặc AI lỗi
function theoLuat(q, c) {
  q = q.toLowerCase();
  if (/mô tả|viết/.test(q)) return 'Bạn nên nêu rõ: tên và công dụng chính, thông số nổi bật, chất liệu/kích thước, chính sách đổi trả. Dùng câu ngắn, rõ ràng và thêm hình ảnh thật của sản phẩm.';
  if (/thêm sản phẩm|đăng sản phẩm/.test(q)) return 'Vào mục "Quản lý sản phẩm" → bấm "+ Thêm sản phẩm" → nhập tên, danh mục, giá bán (lớn hơn 0), tồn kho, mô tả, tải ảnh JPG/PNG → bấm "Lưu".';
  if (/xử lý đơn|đơn hàng/.test(q)) return `Vào "Xử lý đơn hàng", chọn đơn rồi cập nhật trạng thái: Chờ xử lý → Đã xử lý → Đang giao → Hoàn thành. Hiện có ${c.choXuLy} đơn đang chờ xử lý.`;
  if (/doanh thu|thống kê/.test(q)) return `Gian hàng của bạn có ${c.soSanPham} sản phẩm, ${c.soDon} đơn hàng, ${c.daXuLy} đơn đã xử lý và doanh thu ${vnd(c.doanhThu)} (tính trên đơn hoàn thành).`;
  if (/tồn|hết hàng|kho/.test(q)) return c.sapHet.length ? 'Sản phẩm sắp hết hàng: ' + c.sapHet.join(', ') + '.' : 'Hiện chưa có sản phẩm nào sắp hết hàng.';
  return 'Mình có thể hỗ trợ: viết mô tả sản phẩm, thêm sản phẩm, xử lý đơn hàng, xem thống kê doanh thu và tồn kho. Bạn muốn hỏi mục nào?';
}
// Gọi mô hình ngôn ngữ qua API tương thích OpenAI (Ollama, OpenAI...). Cấu hình AI_BASE_URL, AI_MODEL, AI_API_KEY trong .env
async function hoiAI(system, q) {
  const h = { 'content-type': 'application/json' };
  if (process.env.AI_API_KEY) h.Authorization = 'Bearer ' + process.env.AI_API_KEY;
  const r = await fetch(process.env.AI_BASE_URL.replace(/\/$/, '') + '/chat/completions', {
    method: 'POST', headers: h,
    body: JSON.stringify({ model: process.env.AI_MODEL, max_tokens: 600, messages: [{ role: 'system', content: system }, { role: 'user', content: q }] })
  });
  if (!r.ok) throw new Error('AI ' + r.status);
  const d = await r.json();
  return String(d.choices[0].message.content || '').trim();
}
export const traLoi = async (gianHang, q) => {
  const c = await nguCanh(gianHang);
  if (process.env.AI_BASE_URL && process.env.AI_MODEL) {
    try {
      const sys = `Bạn là trợ lý AI cho người bán trên sàn thương mại điện tử "Sàn Online". Trả lời ngắn gọn, thực tế, bằng tiếng Việt. ` +
        `Số liệu gian hàng "${gianHang.tenGianHang}": ${c.soSanPham} sản phẩm, ${c.soDon} đơn (${c.choXuLy} chờ xử lý), doanh thu ${vnd(c.doanhThu)}, sản phẩm sắp hết: ${c.sapHet.join(', ') || 'không có'}.`;
      return await hoiAI(sys, q);
    } catch (e) { console.error('Lỗi AI, dùng bộ trả lời theo luật:', e.message); }
  }
  return theoLuat(q, c);
};
