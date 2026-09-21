import sys
import os
import glob
import re
import json

# Ensure stdout uses utf-8
sys.stdout.reconfigure(encoding='utf-8')

try:
    import pymupdf
except ImportError:
    import fitz as pymupdf

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS_DIR = os.path.join(BASE_DIR, "Tài liệu")
DATA_DIR = os.path.join(BASE_DIR, "data")
OUTPUT_FILE = os.path.join(DATA_DIR, "questions.json")

os.makedirs(DATA_DIR, exist_ok=True)

TOPIC_NAMES = {
    "P1_ThuatNgu_NguyenTac_BoSung.pdf": "Phần 1: Thuật ngữ & Nguyên tắc Bảo hiểm",
    "P2_NghiepVu_BH.pdf": "Phần 2: Nghiệp vụ Bảo hiểm",
    "P3_PhapLuat_KDBH.pdf": "Phần 3: Pháp luật Kinh doanh Bảo hiểm",
    "P4_KenhPhanPhoi.pdf": "Phần 4: Kênh phân phối Bảo hiểm",
    "P5_CauHoiBoSung.pdf": "Phần 5A: Câu hỏi Bổ sung",
    "P5_TinhToan.pdf": "Phần 5B: Câu hỏi Tính toán"
}

def clean_text(text):
    if not text:
        return ""
    # Remove null characters and non-printable control characters (except newline)
    text = text.replace('\x00', '')
    # Remove checkmark / tick symbols
    text = re.sub(r'[✔✓☑]', '', text)
    # Normalize multiple whitespaces per line
    lines = [re.sub(r'[ \t]+', ' ', line).strip() for line in text.split('\n')]
    # Filter out empty lines while preserving paragraph flow
    text = '\n'.join([l for l in lines if l])
    return text.strip()

def parse_question_block(q_block, filename, page_num, q_num):
    topic = TOPIC_NAMES.get(filename, filename)
    
    # 1. Correct answer key
    ans_match = re.search(r'Đáp án đúng:\s*([A-Za-z0-9]+)', q_block)
    correct_key = ans_match.group(1).upper() if ans_match else ""

    # Find section offsets for:
    # - Đáp án đúng
    # - Căn cứ pháp lý
    # - Giải thích (hoặc Giải thích tính toán)
    # - Mẹo ghi nhớ
    patterns = {
        'ans': r'[✔✓☑\s]*Đáp án đúng:',
        'cc': r'[✔✓☑\s]*Căn cứ pháp lý:',
        'gt': r'[✔✓☑\s]*Giải thích(?:\s+tính\s+toán)?:',
        'meo': r'[✔✓☑\s]*Mẹo ghi nhớ:'
    }
    
    positions = {}
    for key, pat in patterns.items():
        m = re.search(pat, q_block)
        if m:
            positions[key] = (m.start(), m.end())

    # Extract can_cu cleanly
    can_cu = ""
    if 'cc' in positions:
        start = positions['cc'][1]
        next_starts = [positions[k][0] for k in ['gt', 'meo'] if k in positions and positions[k][0] > start]
        end = min(next_starts) if next_starts else len(q_block)
        can_cu = clean_text(q_block[start:end])

    # Extract giai_thich cleanly
    giai_thich = ""
    if 'gt' in positions:
        start = positions['gt'][1]
        next_starts = [positions[k][0] for k in ['meo'] if k in positions and positions[k][0] > start]
        end = min(next_starts) if next_starts else len(q_block)
        giai_thich = clean_text(q_block[start:end])

    # Extract meo_ghi_nho cleanly
    meo_ghi_nho = ""
    if 'meo' in positions:
        start = positions['meo'][1]
        meo_ghi_nho = clean_text(q_block[start:])

    # Extract question text and options
    opt_matches = list(re.finditer(r'(?:^|\n)\s*([A-E])[\.\)]\s+', q_block))
    
    q_text = ""
    options = []
    if opt_matches:
        raw_q_text = q_block[:opt_matches[0].start()].strip()
        raw_q_text = re.sub(r'^Câu\s+\d+[\.:]\s*', '', raw_q_text).strip()
        q_text = clean_text(raw_q_text)
        
        # Options end before the earliest of ans, cc, gt, meo
        section_starts = [positions[k][0] for k in positions]
        first_section_start = min(section_starts) if section_starts else len(q_block)

        for opt_idx in range(len(opt_matches)):
            opt_letter = opt_matches[opt_idx].group(1).upper()
            opt_start = opt_matches[opt_idx].end()
            if opt_idx + 1 < len(opt_matches):
                opt_end = opt_matches[opt_idx + 1].start()
            else:
                opt_end = first_section_start
                
            raw_opt_content = q_block[opt_start:opt_end].strip()
            # Clean up text and completely remove any tick mark
            clean_opt = clean_text(raw_opt_content)
            # Remove any trailing orphan symbols
            clean_opt = re.sub(r'[\s✔✓☑\-_:]+$', '', clean_opt).strip()
            
            options.append({
                "key": opt_letter,
                "text": clean_opt
            })

    return {
        "id": f"{os.path.splitext(filename)[0]}_p{page_num+1}_q{q_num}",
        "topic": topic,
        "file": filename,
        "page": page_num + 1,
        "q_num": int(q_num) if q_num.isdigit() else q_num,
        "question": q_text,
        "options": options,
        "correct_answer": correct_key,
        "can_cu": can_cu,
        "giai_thich": giai_thich,
        "meo_ghi_nho": meo_ghi_nho
    }

