// Nhập dữ liệu mẫu từ thư mục seed-data/ (các file xuất từ MongoDB Compass).
//   npm run seed                → chỉ nhập vào collection đang TRỐNG
//   npm run seed -- --force     → XÓA toàn bộ rồi nhập lại (cẩn thận!)
//   npm run seed:demo           → như `seed` + thêm dữ liệu demo người bán (tranminhkhoa, Khoa Store, đơn DH0122–DH0126…)
//                                 khớp các màn hình NB-01 → NB-09. Chạy lặp lại không tạo trùng.
// Mật khẩu tài khoản mẫu được đặt lại thành SEED_PASSWORD (mặc định 123456).
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { mongoUri } from './config/db.js';
import { NguoiDung, GianHang, DanhMuc, SanPham, DonHang, ThanhToan } from './models/index.js';

const { EJSON } = mongoose.mongo.BSON;
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'seed-data');
const force = process.argv.includes('--force');
const demo = process.argv.includes('--demo');
const names = ['NguoiDung', 'GianHang', 'DanhMuc', 'SanPham', 'GioHang', 'DonHang', 'ThanhToan', 'DanhGia', 'TinNhanAI'];

await mongoose.connect(mongoUri());
const db = mongoose.connection.db;

for (const name of names) {
  const file = path.join(dir, `thuongmaidientu.${name}.json`);
  if (!fs.existsSync(file)) { console.log(`- ${name}: không có file, bỏ qua`); continue; }
  const col = db.collection(name);
  if ((await col.countDocuments()) > 0) {
    if (!force) { console.log(`- ${name}: đã có dữ liệu, bỏ qua (dùng --force để ghi đè)`); continue; }
    await col.deleteMany({});
  }
  const docs = EJSON.parse(fs.readFileSync(file, 'utf8'));
  if (name === 'NguoiDung') {
    const hash = await bcrypt.hash(process.env.SEED_PASSWORD || '123456', 10);
    docs.forEach((d) => { d.matKhau = hash; });
  }
  if (docs.length) await col.insertMany(docs);
  console.log(`✓ ${name}: đã nhập ${docs.length} bản ghi`);
}
if (demo) await seedDemoNguoiBan();

console.log(`Mật khẩu các tài khoản mẫu: ${process.env.SEED_PASSWORD || '123456'}`);
console.log('Người bán: nguoiban1 | nguoiban2 | nguoiban3' + (demo ? ' | tranminhkhoa' : '') + '  — khách hàng: nguoimua1@example.com …');
await mongoose.disconnect();

