# Sàn Online – Khách hàng + Người bán + Quản trị (Nhóm 02)

Ba tác nhân **khách hàng**, **người bán** và **quản trị viên** được gộp vào một dự án: **một backend dùng chung**, **ba giao diện chạy ở ba địa chỉ khác nhau**.

```
san-online/
├─ server/              Backend Node.js + Express + MongoDB — DÙNG CHUNG       http://localhost:5000
│  ├─ src/routes/         API khách hàng      →  /api/...
│  ├─ src/nguoiban/       API người bán       →  /api/nguoi-ban/...
│  ├─ src/admin/          API quản trị viên   →  /api/admin/...
│  ├─ src/models/         9 collection dùng chung (một bộ model duy nhất)
│  ├─ seed-data/          dữ liệu mẫu (xuất từ MongoDB Compass)
│  └─ uploads/            ảnh sản phẩm do người bán tải lên (phục vụ tại /uploads)
├─ client-khach-hang/   Giao diện KHÁCH HÀNG (React + Vite)                    http://localhost:5173
├─ client-nguoi-ban/    Giao diện NGƯỜI BÁN (HTML/CSS/JS thuần + Vite)         http://localhost:5174
└─ client-admin/        Giao diện QUẢN TRỊ (React + Vite)                      http://localhost:5175
```

| Tác nhân | Địa chỉ giao diện | API | Đăng nhập bằng |
|---|---|---|---|
| Khách hàng | http://localhost:5173 | `/api/...` | email (hoặc username) – role `nguoimua` |
| Người bán | http://localhost:5174 | `/api/nguoi-ban/...` | username – role `nguoiban` |
| Quản trị viên | http://localhost:5175 | `/api/admin/...` | username hoặc email – role `admin` |

Mỗi giao diện chạy ở một origin riêng nên **phiên đăng nhập (localStorage) tách biệt hoàn toàn**: đăng nhập ở bên này không ảnh hưởng bên kia. Trang đăng nhập của mỗi bên có liên kết sang bên kia.

## Chạy dự án

Yêu cầu: Node.js ≥ 18.17 và MongoDB đang chạy (local hoặc Atlas).

```bash
npm run install:all                 # cài thư viện cho cả 5 nơi (gốc, server, 3 giao diện)
cp server/.env.example server/.env  # rồi sửa MONGO_URI, JWT_SECRET
npm run seed:demo                   # nạp dữ liệu mẫu + dữ liệu demo người bán (xem bên dưới)
npm run dev                         # chạy đồng thời cả 4: API :5000, khách hàng :5173, người bán :5174, quản trị :5175
```

Cũng có thể chạy riêng từng phần: `npm run dev:server`, `npm run dev:khachhang`, `npm run dev:nguoiban`, `npm run dev:admin`.

Dùng MongoDB có sẵn trên máy thì chỉ cần đặt `MONGO_URI` (hoặc `MONGODB_URI`, tên biến cũ của phần quản trị) trong `server/.env` và **bỏ qua bước seed**. DB cần có ít nhất một tài khoản `role: "admin"` để đăng nhập trang quản trị.

### Dữ liệu mẫu
- `npm run seed` – chỉ nhập vào collection **đang trống** (an toàn với DB đã có dữ liệu). `npm run seed -- --force` sẽ XÓA rồi nhập lại.
- `npm run seed:demo` – như trên, thêm người bán demo `tranminhkhoa` (Khoa Store, 5 sản phẩm, các đơn DH0122 → DH0126 và doanh thu 6 tháng) khớp màn hình NB-01 → NB-09. Chạy lặp lại không tạo trùng.
- Mật khẩu mọi tài khoản mẫu: `123456` (đổi bằng `SEED_PASSWORD`).
  - Khách hàng: `nguoimua1@example.com` … `nguoimua4@example.com`; với demo còn có `nguyenvanan@email.com`, `lethihoa@email.com`…
  - Người bán: `nguoiban1`, `nguoiban2`, `nguoiban3`, `tranminhkhoa` (demo).
  - Quản trị viên: `admin`.

## Quy tắc nghiệp vụ khi hai bên dùng chung dữ liệu

