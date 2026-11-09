import { TinNhanAI } from '../models/index.js';
import { HttpError } from '../utils/helpers.js';
import { traLoi } from './chatbotService.js';

// NB-09: gửi câu hỏi, lưu lịch sử vào TinNhanAI
export const hoi = async (req, res) => {
  const q = String(req.body.cauHoi || '').trim();
  if (!q || q.length > 500) throw new HttpError(400, 'Câu hỏi không hợp lệ (1–500 ký tự).');
  const a = await traLoi(req.gianHang, q);
  await TinNhanAI.create({ nguoiDungIdTN: req.user._id, cauHoi: q, cauTraLoi: a });
  res.json({ cauTraLoi: a });
};
export const lichSu = async (req, res) => {
  const l = await TinNhanAI.find({ nguoiDungIdTN: req.user._id }).sort({ thoiGian: -1 }).limit(30);
  res.json(l.reverse().map(m => ({ cauHoi: m.cauHoi, cauTraLoi: m.cauTraLoi })));
};
