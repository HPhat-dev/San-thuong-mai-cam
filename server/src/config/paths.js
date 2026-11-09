import path from 'node:path';
import { fileURLToPath } from 'node:url';

// server/uploads — ảnh sản phẩm do người bán tải lên, được phục vụ tại /uploads
export const UPLOAD_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'uploads');
