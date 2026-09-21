# QUY TẮC LÀM VIỆC VÀ KHỞI TẠO DỰ ÁN (AGENT RULES & INIT)

Tài liệu này định nghĩa quy tắc vận hành và tiêu chuẩn lập trình dành cho AI Agent khi thực hiện công việc trong thư mục này hoặc khi sao chép sang thư mục khác.

---

## 1. QUY TẮC BẮT BUỘC (CORE PRINCIPLES)

1. **Chủ động và tự chủ (Autonomous Execution)**:
   - Tự động thực hiện toàn bộ các bước (phân tích, lập kế hoạch, code, cấu hình, kiểm thử, sửa lỗi) để hoàn thành trọn vẹn yêu cầu được giao mà không cần người dùng phải can thiệp từng bước nhỏ.

2. **An toàn hệ thống tuyệt đối (Safety & Confirmation)**:
   - **BẮT BUỘC HỎI Ý KIẾN VÀ ĐỢI XÁC NHẬN** từ người dùng trước khi:
     - Xóa bất kỳ file hoặc thư mục nào.
     - Chạy các lệnh phá hủy, ghi đè quy mô lớn hoặc tác động nguy hiểm đến hệ thống/dữ liệu.

3. **Tổ chức file gọn gàng, dễ đọc (Clean & Modular Structure)**:
   - Mọi file và thư mục sinh ra phải được sắp xếp theo cấu trúc rõ ràng, logic, có phân tách tầng trách nhiệm (ví dụ: `src/`, `data/`, `docs/`, `scripts/`...).
   - Đặt tên file/thư mục/biến/hàm bằng tiếng Anh hoặc tiếng Việt chuẩn mực, mang tính mô tả rõ ràng.
   - Code có comment giải thích các luồng xử lý chính để người dùng có thể đọc hiểu và bảo trì dễ dàng sau này.

---

## 2. HƯỚNG DẪN KHI TÁI SỬ DỤNG Ở THƯ MỤC KHÁC (INIT IN OTHER DIRECTORIES)

Khi chuyển sang một thư mục dự án mới, chỉ cần copy file `AGENTS.md` (hoặc `INIT.md`) này vào thư mục mới và yêu cầu AI Agent:
> *"Đọc file AGENTS.md và tuân thủ các quy tắc trong đó để bắt đầu làm việc."*

AI Agent sẽ tự động:
- Đọc và nạp các quy tắc an toàn và phong cách làm việc.
- Quét cấu trúc tài liệu/mã nguồn hiện có trong thư mục mới.
- Khởi tạo môi trường, cài đặt dependencies cần thiết (nếu có).
- Bắt đầu triển khai theo đúng yêu cầu mà không cần người dùng phải thiết lập lại từ đầu.
