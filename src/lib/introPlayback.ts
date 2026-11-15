import { FLOW_PILOT } from '@/config/flowPilot';

// This is the only owner of play/pause/seek during a gesture-driven intro.
// UI progress is read from presented video frames, never from a parallel timer.
export class IntroPlayback {
  private video: HTMLVideoElement;
  private root: HTMLElement;
  private fallback: HTMLImageElement;
  private callback: number | null = null;
  private createdAt = performance.now();
  private fallbackStarted = 0;
  private failed = false;
  private started = false;
  private finished = false;
  private presented = 0;
  private frameCount = 0;
  private lastFrame = FLOW_PILOT.transition.playbackSeconds - 1 / FLOW_PILOT.transition.playbackFps;

  constructor(video: HTMLVideoElement, backwards: boolean) {
    this.video = video;
    this.root = video.closest<HTMLElement>('[data-role="flow-arrival"]')!;
    this.fallback = this.root.querySelector<HTMLImageElement>('[data-role="flow-arrival-fallback"]')!;
    this.root.dataset.native = 'true';
    this.root.dataset.fallback = 'false';
    this.root.dataset.playbackState = 'preparing';
    this.video.pause();
    this.video.playbackRate = 1;
    this.video.muted = true;
    const src = backwards ? FLOW_PILOT.transition.returnVideo : FLOW_PILOT.transition.arrivalVideo;
    this.video.poster = backwards ? FLOW_PILOT.transition.arrivalPoster : FLOW_PILOT.transition.poster;
    this.fallback.src = backwards ? FLOW_PILOT.transition.poster : FLOW_PILOT.transition.arrivalPoster;
    if (new URL(src, location.href).href !== this.video.src) {
      this.video.src = src;
      this.video.load();
    } else if (this.video.readyState >= 1) {
      this.video.currentTime = 0;
    }
    this.video.dataset.presentedTime = '0';
    this.video.dataset.presentedFrames = '0';
    this.video.addEventListener('error', this.fail);
    this.video.addEventListener('ended', this.ended);
  }

  private fail = () => {
    if (this.failed) return;
    this.failed = true;
    this.video.pause();
    this.root.dataset.fallback = 'true';
    this.root.dataset.playbackState = 'fallback';
  };

  private ended = () => {
    // ended means the short file, including its destination frame, was decoded.
    this.presented = this.lastFrame;
    this.finished = true;
    this.root.dataset.playbackState = 'arrived';
  };

  get prepared() {
    if (this.video.error || performance.now() - this.createdAt > 8000 && !this.started) this.fail();
    if (this.failed) return this.fallback.complete && this.fallback.naturalWidth > 0;
    if (this.video.readyState < 3 || this.video.seeking) return false;
    const buffered = this.video.buffered;
    // The trip is only 1.2 seconds. Buffer it completely before opening panels.
    return buffered.length > 0 && buffered.start(0) < .05
      && buffered.end(buffered.length - 1) >= this.video.duration - .05;
  }

  start() {
    if (this.started) return;
    this.started = true;
    if (this.failed) { this.fallbackStarted = performance.now(); return; }
    this.root.dataset.playbackState = 'playing';
    if (typeof this.video.requestVideoFrameCallback === 'function') {
      const sample: VideoFrameRequestCallback = (_, metadata) => {
        this.presented = metadata.mediaTime;
        this.frameCount++;
        this.video.dataset.presentedTime = this.presented.toFixed(5);
        this.video.dataset.presentedFrames = String(this.frameCount);
        if (!this.finished) this.callback = this.video.requestVideoFrameCallback(sample);
      };
      this.callback = this.video.requestVideoFrameCallback(sample);
    }
    this.video.play().catch(this.fail);
  }

  get progress() {
    if (this.failed) {
      if (!this.fallbackStarted && this.started) this.fallbackStarted = performance.now();
      return this.fallbackStarted ? Math.min(1, (performance.now() - this.fallbackStarted) / 180) : 0;
    }
    if (typeof this.video.requestVideoFrameCallback !== 'function' && this.video.readyState >= 2) {
      this.presented = this.video.currentTime;
    }
    return Math.max(0, Math.min(1, this.presented / this.lastFrame));
  }

  get done() { return this.failed ? this.progress === 1 : this.finished; }
  get state() { return this.root.dataset.playbackState ?? 'preparing'; }

  syncVisibility() {
    if (!this.started || this.finished || this.failed) return;
    if (document.hidden) this.video.pause();
    else if (this.video.paused) this.video.play().catch(this.fail);
  }

  dispose() {
    this.video.pause();
    if (this.callback !== null) this.video.cancelVideoFrameCallback(this.callback);
    this.video.removeEventListener('error', this.fail);
    this.video.removeEventListener('ended', this.ended);
  }
}

export function clearIntroPlayback() {
  const root = document.querySelector<HTMLElement>('[data-role="flow-arrival"]');
  if (!root) return;
  root.dataset.native = 'false';
  root.dataset.fallback = 'false';
  root.querySelector<HTMLVideoElement>('video')?.pause();
}
