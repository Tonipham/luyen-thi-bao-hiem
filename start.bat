@echo off
chcp 65001 > nul
title Ứng Dụng Thi Trắc Nghiệm - Local Web App
echo =======================================================
echo    ĐANG KHỞI ĐỘNG ỨNG DỤNG THI TRẮC NGHIỆM LOCAL
echo =======================================================
echo.

if exist .venv\Scripts\python.exe (
    set PYTHON_CMD=.venv\Scripts\python.exe
) else (
    set PYTHON_CMD=python
)

echo Đang chạy server tại http://localhost:8000 ...
%PYTHON_CMD% server.py
pause
