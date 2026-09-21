import http.server
import socketserver
import os
import sys
import webbrowser
import urllib.parse

# Ensure utf-8 encoding for stdout
sys.stdout.reconfigure(encoding='utf-8')

PORT = 8000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.join(BASE_DIR, "src")
DATA_DIR = os.path.join(BASE_DIR, "data")

class QuizHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        
        # Route root to src/index.html
        if path == "/" or path == "/index.html":
            self.path = "/src/index.html"
        elif path.startswith("/src/") or path.startswith("/data/"):
            # keep as is
            pass
        elif path.startswith("/css/") or path.startswith("/js/"):
            self.path = "/src" + path
        elif path == "/api/questions":
            self.path = "/data/questions.json"
            
        return super().do_GET()

    def end_headers(self):
        # Add CORS and UTF-8 charset
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

def run():
    # Make sure data/questions.json exists
    json_path = os.path.join(DATA_DIR, "questions.json")
    if not os.path.exists(json_path):
        print("Dữ liệu questions.json chưa tồn tại. Đang chạy extract_questions.py...")
        import subprocess
        subprocess.run([sys.executable, os.path.join(BASE_DIR, "scripts", "extract_questions.py")])

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), QuizHandler) as httpd:
        url = f"http://localhost:{PORT}"
        print("="*60)
        print(f"ỨNG DỤNG THI TRẮC NGHIỆM LOCAL ĐANG CHẠY TẠI:")
        print(f"👉 {url}")
        print("="*60)
        print("Nhấn Ctrl+C trong cửa sổ terminal này để dừng server.")
        
        # Open browser automatically if not in headless/testing mode
        if "--no-browser" not in sys.argv:
            try:
                webbrowser.open(url)
            except Exception:
                pass
                
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nĐã dừng server.")

if __name__ == "__main__":
    run()
