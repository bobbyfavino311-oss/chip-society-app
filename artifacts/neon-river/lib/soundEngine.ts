let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    const Win = window as Window & {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    const Cls = Win.AudioContext ?? Win.webkitAudioContext;
    if (!Cls) return null;
    if (!_ctx) _ctx = new Cls();
    if (_ctx.state === 'suspended') void _ctx.resume();
    return _ctx;
  } catch {
    return null;
  }
}

function tone(
  freq: number,
  type: OscillatorType,
  duration: number,
  vol = 0.3,
  delay = 0,
  freqEnd?: number,
) {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (freqEnd !== undefined) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol, t + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.01);
}

function noise(duration: number, vol = 0.12, loFreq = 200, hiFreq = 3000, delay = 0) {
  const ctx = getCtx();
  if (!ctx) return;
  const sr = ctx.sampleRate;
  const len = Math.ceil(sr * duration);
  const buf = ctx.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filt = ctx.createBiquadFilter();
  filt.type = 'bandpass';
  filt.frequency.value = (loFreq + hiFreq) / 2;
  filt.Q.value = 0.7;
  const gain = ctx.createGain();
  const t = ctx.currentTime + delay;
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  src.connect(filt);
  filt.connect(gain);
  gain.connect(ctx.destination);
  src.start(t);
  src.stop(t + duration + 0.01);
}

export const SoundEngine = {
  deal() {
    noise(0.07, 0.14, 600, 5000);
    noise(0.05, 0.09, 300, 2000, 0.04);
    tone(1800, 'sine', 0.04, 0.06, 0.01);
  },

  chip() {
    tone(1100, 'sine', 0.07, 0.22);
    tone(1500, 'sine', 0.05, 0.12, 0.012);
    noise(0.04, 0.09, 1200, 6000);
  },

  check() {
    noise(0.035, 0.09, 150, 700);
    tone(380, 'sine', 0.055, 0.10);
  },

  fold() {
    tone(280, 'sine', 0.22, 0.22, 0, 160);
    noise(0.06, 0.07, 100, 600, 0.02);
  },

  call() {
    tone(900, 'sine', 0.06, 0.18);
    tone(1100, 'sine', 0.05, 0.12, 0.015);
    noise(0.04, 0.07, 800, 3000);
  },

  raise() {
    tone(600, 'sine', 0.06, 0.18);
    tone(900, 'sine', 0.07, 0.20, 0.04);
    tone(1200, 'sine', 0.06, 0.16, 0.08);
    noise(0.05, 0.10, 800, 4000, 0.02);
  },

  allin() {
    [350, 500, 680, 950, 1300].forEach((f, i) => {
      tone(f, 'sawtooth', 0.22, 0.13 + i * 0.015, i * 0.065, f * 1.06);
    });
    noise(0.15, 0.08, 300, 2000, 0.1);
  },

  win() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => {
      tone(f, 'sine', 0.28, 0.18 + i * 0.01, i * 0.11);
    });
    tone(1047, 'triangle', 0.45, 0.22, 0.58);
    tone(1319, 'sine', 0.5, 0.18, 0.72);
    noise(0.12, 0.06, 2000, 8000, 0.55);
  },

  lose() {
    tone(330, 'sine', 0.30, 0.20, 0, 200);
    tone(250, 'sine', 0.30, 0.18, 0.15, 160);
    tone(180, 'sine', 0.35, 0.15, 0.32, 120);
  },
};
