# HƯỚNG DẪN CHẠY PROJECT (DOCKER DEPLOYMENT)

### 1. Yêu cầu hệ thống
Máy tính đã cài đặt:
- Docker & Docker Desktop
- Docker Compose

### 2. Các bước triển khai nhanh (Quick Start)
Mở terminal tại thư mục gốc của project và thực hiện các bước sau:

Bước 1: Chuẩn bị file môi trường
Lệnh: cp .env.example .env 
(env example thiếu key cho gửi email, upload cloudinary and google OAuth)
hoặc truy cập https://drive.google.com/file/d/19M5RVJNlW2KCc69DakALV1MQpkuko-bM/view?usp=drive_link 
(file .env hoàn chỉnh, cần đăng nhập bằng tài khoản TDTU)

Bước 2: Khởi động hệ thống bằng Docker Compose
Lệnh: docker-compose up -d --build

Bước 3: Kiểm tra trạng thái các container
Lệnh: docker ps
(Đảm bảo các container ở trạng thái Up)

### 3. Thông tin truy cập hệ thống
- Địa chỉ Website: http://localhost:5173
- Tài khoản đăng nhập:
    + Account1: 
        Email: chinhhien123@gmail.com
        Password: 12345
    + Account2: 
        Email: duyphan2501@gmail.com
        Password: 12345
    + Account3: 
        Email: cuongdinh123@gmail.com
        Password: 12345
- 
(chi tiết trong ./scripts/init-mongo.js)

### 4. Video Demo sản phẩm
- Link: https://drive.google.com/drive/folders/1N6eQEsIXiQkOmewt6M4FtCgY7ElVLc0e?usp=sharing

### 5. Lệnh dừng hệ thống (Khi kết thúc)
Lệnh: docker-compose down -v
