import { SanPham, DonHang } from '../models/index.js';
import { DA_XU_LY, dtoDon } from './util.js';

// NB-04: số sản phẩm, số đơn, doanh thu, số đơn đã xử lý, doanh thu 6 tháng, đơn gần đây
export const thongKe = async (req, res) => {
  const gh = req.gianHang._id;
  const [soSanPham, dons] = await Promise.all([
    SanPham.countDocuments({ gianHangId: gh }),
    DonHang.find({ gianHangId: gh }).sort({ ngayDat: -1 }).populate('nguoiMuaId', 'hoTen')
  ]);
  const now = new Date(), thang = [];
  for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); thang.push({ nam: d.getFullYear(), thang: d.getMonth() + 1, tong: 0 }); }
  let doanhThu = 0;
  for (const o of dons) {
    if (o.trangThaiDH !== 'hoanthanh') continue;      // doanh thu = đơn đã hoàn thành
    doanhThu += o.tongTienDH;
    const d = new Date(o.ngayDat), m = thang.find(x => x.nam === d.getFullYear() && x.thang === d.getMonth() + 1);
    if (m) m.tong += o.tongTienDH;
  }
  res.json({
    soSanPham, soDonHang: dons.length, doanhThu,
    soDonDaXuLy: dons.filter(o => DA_XU_LY.includes(o.trangThaiDH)).length,
    doanhThu6Thang: thang, donGanDay: dons.slice(0, 4).map(dtoDon)
  });
};
