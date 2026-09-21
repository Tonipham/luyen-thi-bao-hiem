/**
 * Main Application Logic
 * Orchestrates: Setup Screen -> Exam Session -> Submission -> Review
 */

// Global State
const state = {
  allQuestions: [],
  topics: {},
  activeQuestions: [],
  userAnswers: {},       // q.id -> option key (e.g. 'A')
  flaggedQuestions: new Set(), // Set of q.id
  timer: null,
  durationMinutes: 30,
  numQuestions: 30,
  selectedTopics: new Set(),
  startTime: null
};

// DOM Elements
const elements = {
  screenSetup: document.getElementById('screen-setup'),
  screenQuiz: document.getElementById('screen-quiz'),
  screenReview: document.getElementById('screen-review'),

  // Setup inputs
  inputNumQuestions: document.getElementById('input-num-questions'),
  inputDuration: document.getElementById('input-duration'),
  topicListContainer: document.getElementById('topic-list-container'),
  btnStartQuiz: document.getElementById('btn-start-quiz'),
  totalAvailableBadge: document.getElementById('total-available-badge'),

  // Quiz sticky bar
  timerDisplay: document.getElementById('timer-display'),
  progressText: document.getElementById('progress-text'),
  progressBarFill: document.getElementById('progress-bar-fill'),
  btnFinishExam: document.getElementById('btn-finish-exam'),

  // Quiz body
  questionsContainer: document.getElementById('questions-container'),
  paletteGrid: document.getElementById('palette-grid'),

  // Modal
  modalSubmit: document.getElementById('modal-confirm-submit'),
  modalMsg: document.getElementById('modal-submit-msg'),
  btnModalCancel: document.getElementById('btn-modal-cancel'),
  btnModalConfirm: document.getElementById('btn-modal-confirm'),

  // Review
  reviewContainer: document.getElementById('review-content')
};

// ==========================================================================
// INITIALIZATION
// ==========================================================================
async function initApp() {
  try {
    let response = await fetch('/api/questions');
    if (!response.ok) {
      // Fallback cho môi trường Static Web Hosting (Vercel, GitHub Pages, Netlify)
      response = await fetch('/data/questions.json');
    }
    if (!response.ok) {
      response = await fetch('./data/questions.json');
    }
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    state.allQuestions = data.questions || [];
    state.topics = data.topics || {};

    renderSetupTopics();
    setupEventListeners();
    updateAvailableQuestionsCount();
  } catch (err) {
    console.error("Lỗi nạp câu hỏi:", err);
    alert("Không thể tải danh sách câu hỏi từ server. Vui lòng đảm bảo server đang chạy!");
  }
}

// Render topic checkboxes in Setup screen
function renderSetupTopics() {
  if (!elements.topicListContainer) return;

  const topicEntries = Object.entries(state.topics);
  elements.topicListContainer.innerHTML = topicEntries.map(([file, count], index) => {
    // Default select all
    state.selectedTopics.add(file);
    const friendlyName = getFriendlyTopicName(file);

    return `
      <label class="topic-item checked" data-file="${file}">
        <div class="topic-item-left">
          <input type="checkbox" checked value="${file}" class="topic-checkbox" id="topic-chk-${index}">
          <span>${friendlyName}</span>
        </div>
        <span class="topic-count">${count} câu</span>
      </label>
    `;
  }).join('');

  // Add listeners to checkboxes
  elements.topicListContainer.querySelectorAll('.topic-checkbox').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const parent = e.target.closest('.topic-item');
      if (e.target.checked) {
        state.selectedTopics.add(e.target.value);
        parent.classList.add('checked');
      } else {
        state.selectedTopics.delete(e.target.value);
        parent.classList.remove('checked');
      }
      updateAvailableQuestionsCount();
    });
  });
}

function getFriendlyTopicName(filename) {
  const map = {
    "P1_ThuatNgu_NguyenTac_BoSung.pdf": "Phần 1: Thuật ngữ & Nguyên tắc chung",
    "P2_NghiepVu_BH.pdf": "Phần 2: Nghiệp vụ Bảo hiểm",
    "P3_PhapLuat_KDBH.pdf": "Phần 3: Pháp luật Kinh doanh Bảo hiểm",
    "P4_KenhPhanPhoi.pdf": "Phần 4: Kênh phân phối Bảo hiểm",
    "P5_CauHoiBoSung.pdf": "Phần 5A: Câu hỏi Bổ sung",
    "P5_TinhToan.pdf": "Phần 5B: Câu hỏi Tính toán"
  };
  return map[filename] || filename;
}

function updateAvailableQuestionsCount() {
  const available = state.allQuestions.filter(q => state.selectedTopics.has(q.file));
  if (elements.totalAvailableBadge) {
    elements.totalAvailableBadge.textContent = `${available.length} câu khả dụng`;
  }
  if (parseInt(elements.inputNumQuestions.value) > available.length) {
    elements.inputNumQuestions.value = Math.min(30, available.length);
  }
}

