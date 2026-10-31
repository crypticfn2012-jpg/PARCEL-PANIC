export class AudioSystem {
  constructor() {
    this.context = null;
    this.enabled = true;
    this.master = 0.24;
  }
  unlock() {
    if (!this.enabled) return;
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.context = new AudioContext();
    }
    if (this.context && this.context.state === 'suspended') this.context.resume();
  }
  setEnabled(enabled) { this.enabled = enabled; }
  play(kind) {
    if (!this.enabled) return;
    this.unlock();
    if (!this.context) return;
    const presets = {
      pickup: [520, 760, 0.10, 'sine'],
      deliver: [420, 920, 0.22, 'triangle'],
      steal: [300, 180, 0.13, 'sawtooth'],
      jump: [230, 350, 0.08, 'sine'],
      bump: [120, 85, 0.07, 'triangle'],
      level: [500, 1050, 0.30, 'sine'],
      click: [420, 480, 0.035, 'sine'],
      win: [440, 880, 0.42, 'triangle']
    };
    const preset = presets[kind] || presets.click;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = preset[3];
    oscillator.frequency.setValueAtTime(preset[0], now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(45, preset[1]), now + preset[2]);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(this.master, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + preset[2] + 0.04);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + preset[2] + 0.05);
  }
}