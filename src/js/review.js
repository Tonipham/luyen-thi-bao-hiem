/**
 * Quiz Review & Scoring Module
 * Grades quiz, computes statistics, and renders detailed citations for mistakes.
 */
class QuizReview {
  static grade({ questions, userAnswers, elapsedTimeFormatted }) {
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;

    const detailedResults = questions.map((q, index) => {
      const userChoice = userAnswers[q.id] || null;
      const isAnswered = userChoice !== null;
      const isCorrect = isAnswered && userChoice.toUpperCase() === q.correct_answer.toUpperCase();

      if (!isAnswered) {
        skippedCount++;
      } else if (isCorrect) {
        correctCount++;
      } else {
        wrongCount++;
      }

      return {
        index: index + 1,
        question: q,
        userChoice,
        isAnswered,
        isCorrect,
        status: isCorrect ? 'correct' : !isAnswered ? 'skipped' : 'wrong'
      };
    });

    const total = questions.length;
    const scorePercent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const isPass = scorePercent >= 75; // Standard 75% pass mark

    return {
      total,
      correctCount,
      wrongCount,
      skippedCount,
      scorePercent,
      isPass,
      elapsedTimeFormatted,
      detailedResults
    };
  }

  static renderResults(resultData, containerEl, onRetryWrong, onNewQuiz) {
    const {
      total,
      correctCount,
      wrongCount,
      skippedCount,
      scorePercent,
      isPass,
      elapsedTimeFormatted,
      detailedResults
    } = resultData;

    // Filter states
    let currentFilter = wrongCount > 0 ? 'wrong' : 'all';

    containerEl.innerHTML = `
      <div class="result-hero">
        <div class="score-circle ${isPass ? 'pass' : 'fail'}">
          <div class="score-number">${scorePercent}%</div>
          <div class="score-total">${correctCount}/${total} câu</div>
        </div>
        <div class="result-badge ${isPass ? 'pass' : 'fail'}">
          ${isPass ? '🎉 ĐẠT CHỨNG CHỈ (≥ 75%)' : '⚠️ CHƯA ĐẠT (Cần ≥ 75%)'}
        </div>
        <p class="result-msg">
          ${isPass 
            ? 'Chúc mừng bạn đã hoàn thành xuất sắc bài thi! Hãy xem lại các câu sai bên dưới để tối ưu điểm số tuyệt đối.' 
            : 'Đừng nản lòng! Dưới đây là toàn bộ dẫn chứng tài liệu và căn cứ pháp lý cho các câu sai để bạn đọc ôn lại.'}
        </p>

        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-box stat-correct">
            <div class="val">${correctCount}</div>
            <div class="lbl">Câu Đúng</div>
          </div>
          <div class="stat-box stat-wrong">
            <div class="val">${wrongCount}</div>
            <div class="lbl">Câu Sai</div>
          </div>
          <div class="stat-box stat-skipped">
            <div class="val">${skippedCount}</div>
            <div class="lbl">Chưa Làm</div>
          </div>
          <div class="stat-box">
            <div class="val" style="color: var(--primary);">${elapsedTimeFormatted}</div>
            <div class="lbl">Thời Gian</div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
          ${wrongCount > 0 ? `
            <button id="btn-retry-wrong" class="btn btn-primary">
              🔁 Luyện lại ${wrongCount} câu sai
            </button>
          ` : ''}
          <button id="btn-new-quiz" class="btn btn-secondary">
            📝 Tạo bài thi mới
          </button>
          <button id="btn-print-results" class="btn btn-outline" onclick="window.print()">
            🖨️ In kết quả ôn tập
          </button>
        </div>
      </div>

      <!-- Review Filter Tabs -->
      <div class="review-filter-bar">
        <button class="filter-tab ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">
          Tất cả câu hỏi (${total})
        </button>
        <button class="filter-tab ${currentFilter === 'wrong' ? 'active' : ''}" data-filter="wrong">
          ⚠️ Chỉ xem câu làm sai (${wrongCount})
        </button>
        <button class="filter-tab ${currentFilter === 'correct' ? 'active' : ''}" data-filter="correct">
          ✅ Câu làm đúng (${correctCount})
        </button>
      </div>

      <!-- Question Review List -->
      <div id="review-cards-list"></div>
    `;

    // Hook button events
    const retryBtn = containerEl.querySelector('#btn-retry-wrong');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => onRetryWrong(detailedResults.filter(r => !r.isCorrect).map(r => r.question)));
    }

    const newQuizBtn = containerEl.querySelector('#btn-new-quiz');
    if (newQuizBtn) {
      newQuizBtn.addEventListener('click', onNewQuiz);
    }

    // Filter logic
    const filterTabs = containerEl.querySelectorAll('.filter-tab');
    const listContainer = containerEl.querySelector('#review-cards-list');

    const updateFilterView = (filter) => {
      currentFilter = filter;
      filterTabs.forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-filter') === filter);
      });

      const filtered = detailedResults.filter(r => {
        if (filter === 'wrong') return !r.isCorrect;
        if (filter === 'correct') return r.isCorrect;
        return true;
      });

      if (filtered.length === 0) {
        listContainer.innerHTML = `
          <div class="g-card">
            <div class="g-card-body" style="text-align: center; padding: 40px;">
              <p style="color: var(--text-muted); font-size: 1.05rem;">Không có câu hỏi nào trong mục này.</p>
            </div>
          </div>
        `;
        return;
      }

      listContainer.innerHTML = filtered.map(item => this.renderSingleReviewCard(item)).join('');
    };

    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        updateFilterView(tab.getAttribute('data-filter'));
      });
    });

    // Initial render
    updateFilterView(currentFilter);
  }

  static renderSingleReviewCard(item) {
    const { index, question: q, userChoice, isCorrect, isAnswered, status } = item;

    let statusHtml = '';
    if (isCorrect) {
      statusHtml = '<span class="status-badge correct">✅ Trả lời đúng</span>';
    } else if (!isAnswered) {
      statusHtml = '<span class="status-badge skipped">⚠️ Chưa trả lời</span>';
    } else {
      statusHtml = `<span class="status-badge wrong">❌ Trả lời sai (Bạn chọn ${userChoice})</span>`;
    }

    // Options rendering
    const optionsHtml = q.options.map(opt => {
      const isUserChoice = userChoice && userChoice.toUpperCase() === opt.key.toUpperCase();
      const isCorrectChoice = q.correct_answer && q.correct_answer.toUpperCase() === opt.key.toUpperCase();

      let optClass = '';
      let tagHtml = '';

      if (isCorrectChoice) {
        optClass = 'correct-ans';
        tagHtml = '<span class="option-tag correct">Đáp án đúng</span>';
      } else if (isUserChoice && !isCorrect) {
        optClass = 'user-wrong';
        tagHtml = '<span class="option-tag wrong">Bạn chọn sai</span>';
      }

      return `
        <div class="option-item ${optClass}">
          <div class="option-letter">${opt.key}.</div>
          <div class="option-text">${opt.text}</div>
          ${tagHtml}
        </div>
      `;
    }).join('');

    // Citations & explanations
    let citationHtml = '';
    if (q.can_cu || q.giai_thich || q.meo_ghi_nho || q.file) {
      citationHtml = `
        <div class="citation-box">
          <div class="citation-header">
            <span>📚 Dẫn chứng & Hướng dẫn ôn tập</span>
          </div>

          <!-- Nguồn tài liệu & Trang -->
          <div class="citation-meta-source">
            📄 Tài liệu: <strong>${q.file}</strong> (Trang ${q.page})
          </div>

          ${q.can_cu ? `
            <div class="citation-section">
              <div class="citation-label legal">
                <span>⚖️ Căn cứ pháp lý:</span>
              </div>
              <div class="citation-content">${q.can_cu}</div>
            </div>
          ` : ''}

          ${q.giai_thich ? `
            <div class="citation-section">
              <div class="citation-label explain">
                <span>💡 Hướng dẫn & Giải thích chi tiết:</span>
              </div>
              <div class="citation-content">${q.giai_thich}</div>
            </div>
          ` : ''}

          ${q.meo_ghi_nho ? `
            <div class="citation-section">
              <div class="tip-box">
                <div class="citation-label tip">
                  <span>🧠 Mẹo ghi nhớ khi thi:</span>
                </div>
                <div class="citation-content" style="color: #6b21a8; font-weight: 500;">
                  ${q.meo_ghi_nho}
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }

    return `
      <div class="question-card review-card ${status}">
        <div class="q-header-meta">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="q-badge-num">Câu ${index}</span>
            <span class="q-badge-topic">${q.topic || q.file}</span>
          </div>
          <div>${statusHtml}</div>
        </div>

        <div class="q-title">${q.question}</div>

        <div class="options-list">
          ${optionsHtml}
        </div>

        ${citationHtml}
      </div>
    `;
  }
}

window.QuizReview = QuizReview;
