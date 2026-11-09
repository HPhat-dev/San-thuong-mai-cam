import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { HttpError } from '../utils/helpers.js';
import { UPLOAD_DIR } from '../config/paths.js';
import { cloudinaryEnabled } from './imageStorage.js';

if (!cloudinaryEnabled) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export default multer({
  storage: cloudinaryEnabled ? multer.memoryStorage() : multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) =>
      cb(null, Date.now() + '-' + Math.round(Math.random() * 1e6) + path.extname(file.originalname).toLowerCase()),
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    /^image\/(jpeg|png)$/.test(file.mimetype) ? cb(null, true) : cb(new HttpError(400, 'Chỉ chấp nhận ảnh JPG, PNG.')),
});
