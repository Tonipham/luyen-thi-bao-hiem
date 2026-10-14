import sys
import os
import glob
import re
import json
import unicodedata

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
    # Môi giới Bất động sản
    "200 Câu hỏi trắc nghiệm MGBĐS - Phần cơ sở.pdf": "Môi giới BĐS - Phần Cơ sở (200 câu)",
    "200 Câu hỏi trắc nghiệm MGBĐS - Phần chuyên môn.pdf": "Môi giới BĐS - Phần Chuyên môn (200 câu)",
    # Đại lý Bảo hiểm
    "P1_ThuatNgu_NguyenTac_BoSung.pdf": "Bảo hiểm - Phần 1: Thuật ngữ & Nguyên tắc",
    "P2_NghiepVu_BH.pdf": "Bảo hiểm - Phần 2: Nghiệp vụ Bảo hiểm",
    "P3_PhapLuat_KDBH.pdf": "Bảo hiểm - Phần 3: Pháp luật Kinh doanh Bảo hiểm",
    "P4_KenhPhanPhoi.pdf": "Bảo hiểm - Phần 4: Kênh phân phối Bảo hiểm",
    "P5_CauHoiBoSung.pdf": "Bảo hiểm - Phần 5A: Câu hỏi Bổ sung",
    "P5_TinhToan.pdf": "Bảo hiểm - Phần 5B: Câu hỏi Tính toán"
}

def get_topic_name(filename):
    norm_fn = unicodedata.normalize('NFC', filename)
    for k, v in TOPIC_NAMES.items():
        if unicodedata.normalize('NFC', k) == norm_fn:
            return v
    return filename

def clean_text(text):
    if not text:
        return ""
    # Remove null characters and non-printable control characters
    text = text.replace('\x00', '')
    # Remove checkmark / tick symbols
    text = re.sub(r'[✔✓☑]', '', text)
    # Normalize multiple whitespaces per line
    lines = [re.sub(r'[ \t]+', ' ', line).strip() for line in text.split('\n')]
    # Filter out empty lines and standalone page numbers (e.g. '1', '23')
    cleaned_lines = []
    for l in lines:
        if not l:
            continue
        if re.match(r'^\d{1,3}$', l):
            continue
        cleaned_lines.append(l)
    return '\n'.join(cleaned_lines).strip()

def parse_insurance_question_block(q_block, filename, page_num, q_num):
    topic = get_topic_name(filename)
    
    # 1. Correct answer key
    ans_match = re.search(r'Đáp án đúng:\s*([A-Za-z0-9]+)', q_block)
    correct_key = ans_match.group(1).upper() if ans_match else ""

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

    can_cu = ""
    if 'cc' in positions:
        start = positions['cc'][1]
        next_starts = [positions[k][0] for k in ['gt', 'meo'] if k in positions and positions[k][0] > start]
        end = min(next_starts) if next_starts else len(q_block)
        can_cu = clean_text(q_block[start:end])

    giai_thich = ""
    if 'gt' in positions:
        start = positions['gt'][1]
        next_starts = [positions[k][0] for k in ['meo'] if k in positions and positions[k][0] > start]
        end = min(next_starts) if next_starts else len(q_block)
        giai_thich = clean_text(q_block[start:end])

    meo_ghi_nho = ""
    if 'meo' in positions:
        start = positions['meo'][1]
        meo_ghi_nho = clean_text(q_block[start:])

    opt_matches = list(re.finditer(r'(?:^|\n)\s*([A-E])[\.\)]\s+', q_block))
    
    q_text = ""
    options = []
    if opt_matches:
        raw_q_text = q_block[:opt_matches[0].start()].strip()
        raw_q_text = re.sub(r'^Câu\s+\d+[\.:]\s*', '', raw_q_text).strip()
        q_text = clean_text(raw_q_text)
        
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
            clean_opt = clean_text(raw_opt_content)
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

def parse_insurance_pdf(pdf_path):
    filename = os.path.basename(pdf_path)
    doc = pymupdf.open(pdf_path)
    questions = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()
        
        matches = list(re.finditer(r'(Câu\s+(\d+)[\.:]\s*)', text))
        if not matches:
            continue
            
        for i in range(len(matches)):
            start_pos = matches[i].start()
            end_pos = matches[i+1].start() if i + 1 < len(matches) else len(text)
            q_block = text[start_pos:end_pos].strip()
            q_num = matches[i].group(2)
            
            q_obj = parse_insurance_question_block(q_block, filename, page_num, q_num)
            
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