// ==========================================================================
// EVENT LISTENERS SETUP
// ==========================================================================
function setupEventListeners() {
  // Preset pills for questions count
  document.querySelectorAll('.preset-pill[data-num]').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.preset-pill[data-num]').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const val = pill.getAttribute('data-num');
      if (val === 'all') {
        const available = state.allQuestions.filter(q => state.selectedTopics.has(q.file));
        elements.inputNumQuestions.value = available.length;
      } else {
        elements.inputNumQuestions.value = val;
      }
    });
  });

  // Preset pills for duration
  document.querySelectorAll('.preset-pill[data-time]').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.preset-pill[data-time]').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      elements.inputDuration.value = pill.getAttribute('data-time');
    });
  });

  // Start Quiz Button
  elements.btnStartQuiz.addEventListener('click', startQuiz);

  // Finish / Submit Button
  elements.btnFinishExam.addEventListener('click', promptSubmitConfirmation);

  // Modal Cancel / Confirm
  elements.btnModalCancel.addEventListener('click', () => {
    elements.modalSubmit.classList.remove('open');
  });

  elements.btnModalConfirm.addEventListener('click', () => {
    elements.modalSubmit.classList.remove('open');
    submitQuiz();
  });
}

// ==========================================================================
// START EXAM FLOW
// ==========================================================================
function startQuiz() {
  const requestedNum = parseInt(elements.inputNumQuestions.value) || 30;
  const requestedDuration = parseInt(elements.inputDuration.value) || 30;

  if (state.selectedTopics.size === 0) {
    alert("Vui lòng chọn ít nhất 1 phần tài liệu ôn tập!");
    return;
  }

  // Filter questions by selected topics
  let pool = state.allQuestions.filter(q => state.selectedTopics.has(q.file));
  if (pool.length === 0) {
    alert("Không tìm thấy câu hỏi phù hợp với các phần đã chọn!");
    return;
  }

  // Shuffle and pick subset
  pool = shuffleArray([...pool]);
  const finalQuestions = pool.slice(0, Math.min(requestedNum, pool.length));

  initExamSession(finalQuestions, requestedDuration);
}

function initExamSession(questions, durationMinutes) {
  state.activeQuestions = questions;
  state.durationMinutes = durationMinutes;
  state.userAnswers = {};
  state.flaggedQuestions = new Set();
  state.startTime = Date.now();

  // Switch screens
  elements.screenSetup.style.display = 'none';
  elements.screenReview.style.display = 'none';
  elements.screenQuiz.style.display = 'block';

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Render question cards and palette
  renderQuizQuestions();
  renderQuestionPalette();
  updateProgress();

  // Initialize and start timer
  if (state.timer) {
    state.timer.stop();
  }

  state.timer = new QuizTimer({
    durationMinutes: durationMinutes,
    onTick: ({ remainingSeconds, formatted, state: timerState }) => {
      elements.timerDisplay.textContent = `⏳ ${formatted}`;
      elements.timerDisplay.className = `timer-badge ${timerState}`;
    },
    onFinish: () => {
      alert("⏰ Hết thời gian làm bài! Hệ thống đang tự động nộp bài và chấm điểm...");
      submitQuiz();
    }
  });

  state.timer.start();
}

// Render questions in continuous Google Forms format
function renderQuizQuestions() {
  elements.questionsContainer.innerHTML = state.activeQuestions.map((q, idx) => {
    const qIndex = idx + 1;
    const isFlagged = state.flaggedQuestions.has(q.id);

    const optionsHtml = q.options.map(opt => {
      return `
        <div class="option-item" data-qid="${q.id}" data-key="${opt.key}">
          <div class="option-radio">
            <div class="option-radio-dot"></div>
          </div>
          <div class="option-letter">${opt.key}.</div>
          <div class="option-text">${opt.text}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="question-card" id="q-card-${idx}" data-qid="${q.id}">
        <div class="q-header-meta">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="q-badge-num">Câu ${qIndex}</span>
            <span class="q-badge-topic">${q.topic || q.file}</span>
          </div>
          <button class="btn-flag ${isFlagged ? 'active' : ''}" data-qid="${q.id}" title="Đánh dấu câu hỏi để xem lại">
            ${isFlagged ? '🚩 Đã cờ' : '🏳️ Đặt cờ'}
          </button>
        </div>

        <div class="q-title">${q.question}</div>

        <div class="options-list">
          ${optionsHtml}
        </div>
      </div>
    `;
  }).join('');

  // Attach click events to options
  elements.questionsContainer.querySelectorAll('.option-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const qid = item.getAttribute('data-qid');
      const key = item.getAttribute('data-key');
      selectAnswer(qid, key);
    });
  });

  // Attach click events to flag buttons
  elements.questionsContainer.querySelectorAll('.btn-flag').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const qid = btn.getAttribute('data-qid');
      toggleFlag(qid, btn);
    });
  });
}

