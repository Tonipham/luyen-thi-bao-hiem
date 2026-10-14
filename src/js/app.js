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
  topicQuickFilters: document.getElementById('topic-quick-filters'),
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

// Render topic checkboxes in Setup screen (showing only MGBĐS topics)
function renderSetupTopics() {
  if (!elements.topicListContainer) return;

  const topicEntries = Object.entries(state.topics);
  // Default: NO topic selected (user chooses manually)
  state.selectedTopics.clear();

  // Filter only MGBĐS topics
  const bdsTopics = [];
  topicEntries.forEach(([file, count]) => {
    const norm = (file || '').normalize('NFC').toLowerCase();
    if (norm.includes('mgb') || norm.includes('chuyên') || norm.includes('cơ sở')) {
      bdsTopics.push({ file, count });
    }
  });

  // Sort: Cơ sở first, then Chuyên môn
  bdsTopics.sort((a, b) => {
    const normA = a.file.normalize('NFC').toLowerCase();
    const normB = b.file.normalize('NFC').toLowerCase();
    if (normA.includes('cơ sở')) return -1;
    if (normB.includes('cơ sở')) return 1;
    return 0;
  });

  const bdsTotal = bdsTopics.reduce((sum, t) => sum + t.count, 0);

  // Render quick filter buttons for MGBĐS
  if (elements.topicQuickFilters) {
    elements.topicQuickFilters.innerHTML = `
      <button type="button" class="topic-filter-btn" data-filter="all">✨ Cả 2 phần (${bdsTotal} câu)</button>
      <button type="button" class="topic-filter-btn" data-filter="cs">📘 Phần Cơ sở (200 câu)</button>
      <button type="button" class="topic-filter-btn" data-filter="cm">📙 Phần Chuyên môn (200 câu)</button>
      <button type="button" class="topic-filter-btn active" data-filter="none">❌ Bỏ chọn</button>
    `;

    elements.topicQuickFilters.querySelectorAll('.topic-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        elements.topicQuickFilters.querySelectorAll('.topic-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const mode = btn.getAttribute('data-filter');
        const checkboxes = elements.topicListContainer.querySelectorAll('.topic-checkbox');

        checkboxes.forEach(chk => {
          const file = chk.value;
          const norm = file.normalize('NFC').toLowerCase();
          const isCs = norm.includes('cơ sở');
          const isCm = norm.includes('chuyên');
          const parent = chk.closest('.topic-item');

          let shouldCheck = false;
          if (mode === 'all') shouldCheck = true;
          else if (mode === 'cs') shouldCheck = isCs;
          else if (mode === 'cm') shouldCheck = isCm;
          else if (mode === 'none') shouldCheck = false;

          chk.checked = shouldCheck;
          if (shouldCheck) {
            state.selectedTopics.add(file);
            parent.classList.add('checked');
          } else {
            state.selectedTopics.delete(file);
            parent.classList.remove('checked');
          }
        });

        updateAvailableQuestionsCount();
      });
    });
  }

  // Helper to render items (default unchecked)
  const renderItemHtml = (item, idx) => {
    const friendlyName = getFriendlyTopicName(item.file);
    const isChecked = state.selectedTopics.has(item.file);
    return `
      <label class="topic-item ${isChecked ? 'checked' : ''}" data-file="${item.file}">
        <div class="topic-item-left">
          <input type="checkbox" ${isChecked ? 'checked' : ''} value="${item.file}" class="topic-checkbox" id="topic-chk-${idx}">
          <span>${friendlyName}</span>
        </div>
        <span class="topic-count">${item.count} câu</span>
      </label>
    `;
  };

  let html = `
    <div class="topic-category-group">
      <div class="topic-category-title">
        <span>🏠 CHUYÊN ĐỀ THI MÔI GIỚI BẤT ĐỘNG SẢN (MGBĐS)</span>
        <span class="topic-category-count">${bdsTotal} câu</span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${bdsTopics.map((t, idx) => renderItemHtml(t, idx)).join('')}
      </div>
    </div>
  `;

  elements.topicListContainer.innerHTML = html;

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
      
      // Update quick filter buttons active state
      if (elements.topicQuickFilters) {
        elements.topicQuickFilters.querySelectorAll('.topic-filter-btn').forEach(b => b.classList.remove('active'));
      }
      updateAvailableQuestionsCount();
    });
  });
}

function getFriendlyTopicName(filename) {
  const norm = (filename || '').normalize('NFC').toLowerCase();
  if (norm.includes('cơ sở')) return "📘 Phần 1: Kiến thức Cơ sở MGBĐS (200 câu)";
  if (norm.includes('chuyên')) return "📙 Phần 2: Kiến thức Chuyên môn MGBĐS (200 câu)";
  return filename;
}

function updateAvailableQuestionsCount() {
  const available = state.allQuestions.filter(q => state.selectedTopics.has(q.file));
  if (elements.totalAvailableBadge) {
    if (available.length === 0) {
      elements.totalAvailableBadge.textContent = '0 câu khả dụng (Chưa chọn bộ đề)';
      elements.totalAvailableBadge.style.background = '#fef2f2';
      elements.totalAvailableBadge.style.color = '#dc2626';
    } else {
      elements.totalAvailableBadge.textContent = `${available.length} câu khả dụng`;
      elements.totalAvailableBadge.style.background = '';
      elements.totalAvailableBadge.style.color = '';
    }
  }
  if (elements.inputNumQuestions) {
    elements.inputNumQuestions.max = available.length;
    if (available.length === 0) {
      elements.inputNumQuestions.value = 0;
      elements.inputNumQuestions.placeholder = 'Hãy tích chọn ít nhất 1 bộ đề bên dưới';
    } else {
      const currentVal = parseInt(elements.inputNumQuestions.value) || 0;
      if (currentVal === 0 || currentVal > available.length) {
        elements.inputNumQuestions.value = Math.min(30, available.length);
      }
    }
  }
}

// ==========================================================================
// EVENT LISTENERS SETUP
// ==========================================================================
function setupEventListeners() {
  // Preset pills for questions count
  document.querySelectorAll('.preset-pill[data-num]').forEach(pill => {
    pill.addEventListener('click', () => {
      const val = pill.getAttribute('data-num');
      const available = state.allQuestions.filter(q => state.selectedTopics.has(q.file));
      
      if (available.length === 0) {
        alert("Vui lòng tích chọn ít nhất 1 bộ câu hỏi bên dưới trước khi chọn số lượng câu!");
        return;
      }

      document.querySelectorAll('.preset-pill[data-num]').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      
      if (val === 'all') {
        elements.inputNumQuestions.value = available.length;
      } else {
        elements.inputNumQuestions.value = Math.min(parseInt(val), available.length);
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
  if (state.selectedTopics.size === 0) {
    alert("Vui lòng tích chọn ít nhất 1 bộ câu hỏi ôn tập bên dưới trước khi bắt đầu!");
    return;
  }

  const requestedNum = parseInt(elements.inputNumQuestions.value) || 0;
  const requestedDuration = parseInt(elements.inputDuration.value) || 30;

  if (requestedNum <= 0) {
    alert("Vui lòng chọn số lượng câu hỏi cần thi lớn hơn 0!");
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
