# Quiz Web - FrontEnd

Đây là giao diện người dùng (FrontEnd) của ứng dụng trắc nghiệm (Quiz Web). Ứng dụng cung cấp giao diện để người chơi đăng nhập, quản lý hồ sơ, tạo bài thi và làm quiz.

## Yêu cầu hệ thống
- Node.js (phiên bản 18 trở lên)
- npm (đi kèm khi cài Node.js)

## Các công nghệ sử dụng
- **ReactJS**: Thư viện chính để xây dựng giao diện UI.
- **Vite**: Công cụ build và chạy server phát triển nhanh gọn.
- **React Router DOM**: Quản lý điều hướng chuyển trang (Login, Profile, Quiz...).
- **Axios**: Thư viện dùng để gọi API giao tiếp với BackEnd.
- **Firebase**: Dùng cho tính năng đăng nhập bằng tài khoản Google.

## Hướng dẫn cài đặt và chạy dự án

1. **Cài đặt thư viện**:
   - Mở terminal tại thư mục `FrontEnd`.
   - Chạy lệnh sau để tải các gói phụ thuộc (dependencies):
     ```bash
     npm install
     ```

2. **Khởi động ứng dụng**:
   - Sau khi cài đặt xong, chạy server bằng lệnh:
     ```bash
     npm run dev
     ```
   - Ứng dụng sẽ chạy tại địa chỉ `http://localhost:5173`.
   - *Lưu ý*: Hãy đảm bảo bạn đã khởi động cả phần BackEnd để các chức năng như đăng nhập, tải dữ liệu hoạt động bình thường. Vite trong dự án này đã được cấu hình proxy để tự động chuyển tiếp các yêu cầu API sang cổng 8080 của BackEnd.

## Cấu trúc thư mục chính
- `src/api/`: Chứa cấu hình gọi API (`client.js`) để kết nối với BackEnd.
- `src/features/`: Mã nguồn được chia theo từng chức năng lớn:
  - `auth/`: Đăng nhập, đăng ký.
  - `profile/`: Quản lý hồ sơ, đổi ảnh đại diện.
  - `quiz/`: Quản lý, chỉnh sửa và danh sách bài thi.
- `src/App.jsx`: File cấu hình giao diện tổng thể và menu chuyển trang.