- **Kho (`soLuongTon`) chỉ được giữ MỘT lần cho mỗi đơn.** Khách đặt hàng → trừ kho ngay (nguyên tử) và đánh dấu `khoDaTru = true`. Người bán xác nhận đơn **không trừ lại**. Hủy đơn đang giữ kho (kể cả khi còn "chờ xử lý") → **hoàn kho**. Đơn cũ/dữ liệu mẫu không có cờ này vẫn theo quy tắc cũ: trừ khi người bán xác nhận, hoàn khi hủy đơn đã xác nhận.
- **Mã đơn thống nhất**: hai bên cùng dùng `maDon` đã lưu (đơn mẫu như `DH0126`), nếu chưa có thì `DH` + 6 ký tự cuối của `_id` (khách đặt hàng mới được lưu sẵn mã này).
- **Thanh toán**: khi người bán chuyển đơn sang *Hoàn thành*, mọi khoản thanh toán còn "chưa thanh toán" của đơn đó (COD hoặc chuyển khoản) chuyển thành "đã thanh toán". Khách thấy ngay ở lịch sử đơn.
- **Hiển thị sản phẩm**: sản phẩm *ngừng bán* hoặc thuộc gian hàng không hoạt động bị ẩn khỏi khách hàng; xóa sản phẩm thì giỏ hàng của khách báo "không còn tồn tại".
- **Tài khoản**: `NguoiDung` là một collection duy nhất, `username` và `email` không trùng giữa hai vai trò — một email không thể vừa là khách vừa là người bán. Token của vai trò này không dùng được ở API của vai trò kia (403). Token đặt lại mật khẩu không dùng được như token đăng nhập.
- **Quản trị khóa/xóa tài khoản** (có tác dụng ngay với hai bên còn lại):
  - Xóa **khách hàng** đã có đơn hoặc đánh giá → chỉ *khóa* (không đăng nhập được, token cũ bị chặn); chưa có thì xóa hẳn cùng giỏ hàng và lịch sử chat.
  - Xóa **người bán** đã có sản phẩm/đơn → *khóa* tài khoản và chuyển gian hàng sang `ngunghoatdong`, mọi sản phẩm của gian hàng biến mất khỏi phía khách; chưa có thì xóa hẳn.
  - **Danh mục** do admin thêm/sửa hiện ngay ở bộ lọc của khách và ô chọn danh mục của người bán; danh mục còn sản phẩm không xóa được.
- **Ảnh sản phẩm**: người bán tải lên tối đa 10 ảnh (JPG/PNG ≤ 2MB/ảnh). Mặc định ảnh lưu ở `server/uploads`. Nếu cấu hình đủ `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` trong `server/.env`, ảnh được lưu lên Cloudinary và database lưu `secure_url` HTTPS. Không đưa API secret vào giao diện hoặc commit lên Git.

## API người bán (tiền tố `/api/nguoi-ban`)

| Mã | Màn hình | Trang | API |
|---|---|---|---|
| NB-01 | Đăng nhập | login.html | POST /auth/dang-nhap |
| NB-02 | Đăng ký | register.html | POST /auth/dang-ky |
| NB-03 | Quên mật khẩu | forgot.html | POST /auth/quen-mat-khau/{gui-ma, xac-nhan-ma, dat-lai} |
| NB-04 | Thống kê | dashboard.html | GET /thong-ke |
| NB-05 | Quản lý & xóa sản phẩm | san-pham.html | GET /san-pham?q=, DELETE /san-pham/:id |
| NB-06 | Thêm / sửa sản phẩm | san-pham-form.html | POST, PUT /san-pham, GET /danh-muc |
| NB-07 | Xử lý đơn hàng | don-hang.html | GET /don-hang, PATCH /don-hang/:id/trang-thai |
| NB-08 | Hồ sơ & đăng xuất | ho-so.html | GET, PUT /ho-so |
| NB-09 | Chatbox AI | chatbox.html | POST /chatbot, GET /chatbot/lich-su |

## API quản trị viên (tiền tố `/api/admin`)

| Màn hình | Trang | API |
|---|---|---|
| Đăng nhập / đăng xuất | /login | POST /auth/login, /auth/logout, GET /auth/me |
| Quản lý khách hàng | /khach-hang | GET /khach-hang?q=, PUT, DELETE /khach-hang/:id |
| Quản lý danh mục | /danh-muc | GET, POST /danh-muc, PUT, DELETE /danh-muc/:id |
| Quản lý người bán | /nguoi-ban | GET /nguoi-ban?q=, PUT, DELETE /nguoi-ban/:id |
| Hồ sơ | /ho-so | GET /ho-so |

## API khách hàng (tiền tố `/api`)

