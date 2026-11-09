import { v2 as cloudinary } from 'cloudinary';
import { HttpError } from '../utils/helpers.js';

const credentials = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};
const configuredCount = Object.values(credentials).filter(Boolean).length;

if (configuredCount > 0 && configuredCount < 3) {
  throw new Error('Cần khai báo đủ CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY và CLOUDINARY_API_SECRET.');
}

export const cloudinaryEnabled = configuredCount === 3;

if (cloudinaryEnabled) cloudinary.config({ ...credentials, secure: true });

export async function uploadProductImages(files) {
  if (!files?.length) return [];
  if (!cloudinaryEnabled) {
    return files.map((file) => ({ url: '/uploads/' + file.filename, publicId: null }));
  }

  const uploaded = [];
  try {
    for (const file of files) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'san-online/products', resource_type: 'image' },
          (error, response) => {
            if (error) reject(error);
            else if (!response?.secure_url || !response.public_id) reject(new Error('Cloudinary không trả về thông tin ảnh.'));
            else resolve({ url: response.secure_url, publicId: response.public_id });
          }
        );
        stream.end(file.buffer);
      });
      uploaded.push(result);
    }
    return uploaded;
  } catch (error) {
    console.error('Không thể tải ảnh sản phẩm lên Cloudinary:', error.message);
    await deleteCloudinaryImages(uploaded);
    throw new HttpError(502, 'Không thể tải ảnh lên dịch vụ lưu trữ. Vui lòng thử lại.');
  }
}

export async function deleteCloudinaryImages(images) {
  await Promise.all(images.filter((image) => image.publicId).map(async (image) => {
    try {
      const result = await cloudinary.uploader.destroy(image.publicId, { resource_type: 'image' });
      if (result.result !== 'ok' && result.result !== 'not found') {
        console.error('Không thể xóa ảnh Cloudinary:', image.publicId, result.result);
      }
    } catch (error) {
      console.error('Không thể xóa ảnh Cloudinary:', image.publicId, error.message);
    }
  }));
}