// Render Question Palette Grid
function renderQuestionPalette() {
  elements.paletteGrid.innerHTML = state.activeQuestions.map((q, idx) => {
    const qNum = idx + 1;
    const isAnswered = Boolean(state.userAnswers[q.id]);
    const isFlagged = state.flaggedQuestions.has(q.id);

    let cls = 'palette-btn';
    if (isAnswered) cls += ' answered';
    if (isFlagged) cls += ' flagged';

    return `
      <button class="${cls}" id="palette-btn-${idx}" data-index="${idx}" title="Chuyển đến câu ${qNum}">
        ${qNum}
      </button>
    `;
  }).join('');

  // Click palette button to jump to question
  elements.paletteGrid.querySelectorAll('.palette-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = btn.getAttribute('data-index');
      const targetCard = document.getElementById(`q-card-${idx}`);
      if (targetCard) {
        // Remove focus from all
        document.querySelectorAll('.question-card').forEach(c => c.classList.remove('active-focus'));
        targetCard.classList.add('active-focus');
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });
}

// Answer selection handler
function selectAnswer(qid, key) {
  state.userAnswers[qid] = key;

  // Update card UI
  const card = document.querySelector(`.question-card[data-qid="${qid}"]`);
  if (card) {
    card.querySelectorAll('.option-item').forEach(item => {
      if (item.getAttribute('data-key') === key) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
  }

  // Update palette UI
  const qIndex = state.activeQuestions.findIndex(q => q.id === qid);
  if (qIndex !== -1) {
    const paletteBtn = document.getElementById(`palette-btn-${qIndex}`);
    if (paletteBtn) {
      paletteBtn.classList.add('answered');
    }
  }

  updateProgress();
}

// Flag toggle handler
function toggleFlag(qid, btnEl) {
  if (state.flaggedQuestions.has(qid)) {
    state.flaggedQuestions.delete(qid);
    btnEl.classList.remove('active');
    btnEl.innerHTML = '🏳️ Đặt cờ';
  } else {
    state.flaggedQuestions.add(qid);
    btnEl.classList.add('active');
    btnEl.innerHTML = '🚩 Đã cờ';
  }

  const qIndex = state.activeQuestions.findIndex(q => q.id === qid);
  if (qIndex !== -1) {
    const paletteBtn = document.getElementById(`palette-btn-${qIndex}`);
    if (paletteBtn) {
      paletteBtn.classList.toggle('flagged', state.flaggedQuestions.has(qid));
    }
  }
}

// Update progress bar and answered count
function updateProgress() {
  const answeredCount = Object.keys(state.userAnswers).length;
  const total = state.activeQuestions.length;
  const percent = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

  elements.progressText.textContent = `Đã làm: ${answeredCount}/${total} câu (${percent}%)`;
  elements.progressBarFill.style.width = `${percent}%`;
}

// ==========================================================================
// SUBMIT & REVIEW FLOW
// ==========================================================================
function promptSubmitConfirmation() {
  const answeredCount = Object.keys(state.userAnswers).length;
  const total = state.activeQuestions.length;
  const remaining = total - answeredCount;

  if (remaining > 0) {
    elements.modalMsg.innerHTML = `
      Bạn đã trả lời <strong>${answeredCount}/${total}</strong> câu hỏi.<br>
      Còn <span style="color: var(--danger); font-weight: 700;">${remaining} câu chưa trả lời</span>.<br><br>
      Bạn có chắc chắn muốn nộp bài và kết thúc bài thi ngay bây giờ?
    `;
  } else {
    elements.modalMsg.innerHTML = `
      Bạn đã hoàn thành đầy đủ <strong>${total}/${total}</strong> câu hỏi!<br><br>
      Bạn có muốn kết thúc và nhận kết quả chấm điểm ngay bây giờ?
    `;
  }

  elements.modalSubmit.classList.add('open');
}

function submitQuiz() {
  if (state.timer) {
    state.timer.stop();
  }

  const elapsed = state.timer ? state.timer.formatElapsed() : '00:00';

  // Grade quiz
  const resultData = QuizReview.grade({
    questions: state.activeQuestions,
    userAnswers: state.userAnswers,
    elapsedTimeFormatted: elapsed
  });

  // Switch to review screen
  elements.screenQuiz.style.display = 'none';
  elements.screenReview.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Render review UI
  QuizReview.renderResults(
    resultData,
    elements.reviewContainer,
    (wrongQuestions) => retryWrongQuestions(wrongQuestions),
    () => resetToSetup()
  );
}

// Retry only wrong questions
function retryWrongQuestions(wrongQuestions) {
  if (!wrongQuestions || wrongQuestions.length === 0) return;
  const suggestedTime = Math.max(5, Math.ceil(wrongQuestions.length * 1.2)); // 1.2 min per question
  initExamSession(wrongQuestions, suggestedTime);
}

// Return to setup
function resetToSetup() {
  if (state.timer) {
    state.timer.stop();
  }
  elements.screenReview.style.display = 'none';
  elements.screenQuiz.style.display = 'none';
  elements.screenSetup.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Utility: Shuffle array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Run on page load
document.addEventListener('DOMContentLoaded', initApp);