| Use case | Trang | API |
|---|---|---|
| Đăng ký / Đăng nhập | /dang-ky, /dang-nhap | POST /auth/register, /auth/login |
| Quên mật khẩu | /quen-mat-khau | POST /auth/forgot-password, /auth/reset-password |
| Tìm kiếm / chi tiết sản phẩm | /, /san-pham/:id | GET /products, /products/:id, /categories |
| Giỏ hàng | /gio-hang | GET /cart, POST /cart/items, PATCH/DELETE /cart/items/:id |
| Đặt hàng (mỗi gian hàng một đơn) | /dat-hang | POST /orders |
| Thanh toán (COD / chuyển khoản) | /thanh-toan | POST /payments/confirm |
| Thanh toán VNPay | /thanh-toan, /thanh-toan/ket-qua | POST /payments/vnpay/create, GET /payments/vnpay/return, GET /payments/vnpay/ipn |
| Lịch sử đơn + Đánh giá | /don-hang | GET /orders, /orders/:id, POST /reviews |
| Hồ sơ | /ho-so | GET/PUT /profile |
| Chatbox AI | /chat | GET/POST /chat |

## Thanh toán VNPay (Sandbox)

1. Đăng ký merchant test tại https://sandbox.vnpayment.vn/devreg/ → nhận `TmnCode` và `HashSecret` qua email.
2. Điền `VNP_TMN_CODE`, `VNP_HASH_SECRET` vào `server/.env` (các biến VNP_* khác đã có sẵn trong `.env.example`), khởi động lại server.
3. Mua hàng → bước Thanh toán → chọn **VNPay** → chuyển sang trang VNPay. Thẻ test (ngân hàng NCB):
   số thẻ `9704198526191432198`, tên `NGUYEN VAN A`, ngày phát hành `07/15`, OTP `123456`.
4. Luồng: `POST /payments/vnpay/create` (gộp các đơn chưa trả của giỏ thành một giao dịch, trả `paymentUrl`) → VNPay → quay về
   `/thanh-toan/ket-qua` → trang gọi `GET /payments/vnpay/return` để máy chủ **kiểm tra chữ ký HMAC-SHA512, đối chiếu số tiền** rồi mới ghi `đã thanh toán`.
5. IPN (VNPay gọi máy chủ, đáng tin hơn Return URL) cần địa chỉ công khai: chạy local thì dùng ngrok rồi khai báo
   `https://<ngrok>/api/payments/vnpay/ipn` trong cổng merchant. Không có IPN vẫn chạy được vì Return URL dùng chung hàm xử lý (idempotent).
- Đơn VNPay thanh toán thất bại/bỏ dở vẫn ở trạng thái `chưa thanh toán`; khách bấm **Thanh toán** ở Lịch sử đơn để thử lại.
  Người bán chuyển đơn VNPay sang *Hoàn thành* **không** tự đổi thành đã thanh toán (khác COD/chuyển khoản).

## Triển khai ở địa chỉ khác (không phải localhost)

1. `server/.env`: `CLIENT_ORIGINS=https://khachhang.example.com,https://nguoiban.example.com,https://quantri.example.com`
2. Khách hàng: đặt `VITE_API_URL=https://api.example.com/api` và `VITE_SELLER_URL=https://nguoiban.example.com` khi `npm run build`.
3. Người bán: trước khi nạp `js/app.js` trong các trang HTML, khai báo `window.API_URL = 'https://api.example.com/api/nguoi-ban'` và `window.KHACH_HANG_URL = 'https://khachhang.example.com'`.
4. Quản trị: đặt `VITE_API_URL=https://api.example.com/api` khi `npm run build`.
   (Hoặc đặt reverse proxy chuyển `/api` và `/uploads` của mỗi tên miền sang backend, khi đó không cần đổi gì.)

## Ghi chú còn lại từ các phía

- Quên mật khẩu chưa gửi email thật: khách hàng nhận `resetToken` trực tiếp, người bán nhận mã 6 số (hiện trên giao diện/console khi `NODE_ENV` khác `production`). Khi lên production cần gắn dịch vụ gửi email.
- Cổng thanh toán: đã tích hợp **VNPay Sandbox** (xem mục bên dưới); chatbox AI dùng bộ tư vấn theo luật, muốn dùng mô hình ngôn ngữ thì điền `AI_BASE_URL` + `AI_MODEL` trong `.env`.
- Trang chi tiết sản phẩm tự tách bảng thông số từ mô tả theo dạng `Tên thông số: giá trị` (từng dòng).
- Admin hiện chỉ *khóa* chứ chưa có chức năng *mở khóa* tài khoản; muốn mở lại phải đặt `trangThai: true` (và gian hàng `trangThai: "hoatdong"` với người bán) trực tiếp trong MongoDB.
- Bộ kiểm thử cũ của phần admin (`scripts/testSuite.js`, nhắm vào bản server dùng trang EJS ở cổng 3000) và script nhập dữ liệu `importData.js` (xóa sạch DB) không được đưa vào dự án gộp.