// ---------- Dữ liệu demo cho người bán (chỉ khi có --demo) ----------
async function seedDemoNguoiBan() {
  if (await NguoiDung.exists({ username: 'tranminhkhoa' })) {
    console.log('- demo người bán: đã có (tranminhkhoa), bỏ qua');
    return;
  }
  const hash = await bcrypt.hash(process.env.SEED_PASSWORD || '123456', 10);
  const id = () => new mongoose.Types.ObjectId();
  const khoa = { _id: id(), username: 'tranminhkhoa', email: 'khoa.tran@email.com', matKhau: hash, hoTen: 'Trần Minh Khoa', soDienThoai: '0901234000', diaChi: '120 Lê Lợi, Quận 1, TP. Hồ Chí Minh', role: 'nguoiban', trangThai: true };
  const kh = (n, sdt, dc) => {
    const username = n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/\s/g, '');
    return { _id: id(), username, email: username + '@email.com', matKhau: hash, hoTen: n, soDienThoai: sdt, diaChi: dc, role: 'nguoimua', trangThai: true };
  };
  const buyers = [
    kh('Nguyễn Văn An', '0901234567', '25 Nguyễn Huệ, Q.1, TP. Hồ Chí Minh'),
    kh('Lê Thị Hoa', '0902345678', '10 Pasteur, Q.3, TP. Hồ Chí Minh'),
    kh('Phạm Quốc Bảo', '0903456789', '88 Cách Mạng Tháng 8, Q.10, TP. Hồ Chí Minh'),
    kh('Võ Thanh Tâm', '0904567890', '5 Lý Thường Kiệt, Q.5, TP. Hồ Chí Minh'),
    kh('Đặng Mai Linh', '0905678901', '14 Trần Hưng Đạo, Q.1, TP. Hồ Chí Minh'),
  ];
  await NguoiDung.insertMany([khoa, ...buyers]);
  const gh = await GianHang.create({ tenGianHang: 'Khoa Store', moTaGianHang: 'Phụ kiện, sách, thời trang và đồ dùng thể thao', nguoiBanId: khoa._id, trangThai: 'hoatdong' });

  const dmId = async (ten, mota) => (await DanhMuc.findOne({ tenDanhMuc: ten }) || await DanhMuc.create({ tenDanhMuc: ten, moTaDanhMuc: mota }))._id;
  const [dPK, dTT, dSach, dGD, dTT2] = [await dmId('Điện thoại & Phụ kiện', 'Điện thoại và phụ kiện'), await dmId('Thời trang'), await dmId('Sách', 'Sách và tài liệu'), await dmId('Gia dụng'), await dmId('Thể thao', 'Đồ dùng thể thao')];
  const sp = await SanPham.insertMany([
    ['Tai nghe Bluetooth X200', 'Tai nghe Bluetooth 5.3, pin 30 giờ, chống ồn cơ bản, kèm hộp sạc.', 490000, 48, dPK],
    ['Áo thun cotton nam', 'Cotton 100%, thoáng mát, nhiều size.', 189000, 120, dTT],
    ['Sách Lập trình web cơ bản', 'Giáo trình HTML, CSS, JavaScript cho người mới.', 125000, 35, dSach],
    ['Bình giữ nhiệt 500ml', 'Inox 304, giữ nóng 12 giờ, giữ lạnh 24 giờ.', 159000, 64, dGD],
    ['Giày chạy bộ nhẹ', 'Đế êm, nhẹ, thoáng khí.', 690000, 22, dTT2],
  ].map((a) => ({ tenSanPham: a[0], moTaSanPham: a[1], giaSanPham: a[2], soLuongTon: a[3], danhMucId: a[4], gianHangId: gh._id, trangThaiSanPham: 'dangban' })));

  const item = (i, q) => ({ sanPhamId: sp[i]._id, tenSanPham: sp[i].tenSanPham, giaSanPham: sp[i].giaSanPham, soLuong: q });
  const mkDon = (ma, b, ngay, its, tt) => ({ maDon: ma, nguoiMuaId: b._id, gianHangId: gh._id, danhSachSanPham: its, tongTienDH: its.reduce((s, x) => s + x.giaSanPham * x.soLuong, 0), diaChiNhanHang: b.diaChi, sdtNhanHang: b.soDienThoai, tenNguoiNhan: b.hoTen, trangThaiDH: tt, ngayDat: ngay });
  const dons = [
    mkDon('DH0126', buyers[0], new Date(2026, 9, 9, 9), [item(0, 1), item(1, 2), item(3, 1)], 'choxacnhan'),
    mkDon('DH0125', buyers[1], new Date(2026, 9, 8, 9), [item(1, 1), item(2, 1)], 'choxacnhan'),
    mkDon('DH0124', buyers[2], new Date(2026, 9, 7, 9), [item(4, 1)], 'daxacnhan'),
    mkDon('DH0123', buyers[3], new Date(2026, 9, 6, 9), [item(2, 1)], 'hoanthanh'),
    mkDon('DH0122', buyers[4], new Date(2026, 9, 5, 9), [item(1, 1)], 'hoanthanh'),
  ];
  const now = new Date(); // 6 đơn hoàn thành rải 6 tháng gần nhất để biểu đồ doanh thu có dữ liệu
  [42, 58, 51, 74, 66, 88].forEach((tr, k) => dons.push(mkDon('DH' + (100 + k), buyers[k % 5], new Date(now.getFullYear(), now.getMonth() - (5 - k), 1, 8), [item(0, Math.round((tr * 1e6) / 490000))], 'hoanthanh')));
  const ds = await DonHang.insertMany(dons);
  await ThanhToan.insertMany(ds.map((d) => ({ donHangId: d._id, phuongThucTT: 'cod', soTienTT: d.tongTienDH, trangThaiTT: d.trangThaiDH === 'hoanthanh' ? 'dathanhtoan' : 'chuathanhtoan', ngayThanhToan: d.trangThaiDH === 'hoanthanh' ? d.ngayDat : undefined })));
  console.log('✓ demo người bán: tranminhkhoa (Khoa Store), 5 sản phẩm, ' + ds.length + ' đơn hàng');
}
