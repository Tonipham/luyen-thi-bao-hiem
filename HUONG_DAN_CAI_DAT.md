# HƯỚNG DẪN CÀI ĐẶT & CHẠY ỨNG DỤNG TRÊN MÁY TÍNH MỚI

Tài liệu này hướng dẫn chi tiết từng bước để thiết lập và chạy **Hệ thống thi trắc nghiệm ôn thi chứng chỉ bảo hiểm** trên bất kỳ máy tính mới nào (Windows, macOS, Linux).

---

## 📋 1. YÊU CẦU HỆ THỐNG

Ứng dụng được thiết kế tối giản, **100% chạy offline/local**, không yêu cầu cấu hình server hay cơ sở dữ liệu phức tạp.

| Thành phần | Yêu cầu | Ghi chú |
| :--- | :--- | :--- |
| **Hệ điều hành** | Windows 10/11, macOS, hoặc Linux | Khuyến nghị Windows |
| **Môi trường chạy** | Python 3.8 trở lên | Bản chuẩn từ `python.org` |
| **Trình duyệt Web** | Chrome, Edge, Cốc Cốc, Firefox, Brave... | Bất kỳ trình duyệt hiện đại nào |
| **Cơ sở dữ liệu / Node.js** | ❌ **Không cần** | Dữ liệu dạng file JSON tự hành |

---

## 📥 2. BƯỚC 1: CÀI ĐẶT PYTHON TRÊN MÁY MỚI

Nếu máy tính mới chưa có Python, thực hiện theo các bước sau:

1. Truy cập trang chủ chính thức: [https://www.python.org/downloads/](https://www.python.org/downloads/)
2. Tải về phiên bản Python mới nhất (ví dụ: Python 3.10, 3.11, hoặc 3.12).
3. Mở file cài đặt vừa tải về (`python-3.x.x-amd64.exe`).
4. ⚠️ **BƯỚC CỰC KỲ QUAN TRỌNG**:
   - Ở màn hình cài đặt đầu tiên, bạn **BẮT BUỘC TÍCH CHỌN** vào ô:
     > ☑ **Add python.exe to PATH** *(hoặc Add Python to environment variables)*
   - Sau đó nhấn **Install Now** và đợi quá trình cài đặt hoàn tất.

*(Nếu quên tích ô này, máy tính sẽ không nhận diện được lệnh `python` khi chạy ứng dụng).*

---

## 📂 3. BƯỚC 2: SAO CHÉP DỰ ÁN SANG MÁY MỚI

1. Sao chép toàn bộ thư mục `App as Google Forms` sang máy tính mới (qua USB, Google Drive, OneDrive, Zalo, hoặc file `.zip`).
2. 💡 **Lưu ý tối ưu dung lượng**:
   - **NÊN BỎ QUA** thư mục `.venv` khi copy hoặc nén zip (nếu có).
   - Thư mục `.venv` chứa môi trường ảo của máy cũ với các đường dẫn tuyệt đối riêng biệt và dung lượng lớn, không cần thiết để chạy ứng dụng trên máy mới.
   - Ngân hàng đề thi 446 câu đã nằm trọn vẹn trong file `data/questions.json`.

---

## 🚀 4. BƯỚC 3: KHỞI CHẠY ỨNG DỤNG

### Cách 1: Trên máy tính Windows (Khuyên dùng - 1 Click)

1. Mở thư mục dự án `App as Google Forms`.
2. **Nhấp đúp chuột (Double click)** vào file:
   👉 **`start.bat`**
3. Cửa sổ dòng lệnh sẽ hiển thị thông báo khởi động và trình duyệt web sẽ tự động mở giao diện thi tại địa chỉ:
   👉 **`http://localhost:8000`**

*(Giữ nguyên cửa sổ đen đang chạy server trong suốt quá trình làm bài thi. Khi muốn tắt, chỉ cần đóng cửa sổ hoặc nhấn `Ctrl + C`).*

---

### Cách 2: Trên máy tính macOS hoặc Linux

1. Mở ứng dụng **Terminal**.
2. Di chuyển đến thư mục dự án bằng lệnh:
   ```bash
   cd "đường/dẫn/tới/App as Google Forms"
   ```
3. Chạy lệnh:
   ```bash
   python3 server.py
   ```
4. Mở trình duyệt web bất kỳ và truy cập vào:
   👉 **`http://localhost:8000`**

---

## 🔄 5. TÙY CHỌN NÂNG CAO: TỰ TRÍCH XUẤT LẠI FILE PDF

> 💡 **Lưu ý**: Dự án đã có sẵn dữ liệu chuẩn trích xuất 446 câu tại `data/questions.json`. Bạn **KHÔNG CẦN** làm bước này trừ khi bạn thay đổi các file PDF trong thư mục `Tài liệu/`.

Nếu bạn thêm đề thi PDF mới và muốn chạy lại script bóc tách tự động:
1. Mở Terminal / Command Prompt tại thư mục dự án.
2. Cài đặt thư viện đọc PDF:
   ```bash
   pip install -r requirements.txt
   ```
3. Chạy script bóc tách:
   ```bash
   python scripts/extract_questions.py
   ```
   Dữ liệu mới sẽ được tự động cập nhật vào `data/questions.json`.

---

## 🛠️ 6. XỬ LÝ SỰ CỐ THƯỜNG GẶP (TROUBLESHOOTING)

### 1. Lỗi: `'python' is not recognized as an internal or external command`
- **Nguyên nhân**: Khi cài Python chưa tích chọn "Add python.exe to PATH".
- **Cách khắc phục**:
  1. Mở lại file cài đặt Python vừa tải về.
  2. Chọn **Modify** (hoặc gỡ ra cài lại).
  3. Đảm bảo tích chọn ô **Add python.exe to PATH**.
  4. Khởi động lại máy hoặc tắt mở lại Command Prompt rồi thử lại.

### 2. Lỗi: `[WinError 10048] Only one usage of each socket address is normally permitted`
- **Nguyên nhân**: Cổng mạng `8000` đang bị một ứng dụng khác chiếm giữ hoặc có một phiên bản server cũ đang chạy ngầm.
- **Cách khắc phục**:
  1. Mở file `server.py` bằng Notepad hoặc trình soạn thảo bất kỳ.
  2. Tìm dòng số 11: `PORT = 8000`.
  3. Đổi thành: `PORT = 8080` (hoặc cổng khác như `8888`, `9000`).
  4. Lưu file và nhấp đúp lại vào `start.bat`.

### 3. Trình duyệt không tự động bật lên khi chạy `start.bat`
- **Cách khắc phục**: Nếu cửa sổ đen đã báo `ỨNG DỤNG THI TRẮC NGHIỆM LOCAL ĐANG CHẠY TẠI: http://localhost:8000`, bạn chỉ cần tự mở trình duyệt web của mình và gõ vào thanh địa chỉ:
  > **`http://localhost:8000`**

---

Chúc bạn cài đặt thành công và đạt kết quả cao trong kỳ thi chứng chỉ bảo hiểm!
