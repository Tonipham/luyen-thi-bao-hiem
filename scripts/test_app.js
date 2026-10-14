const http = require('http');
const fs = require('fs');
const path = require('path');

function fetch(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    }).on('error', reject);
  });
}

async function runTests() {
  console.log("=== BẮT ĐẦU KIỂM THỬ HỆ THỐNG ===");

  // Test 1: Root HTML
  const rootRes = await fetch('http://localhost:8000/');
  console.log(`[Test 1] GET / -> Status ${rootRes.status} (Length: ${rootRes.body.length})`);
  if (rootRes.status !== 200 || !rootRes.body.includes('Luyện Thi Trắc Nghiệm')) {
    throw new Error('Test 1 Thất bại: Không tải được trang chủ index.html');
  }

  // Test 2: API Questions
  const apiRes = await fetch('http://localhost:8000/api/questions');
  console.log(`[Test 2] GET /api/questions -> Status ${apiRes.status}`);
  const data = JSON.parse(apiRes.body);
  console.log(`         Tổng số câu hỏi trong ngân hàng: ${data.total}`);
  if (data.total !== 846) {
    throw new Error(`Test 2 Thất bại: Mong đợi 846 câu hỏi, nhận được ${data.total}`);
  }

  // Test 3: Static CSS & JS Assets
  const assets = ['/css/style.css', '/css/quiz.css', '/js/timer.js', '/js/review.js', '/js/app.js'];
  for (const asset of assets) {
    const res = await fetch(`http://localhost:8000${asset}`);
    console.log(`[Test 3] GET ${asset} -> Status ${res.status} (${res.body.length} bytes)`);
    if (res.status !== 200) {
      throw new Error(`Test 3 Thất bại: Asset ${asset} không tải được!`);
    }
  }

  // Test 4: Simulation of Quiz Review & Citation Logic
  // Load QuizReview
  global.window = global;
  const reviewJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'review.js'), 'utf-8');
  eval(reviewJs); // loads window.QuizReview or QuizReview

  const sampleQuestions = data.questions.slice(0, 5);
  // Intentionally answer 3 correct, 1 wrong, 1 skipped
  const userAnswers = {
    [sampleQuestions[0].id]: sampleQuestions[0].correct_answer, // correct
    [sampleQuestions[1].id]: sampleQuestions[1].correct_answer, // correct
    [sampleQuestions[2].id]: sampleQuestions[2].correct_answer, // correct
    [sampleQuestions[3].id]: sampleQuestions[3].correct_answer === 'A' ? 'B' : 'A', // WRONG
    // [sampleQuestions[4].id] is skipped
  };

  const graded = QuizReview.grade({
    questions: sampleQuestions,
    userAnswers: userAnswers,
    elapsedTimeFormatted: '01:45'
  });

  console.log(`[Test 4] Chấm điểm mô phỏng:`);
  console.log(`         - Tổng câu: ${graded.total}`);
  console.log(`         - Số câu đúng: ${graded.correctCount} (Mong đợi 3)`);
  console.log(`         - Số câu sai: ${graded.wrongCount} (Mong đợi 1)`);
  console.log(`         - Số câu bỏ qua: ${graded.skippedCount} (Mong đợi 1)`);
  console.log(`         - Điểm phần trăm: ${graded.scorePercent}% (Mong đợi 60%)`);
  console.log(`         - Kết quả: ${graded.isPass ? 'ĐẠT' : 'CHƯA ĐẠT'} (Mong đợi CHƯA ĐẠT vì < 75%)`);

  if (graded.correctCount !== 3 || graded.wrongCount !== 1 || graded.skippedCount !== 1) {
    throw new Error('Test 4 Thất bại: Kết quả chấm điểm không khớp!');
  }

  // Test 5: Verify Citations on wrong question
  const wrongItem = graded.detailedResults.find(r => !r.isCorrect && r.isAnswered);
  const cardHtml = QuizReview.renderSingleReviewCard(wrongItem);
  console.log(`[Test 5] Kiểm tra thẻ dẫn chứng câu sai:`);
  console.log(`         - Có chứa 'Dẫn chứng & Hướng dẫn ôn tập': ${cardHtml.includes('Dẫn chứng & Hướng dẫn ôn tập')}`);
  console.log(`         - Có chứa file tài liệu '${wrongItem.question.file}': ${cardHtml.includes(wrongItem.question.file)}`);
  console.log(`         - Có chứa số trang 'Trang ${wrongItem.question.page}': ${cardHtml.includes(`Trang ${wrongItem.question.page}`)}`);
  console.log(`         - Có chứa 'Bạn chọn sai': ${cardHtml.includes('Bạn chọn sai')}`);
  console.log(`         - Có chứa 'Đáp án đúng': ${cardHtml.includes('Đáp án đúng')}`);

  if (!cardHtml.includes(wrongItem.question.file) || !cardHtml.includes('Đáp án đúng')) {
    throw new Error('Test 5 Thất bại: Thẻ câu sai thiếu dẫn chứng tài liệu hoặc đáp án!');
  }

  console.log("\n✅ TẤT CẢ CÁC BÀI KIỂM THỬ ĐÃ THÀNH CÔNG 100%!");
}

runTests().catch(err => {
  console.error("LỖI KIỂM THỬ:", err);
  process.exit(1);
});
