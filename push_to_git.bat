@echo off
chcp 65001 > nul
title Đẩy mã nguồn lên GitHub: Tonipham/luyen-thi-bao-hiem
echo =======================================================
echo    ĐANG ĐẨY MÃ NGUỒN LÊN GITHUB
echo    Repo: https://github.com/Tonipham/luyen-thi-bao-hiem.git
echo =======================================================
echo.

REM Kiểm tra xem git đã được cài đặt chưa
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [LỖI] Máy tính của bạn chưa cài đặt Git!
    echo Vui lòng tải và cài đặt Git tại: https://git-scm.com/
    echo.
    pause
    exit /b 1
)

REM 1. Khởi tạo repo
if not exist ".git" (
    echo [1/5] Đang khởi tạo Git repo...
    git init
) else (
    echo [1/5] Git repo đã tồn tại sẵn.
)

REM 2. Cấu hình remote origin
echo [2/5] Đang kết nối tới https://github.com/Tonipham/luyen-thi-bao-hiem.git ...
git remote remove origin >nul 2>nul
git remote add origin https://github.com/Tonipham/luyen-thi-bao-hiem.git

REM 3. Đổi tên branch sang main
echo [3/5] Đặt nhánh chính là main...
git branch -M main

REM 4. Thêm files và tạo commit
echo [4/5] Đang gom file và tạo commit...
git add .
git commit -m "feat: Mo lai bo cau hoi Bao hiem va ho tro song song ca 2 chung chi Bao hiem & MGBDS" || echo [Thong tin] Cac thay doi da duoc commit san.

REM 5. Đẩy code lên GitHub
echo [5/5] Đang đẩy mã nguồn lên GitHub...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo =======================================================
    echo    🎉 ĐÃ ĐẨY LÊN GITHUB THÀNH CÔNG!
    echo    👉 https://github.com/Tonipham/luyen-thi-bao-hiem
    echo =======================================================
) else (
    echo.
    echo -------------------------------------------------------
    echo [LƯU Ý]: Nếu Git báo lỗi 'remote contains work' (do trên GitHub bạn đã tích tạo sẵn file README),
    echo bạn hãy chạy lệnh sau để hợp nhất và đẩy lại:
    echo     git pull origin main --rebase
    echo     git push -u origin main
    echo -------------------------------------------------------
)

echo.
pause