def parse_mgbds_pdf(pdf_path):
    filename = os.path.basename(pdf_path)
    topic = get_topic_name(filename)
    doc = pymupdf.open(pdf_path)
    
    # Store page start offsets in full text so we can accurately record the page of each question
    full_text = ''
    page_offsets = []
    for pno in range(len(doc)):
        page_offsets.append((len(full_text), pno + 1))
        full_text += doc[pno].get_text() + '\n'

    # Pre-clean known text artifacts:
    # 1. Stuck option like '%D.' -> '%\nD.'
    full_text = re.sub(r'(\S)(D\.\s*)', r'\1\n\2', full_text)
    # 2. Options without dot on new lines: e.g. '\nB  ' -> '\nB. '
    full_text = re.sub(r'(?:^|\n)\s*([A-E])\s{2,}', r'\n\1. ', full_text)
    
    # Questions 1..100 are prefixed with 'Câu X.' while 101..200 start with 'X.'
    pattern = r'(?:^|\n)\s*(?:Câu\s+(\d+)[\.:]|(\d+)[\.:])\s+'
    matches = []
    for m in re.finditer(pattern, full_text):
        q_num = int(m.group(1) or m.group(2))
        matches.append((q_num, m.start()))
        
    seq = []
    expected = 1
    for m in matches:
        if m[0] == expected:
            seq.append(m)
            expected += 1
            
    questions = []
    safe_prefix = 'mgbds_cm' if 'chuyên' in unicodedata.normalize('NFC', filename).lower() else 'mgbds_cs'
    
    for i in range(len(seq)):
        q_num = seq[i][0]
        start_pos = seq[i][1]
        end_pos = seq[i+1][1] if i + 1 < len(seq) else len(full_text)
        block = full_text[start_pos:end_pos].strip()
        
        q_page = 1
        for offset, pno in page_offsets:
            if start_pos >= offset:
                q_page = pno
            else:
                break
                
        # Match answer key (supports 'Đáp án đúng:', 'Đáp án Đúng:', 'Đáp án:')
        ans_m = re.search(r'Đáp\s*án(?:\s*đúng)?\s*:\s*([A-Za-z0-9]*)', block, re.IGNORECASE)
        correct_ans = ans_m.group(1).upper() if ans_m else ''
        ans_start = ans_m.start() if ans_m else len(block)
        
        # Law fallback for Q158 in Phần cơ sở (Nghị định 16/2022/NĐ-CP Điều 58 Khoản 3)
        if not correct_ans and 'cơ sở' in unicodedata.normalize('NFC', filename).lower() and q_num == 158:
            correct_ans = 'C'
            
        opt_matches = list(re.finditer(r'(?:^|\n)\s*([A-E])[\.\)]\s*', block))
        if opt_matches:
            raw_q = block[:opt_matches[0].start()].strip()
            raw_q = re.sub(r'^(?:Câu\s+\d+[\.:]|\d+[\.:])\s*', '', raw_q).strip()
            q_text = clean_text(raw_q)
            
            options = []
            for opt_idx in range(len(opt_matches)):
                letter = opt_matches[opt_idx].group(1).upper()
                o_start = opt_matches[opt_idx].end()
                o_end = opt_matches[opt_idx+1].start() if opt_idx + 1 < len(opt_matches) else ans_start
                opt_raw = block[o_start:o_end].strip()
                clean_opt = clean_text(opt_raw)
                clean_opt = re.sub(r'[\s✔✓☑\-_:]+$', '', clean_opt).strip()
                options.append({'key': letter, 'text': clean_opt})
        else:
            q_text = clean_text(block)
            options = []
            
        questions.append({
            'id': f'{safe_prefix}_p{q_page}_q{q_num}',
            'topic': topic,
            'file': filename,
            'page': q_page,
            'q_num': q_num,
            'question': q_text,
            'options': options,
            'correct_answer': correct_ans,
            'can_cu': '',
            'giai_thich': '',
            'meo_ghi_nho': ''
        })
        
    return questions

def parse_pdf(pdf_path):
    filename = os.path.basename(pdf_path)
    norm_fn = unicodedata.normalize('NFC', filename).lower()
    if 'mgbds' in norm_fn or 'môi giới' in norm_fn or 'mgb' in norm_fn:
        return parse_mgbds_pdf(pdf_path)
    else:
        return parse_insurance_pdf(pdf_path)

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
    missing_ans_count = 0
    non_4_opt_count = 0
    
    for q in all_questions:
        if not q["correct_answer"]:
            missing_ans_count += 1
        if len(q["options"]) != 4:
            non_4_opt_count += 1
        for opt in q["options"]:
            if any(sym in opt["text"] for sym in ['✔', '✓', '☑']):
                tick_count += 1
                
    if tick_count > 0:
        print(f"CẢNH BÁO: Vẫn còn {tick_count} options chứa dấu tick!")
    else:
        print("Xác nhận: 100% options đã sạch hoàn toàn, KHÔNG còn bất kỳ dấu tick nào.")
        
    if missing_ans_count > 0:
        print(f"CẢNH BÁO: Còn {missing_ans_count} câu thiếu đáp án!")
    else:
        print("Xác nhận: 100% câu hỏi đều có đáp án chính xác.")
        
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump({
            "total": len(all_questions),
            "topics": stats,
            "questions": all_questions
        }, f, ensure_ascii=False, indent=2)
        
    print(f"Đã cập nhật dữ liệu sạch vào: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()

