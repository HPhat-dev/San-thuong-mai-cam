import mongoose from 'mongoose';

// Nhận MONGO_URI (chuẩn của dự án này) hoặc MONGODB_URI (tên biến cũ của phần quản trị)
export const mongoUri = () =>
  process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/thuongmaidientu';

export async function connectDB() {
  await mongoose.connect(mongoUri());
  console.log('MongoDB đã kết nối:', mongoose.connection.name);
}
