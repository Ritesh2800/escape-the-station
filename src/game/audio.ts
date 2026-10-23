/**
 * 8-Bit Chiptune Web Audio Synthesizer & Sound Effects
 * Generates authentic retro arcade/pixel game music and sound effects using Web Audio API.
 * No external audio files required!
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgmInterval: number | null = null;
  private trainChugInterval: number | null = null;
  private bgmStep: number = 0;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBGM();
      this.stopTrainSound();
    } else {
      this.startBGM();
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.isMuted) {
      this.stopBGM();
      this.stopTrainSound();
    } else {
      this.startBGM();
    }
  }

  // --- Sound Effects ---

  /** Pixel UI click / keypress blip */
  public playClick(pitchMultiplier: number = 1.0) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(587.33 * pitchMultiplier, this.ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880 * pitchMultiplier, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // AudioContext fallback
    }
  }

  /** Clue typewriter blip */
  public playClueType() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440 + Math.random() * 220, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.03);
    } catch {}
  }

  /** Rule pass sparkle / chime */
  public playRulePass() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.06);

        gain.gain.setValueAtTime(0.07, this.ctx.currentTime + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.06 + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + idx * 0.06);
        osc.stop(this.ctx.currentTime + idx * 0.06 + 0.12);
      });
    } catch {}
  }

  /** Error / shake buzz */
  public playError() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130.81, this.ctx.currentTime); // C3
      osc.frequency.setValueAtTime(116.54, this.ctx.currentTime + 0.08); // Bb2

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch {}
  }

  /** Era glitch warp sweep */
  public playGlitchWarp() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.2);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch {}
  }

  /** Train steam whistle */
  public playTrainWhistle() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      [600, 750].forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.05, this.ctx.currentTime + 0.4);

        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.6);
      });
    } catch {}
  }

  /** Train chug-chug sound loop when train is moving */
  public startTrainSound() {
    if (this.isMuted || this.trainChugInterval !== null) return;
    try {
      this.initCtx();
      this.trainChugInterval = window.setInterval(() => {
        if (this.isMuted || !this.ctx) return;
        // Chug noise burst
        const bufferSize = this.ctx.sampleRate * 0.05;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
      }, 240);
    } catch {}
  }

  public stopTrainSound() {
    if (this.trainChugInterval !== null) {
      clearInterval(this.trainChugInterval);
      this.trainChugInterval = null;
    }
  }

  /** Victory / Access Granted fanfare */
  public playVictoryFanfare() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const fanfare = [
        { f: 523.25, d: 0.15 }, // C5
        { f: 523.25, d: 0.15 }, // C5
        { f: 523.25, d: 0.15 }, // C5
        { f: 659.25, d: 0.35 }, // E5
        { f: 587.33, d: 0.15 }, // D5
        { f: 783.99, d: 0.6 },  // G5
      ];

      let t = this.ctx.currentTime;
      fanfare.forEach(({ f, d }) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(f, t);

        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + d);
        t += d + 0.03;
      });
    } catch {}
  }

  // --- Retro Chiptune Background Music ---

  /** 8-bit atmospheric station bass & arpeggio loop */
  public startBGM() {
    if (this.isMuted || this.bgmInterval !== null) return;
    try {
      this.initCtx();
      // Melody notes (A minor / retro synth progression)
      const leadMelody = [
        220.0, 0, 261.63, 0, 293.66, 329.63, 261.63, 0,
        220.0, 0, 196.0, 0, 220.0, 0, 0, 0,
        329.63, 0, 392.0, 0, 329.63, 293.66, 261.63, 0,
        220.0, 0, 246.94, 0, 220.0, 0, 0, 0,
      ];

      const bassNotes = [
        110.0, 110.0, 130.81, 130.81, 146.83, 146.83, 130.81, 130.81,
        110.0, 110.0, 98.0, 98.0, 110.0, 110.0, 110.0, 110.0,
      ];

      this.bgmStep = 0;
      this.bgmInterval = window.setInterval(() => {
        if (this.isMuted || !this.ctx) return;

        const leadNote = leadMelody[this.bgmStep % leadMelody.length];
        const bassNote = bassNotes[Math.floor(this.bgmStep / 2) % bassNotes.length];

        const t = this.ctx.currentTime;

        // Lead chiptune pulse
        if (leadNote > 0) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(leadNote, t);

          gain.gain.setValueAtTime(0.025, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(t);
          osc.stop(t + 0.16);
        }

        // Triangle bass
        if (this.bgmStep % 2 === 0) {
          const bassOsc = this.ctx.createOscillator();
          const bassGain = this.ctx.createGain();
          bassOsc.type = 'triangle';
          bassOsc.frequency.setValueAtTime(bassNote, t);

          bassGain.gain.setValueAtTime(0.04, t);
          bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

          bassOsc.connect(bassGain);
          bassGain.connect(this.ctx.destination);

          bassOsc.start(t);
          bassOsc.stop(t + 0.3);
        }

        this.bgmStep++;
      }, 190);
    } catch {}
  }

  public stopBGM() {
    if (this.bgmInterval !== null) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const sound = new SoundEngine();
