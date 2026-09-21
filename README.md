# Ứng Dụng Thi Trắc Nghiệm Ôn Thi Chứng Chỉ Bảo Hiểm (Google Forms Style)

Hệ thống web thi trắc nghiệm chạy local phục vụ ôn thi chứng chỉ bảo hiểm nhân thọ, tự động trích xuất ngân hàng câu hỏi chuẩn từ tài liệu PDF, tính giờ làm bài, chấm điểm và đưa ra dẫn chứng, căn cứ pháp lý, mẹo ghi nhớ cho các câu trả lời sai.

---

## ⏱️ THÔNG TIN PHÁT TRIỂN & ĐÓNG GÓI
- **Thời lượng triển khai hoàn thành**: ~30 phút (từ tiếp nhận tài liệu PDF, bóc tách dữ liệu đến hoàn thiện toàn bộ giao diện và kiểm thử).
- **Công nghệ sử dụng**: Python (PyMuPDF, HTTP Server) + Vanilla HTML5/CSS3/JavaScript (không phụ thuộc thư viện nặng bên ngoài).
- **Trạng thái đóng gói**: Hoàn thiện 100%, kiểm thử đạt chuẩn.

---

## 🚀 HƯỚNG DẪN KHỞI CHẠY NHANH
1. Nhấp đúp chuột vào file **`start.bat`** trên máy tính Windows.
2. Trình duyệt web sẽ tự động mở trang thi tại địa chỉ:
   👉 **http://localhost:8000**

> 📖 **Xem hướng dẫn chi tiết cài đặt trên máy tính mới tại**: [HUONG_DAN_CAI_DAT.md](file:///g:/Other%20computers/My%20Computer/Projects/Personal/App%20as%20Google%20Forms/HUONG_DAN_CAI_DAT.md)

---

## 🌟 CÁC TÍNH NĂNG CHÍNH
1. **Ngân hàng câu hỏi trọn vẹn (446 câu)**:
   - Trích xuất tự động từ 6 file PDF ôn thi trong thư mục `Tài liệu/`.
   - Đáp án đúng được nhận diện tự động qua chữ in đậm tô đỏ (`#c00000`).
   - Đã lọc sạch toàn bộ các ký tự tick mark (`✔`, `✓`, `☑`) để đảm bảo tính khách quan khi làm bài.
2. **Thiết lập đề thi linh hoạt**:
   - Nhập số lượng câu hỏi tùy chỉnh hoặc chọn nhanh (10, 20, 30, 40 câu, hoặc Tất cả 446 câu).
   - Tùy chỉnh thời gian thi (phút) kèm bộ đếm ngược trực quan.
   - Bộ lọc theo chủ đề (chọn thi tất cả hoặc chỉ chọn một số phần tài liệu cụ thể).
3. **Giao diện thi chuẩn Google Forms**:
   - Thanh trạng thái ghim cố định hiển thị thời gian và tiến độ làm bài.
   - Bảng câu hỏi (Question Matrix) trực quan: Chưa làm (trắng), Đã làm (xanh/tím), Đặt cờ (vàng). Bấm vào để cuộn nhanh đến câu tương ứng.
   - Cảnh báo số câu chưa làm trước khi nộp bài.
   - Tự động nộp bài và khóa đề thi khi đồng hồ đếm ngược về `00:00`.
4. **Chấm điểm & Dẫn chứng câu sai**:
   - Bảng điểm chi tiết (tỷ lệ %, đánh giá ĐẠT/CHƯA ĐẠT theo ngưỡng 75%).
   - Tab "Chỉ xem câu làm sai" để tập trung ôn tập lỗ hổng kiến thức.
   - Mỗi câu sai có **Hộp Dẫn Chứng & Hướng Dẫn**:
     - 📄 **Tài liệu nguồn**: Tên file PDF và số trang cụ thể (ví dụ: `P1_ThuatNgu_NguyenTac_BoSung.pdf - Trang 14`).
     - ⚖️ **Căn cứ pháp lý**: Trích dẫn điều luật, nghị định, thông tư chính xác.
     - 💡 **Giải thích chi tiết**: Hướng dẫn cặn kẽ vì sao đáp án đó đúng.
     - 🧠 **Mẹo ghi nhớ**: Tips ôn thi thực chiến.
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
│   └── questions.json         # Dữ liệu chuẩn 446 câu hỏi
├── src/
│   ├── index.html             # Giao diện chính phong cách Google Forms
│   ├── css/
│   │   ├── style.css          # Design system, typography, màu sắc
│   │   └── quiz.css           # Giao diện bài thi, palette câu hỏi, dẫn chứng
│   └── js/
│       ├── timer.js           # Bộ đếm ngược và kiểm soát hết giờ
│       ├── review.js          # Module chấm điểm và tạo thẻ dẫn chứng
│       └── app.js             # Quản lý trạng thái và luồng bài thi
└── Tài liệu/                  # 6 file tài liệu PDF gốc
```
