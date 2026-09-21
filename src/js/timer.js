/**
 * Quiz Timer Module
 * Handles accurate countdown, warning states, and auto-submit triggers.
 */
class QuizTimer {
  constructor({ durationMinutes, onTick, onWarning, onFinish }) {
    this.totalSeconds = Math.max(1, Math.round(durationMinutes * 60));
    this.remainingSeconds = this.totalSeconds;
    this.onTick = onTick || (() => {});
    this.onWarning = onWarning || (() => {});
    this.onFinish = onFinish || (() => {});
    
    this.timerId = null;
    this.startTime = null;
    this.endTime = null;
    this.isPaused = false;
  }

  start() {
    this.startTime = Date.now();
    this.endTime = this.startTime + this.totalSeconds * 1000;
    this.isPaused = false;

    this.tick();
    this.timerId = setInterval(() => this.tick(), 500);
  }

  tick() {
    if (this.isPaused) return;

    const now = Date.now();
    const diff = Math.max(0, Math.ceil((this.endTime - now) / 1000));
    this.remainingSeconds = diff;

    const formatted = this.formatTime(this.remainingSeconds);
    const state = this.remainingSeconds <= 30 ? 'danger' : this.remainingSeconds <= 120 ? 'warning' : 'normal';

    this.onTick({
      remainingSeconds: this.remainingSeconds,
      formatted,
      state
    });

    if (this.remainingSeconds <= 0) {
      this.stop();
      this.onFinish();
    }
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  getElapsedSeconds() {
    if (!this.startTime) return 0;
    return Math.min(this.totalSeconds, Math.round((Date.now() - this.startTime) / 1000));
  }

  formatElapsed() {
    return this.formatTime(this.getElapsedSeconds());
  }

  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}

window.QuizTimer = QuizTimer;
