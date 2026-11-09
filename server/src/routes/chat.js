import { Router } from 'express';
import { TinNhanAI } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { askAI } from '../services/ai.js';
import { asyncHandler, bad, HttpError, str } from '../utils/helpers.js';

const router = Router();
router.use(requireAuth);

// GET /api/chat — lịch sử trò chuyện (50 tin gần nhất, cũ → mới)
router.get('/', asyncHandler(async (req, res) => {
  const list = await TinNhanAI.find({ nguoiDungIdTN: req.user._id }).sort({ thoiGian: -1 }).limit(50).lean();
  res.json(list.reverse());
}));

// POST /api/chat { cauHoi } — Use case "Chatbox AI" (Bảng 3.4)
router.post('/', asyncHandler(async (req, res) => {
  const cauHoi = str(req.body.cauHoi);
  if (!cauHoi) throw bad('Vui lòng nhập câu hỏi');
  if (cauHoi.length > 500) throw bad('Câu hỏi quá dài (tối đa 500 ký tự)');

  let kq;
  try {
    kq = await askAI(req.user, cauHoi);
  } catch (e) {
    console.error('[AI] lỗi:', e);
    throw new HttpError(502, 'AI hiện không xử lý được yêu cầu, vui lòng thử lại sau');
  }
  const tinNhan = await TinNhanAI.create({
    nguoiDungIdTN: req.user._id, cauHoi, cauTraLoi: kq.cauTraLoi, thoiGian: new Date(),
  });
  res.status(201).json({ tinNhan, sanPhamGoiY: kq.sanPhamGoiY });
}));

export default router;
