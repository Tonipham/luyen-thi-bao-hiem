# Ứng Dụng Thi Trắc Nghiệm Môi Giới BĐS & Bảo Hiểm (Google Forms Style)

Hệ thống web thi trắc nghiệm chạy local phục vụ ôn thi chứng chỉ Môi giới Bất động sản (MGBĐS) và Đại lý Bảo hiểm Nhân thọ, tự động trích xuất ngân hàng câu hỏi chuẩn từ tài liệu PDF, tính giờ làm bài, chấm điểm và đưa ra dẫn chứng, căn cứ pháp lý, mẹo ghi nhớ cho các câu trả lời sai.

---

## ⏱️ THÔNG TIN PHÁT TRIỂN & ĐÓNG GÓI
- **Ngân hàng câu hỏi**: **846 câu hỏi** trích xuất từ 8 file PDF chuẩn (400 câu Môi giới BĐS + 446 câu Đại lý Bảo hiểm).
- **Công nghệ sử dụng**: Python (PyMuPDF, HTTP Server) + Vanilla HTML5/CSS3/JavaScript (không phụ thuộc thư viện nặng bên ngoài).
- **Trạng thái đóng gói**: Hoàn thiện 100%, kiểm thử đạt chuẩn.

---

## 🚀 HƯỚNG DẪN KHỞI CHẠY NHANH
1. Nhấp đúp chuột vào file **`start.bat`** trên máy tính Windows.
2. Trình duyệt web sẽ tự động mở trang thi tại địa chỉ:
   👉 **http://localhost:8000**

---

## 🌟 CÁC TÍNH NĂNG CHÍNH
1. **Ngân hàng câu hỏi đa dạng (846 câu)**:
   - **🏠 Môi giới Bất động sản (400 câu)**:
     - 200 câu hỏi Phần Kiến thức Cơ sở (`200 Câu hỏi trắc nghiệm MGBĐS - Phần cơ sở.pdf`)
     - 200 câu hỏi Phần Kiến thức Chuyên môn (`200 Câu hỏi trắc nghiệm MGBĐS - Phần chuyên môn.pdf`)
   - **🛡️ Đại lý Bảo hiểm Nhân thọ (446 câu)**:
     - 6 phần tài liệu Luật KDBH, Thuật ngữ, Nghiệp vụ, Kênh phân phối, Tính toán (`P1..P5`).
   - Đã lọc sạch 100% các ký tự tick mark (`✔`, `✓`, `☑`) để đảm bảo tính khách quan khi làm bài.
2. **Bộ lọc danh mục thông minh**:
   - Nút chọn nhanh: **"✨ Tất cả (846 câu)"**, **"🏠 Chỉ BĐS (400 câu)"**, **"🛡️ Chỉ Bảo hiểm (446 câu)"**, **"❌ Bỏ chọn"**.
   - Tùy chọn linh hoạt số lượng câu hỏi và thời gian làm bài đếm ngược.
3. **Giao diện thi chuẩn Google Forms**:
   - Thanh trạng thái ghim cố định hiển thị thời gian và tiến độ làm bài.
   - Bảng câu hỏi (Question Matrix) trực quan: Chưa làm (trắng), Đã làm (xanh/tím), Đặt cờ (vàng). Bấm vào để cuộn nhanh đến câu tương ứng.
   - Cảnh báo số câu chưa làm trước khi nộp bài.
   - Tự động nộp bài và khóa đề thi khi đồng hồ đếm ngược về `00:00`.
4. **Chấm điểm & Dẫn chứng câu sai**:
   - Bảng điểm chi tiết (tỷ lệ %, đánh giá ĐẠT/CHƯA ĐẠT theo ngưỡng 75%).
   - Tab "Chỉ xem câu làm sai" để tập trung ôn tập lỗ hổng kiến thức.
   - Mỗi câu sai có **Hộp Dẫn Chứng & Hướng Dẫn**:
     - 📄 **Tài liệu nguồn**: Tên file PDF và số trang cụ thể.
     - ⚖️ **Căn cứ pháp lý / Đáp án**: Căn cứ pháp lý, giải thích chi tiết và đáp án chuẩn hóa.
5. **Luyện lại câu sai**:
   - Nút **"🔁 Luyện lại câu sai"** tạo ngay đề thi mới CHỈ gồm các câu bạn vừa làm sai để khắc sâu kiến thức.
   - Nút **"🖨️ In kết quả ôn tập"** để lưu lại dạng PDF học bài offline.

---

## 📂 CẤU TRÚC THƯ MỤC DỰ ÁN
```
App as Google Forms/
├── AGENTS.md                  # Quy tắc làm việc của Agent
├── INIT.md                    # Hướng dẫn tái sử dụng ở thư mục khác
├── HUONG_DAN_CAI_DAT.md       # Hướng dẫn chi tiết cài đặt trên máy mới
├── README.md                  # Tài liệu giới thiệu và hướng dẫn sử dụng
├── requirements.txt           # Thư viện phụ thuộc (PyMuPDF)
├── start.bat                  # File khởi chạy nhanh 1-click
├── server.py                  # Local Web Server Python
├── scripts/
│   ├── extract_questions.py   # Script trích xuất câu hỏi từ PDF -> JSON
│   └── test_app.js            # Script kiểm thử tự động toàn bộ luồng
├── data/
│   └── questions.json         # Dữ liệu chuẩn 846 câu hỏi
├── src/
│   ├── index.html             # Giao diện chính phong cách Google Forms
│   ├── css/
│   │   ├── style.css          # Design system, typography, màu sắc
│   │   └── quiz.css           # Giao diện bài thi, palette câu hỏi, dẫn chứng
│   └── js/
│       ├── timer.js           # Bộ đếm ngược và kiểm soát hết giờ
│       ├── review.js          # Module chấm điểm và tạo thẻ dẫn chứng
│       └── app.js             # Quản lý trạng thái và luồng bài thi
└── Tài liệu/                  # 8 file tài liệu PDF gốc (BĐS & Bảo hiểm)
```