def parse_pdf(pdf_path):
    filename = os.path.basename(pdf_path)
    doc = pymupdf.open(pdf_path)
    questions = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()
        
        # Match starts of questions: "Câu \d+[\.:]"
        matches = list(re.finditer(r'(Câu\s+(\d+)[\.:]\s*)', text))
        if not matches:
            continue
            
        for i in range(len(matches)):
            start_pos = matches[i].start()
            end_pos = matches[i+1].start() if i + 1 < len(matches) else len(text)
            q_block = text[start_pos:end_pos].strip()
            q_num = matches[i].group(2)
            
            q_obj = parse_question_block(q_block, filename, page_num, q_num)
            
            # Fallback for correct key if not found in text
            if not q_obj["correct_answer"]:
                blocks = page.get_text("dict")["blocks"]
                for b in blocks:
                    if "lines" not in b: continue
                    for l in b["lines"]:
                        for s in l["spans"]:
                            c = s["color"]
                            r = (c >> 16) & 255
                            g = (c >> 8) & 255
                            b_val = c & 255
                            if r > 150 and g < 80 and b_val < 80:
                                t = s["text"].strip()
                                m = re.match(r'^([A-E])[\.\)]', t)
                                if m:
                                    q_obj["correct_answer"] = m.group(1).upper()
                                    break
                                    
            questions.append(q_obj)
            
    return questions

def main():
    pdf_files = sorted(glob.glob(os.path.join(DOCS_DIR, "*.pdf")))
    print(f"Bắt đầu trích xuất sạch {len(pdf_files)} file PDF từ '{DOCS_DIR}'...")
    
    all_questions = []
    stats = {}
    
    for pdf in pdf_files:
        filename = os.path.basename(pdf)
        qs = parse_pdf(pdf)
        all_questions.extend(qs)
        stats[filename] = len(qs)
        print(f" - {filename}: {len(qs)} câu hỏi")
        
    print(f"\nTổng cộng trích xuất: {len(all_questions)} câu hỏi.")
    
    # Strict validation
    tick_count = 0
    for q in all_questions:
        for opt in q["options"]:
            if any(sym in opt["text"] for sym in ['✔', '✓', '☑']):
                tick_count += 1
                
    if tick_count > 0:
        print(f"CẢNH BÁO: Vẫn còn {tick_count} options chứa dấu tick!")
    else:
        print("Xác nhận: 100% options đã sạch hoàn toàn, KHÔNG còn bất kỳ dấu tick nào.")
        
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump({
            "total": len(all_questions),
            "topics": stats,
            "questions": all_questions
        }, f, ensure_ascii=False, indent=2)
        
    print(f"Đã cập nhật dữ liệu sạch vào: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
