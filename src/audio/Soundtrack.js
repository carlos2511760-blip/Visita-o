/**
 * Cozy Lo-Fi & Ambient Procedural Sound Engine
 * Uses Web Audio API for zero-external-dependency, zero-loading-time audio.
 */

export class Soundtrack {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.currentWorld = 'paris';

    this.musicVolume = 0.55;
    this.sfxVolume = 0.7;

    // Musical scales & cozy progressions
    // MIDI numbers
    this.chords = {
      paris: [
        [48, 55, 60, 64, 67, 71], // Cmaj7 (C3, G3, C4, E4, G4, B4)
        [45, 52, 57, 60, 64, 67], // Am9   (A2, E3, A3, C4, E4, G4)
        [50, 57, 62, 65, 69, 72], // Dm7   (D3, A3, D4, F4, A4, C5)
        [43, 50, 55, 60, 65, 67], // G7sus4(G2, D3, G3, C4, F4, G4)
      ],
      rio: [
        [41, 48, 53, 57, 60, 65], // Fmaj7 (F2, C3, F3, A3, C4, F4)
        [38, 45, 50, 54, 57, 61], // D7b9  (D2, A2, D3, F#3, A3, C#4)
        [43, 50, 55, 58, 62, 67], // Gm7   (G2, D3, G3, Bb3, D4, G4)
        [48, 55, 58, 62, 64, 68], // C7b9  (C3, G3, Bb3, D4, E4, Ab4)
      ]
    };

    this.currentChordIndex = 0;
    this.chordTimer = null;
    this.noiseNode = null;
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(1, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);

    this.startVinylNoise();
    this.startChordLoop();
    this.isPlaying = true;
  }

  setWorld(worldId) {
    this.currentWorld = worldId === 'rio' ? 'rio' : 'paris';
    this.currentChordIndex = 0;
  }

  startVinylNoise() {
    if (!this.ctx) return;
    // Gentle pink/brown crackle & breeze
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2) * 0.015;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    whiteNoise.start(0);
    this.noiseNode = whiteNoise;
  }

  midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  playChordVoice(freq, startTime, duration, velocity = 0.12) {
    if (!this.ctx) return;

    // Two detuned oscillators for lush warmth
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(freq * 0.998, startTime);
    osc2.frequency.setValueAtTime(freq * 1.002, startTime);

    // Warm filter with gentle envelope
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(700, startTime);
    filter.frequency.exponentialRampToValueAtTime(1400, startTime + 1.2);
    filter.frequency.exponentialRampToValueAtTime(500, startTime + duration);

    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0.001, startTime);
    voiceGain.gain.linearRampToValueAtTime(velocity, startTime + 0.8);
    voiceGain.gain.exponentialRampToValueAtTime(velocity * 0.4, startTime + duration * 0.6);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(this.musicGain);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + duration + 0.1);
    osc2.stop(startTime + duration + 0.1);
  }

  startChordLoop() {
    const playNext = () => {
      if (!this.ctx || !this.isPlaying) return;

      const chordList = this.chords[this.currentWorld] || this.chords.paris;
      const chord = chordList[this.currentChordIndex];
      this.currentChordIndex = (this.currentChordIndex + 1) % chordList.length;

      const duration = 4.2; // seconds per chord
      const now = this.ctx.currentTime;

      // Play notes with subtle arpeggiation delay
      chord.forEach((midi, idx) => {
        const freq = this.midiToFreq(midi);
        const stagger = idx * 0.08 + (Math.random() * 0.02);
        const vel = idx === 0 ? 0.18 : (0.08 + Math.random() * 0.04);
        this.playChordVoice(freq, now + stagger, duration - stagger, vel);
      });

      // Subtle occasional chime / melody note
      if (Math.random() > 0.4) {
        const melodyMidi = chord[chord.length - 1] + (Math.random() > 0.5 ? 2 : 4);
        const melFreq = this.midiToFreq(melodyMidi);
        this.playChordVoice(melFreq, now + 2.0, 2.0, 0.06);
      }

      this.chordTimer = setTimeout(playNext, (duration - 0.4) * 1000);
    };

    playNext();
  }

  // --- SOUND EFFECTS (SFX) ---

  playFootstep(surface = 'stone') {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = surface === 'grass' ? 'triangle' : 'sine';
    const baseFreq = surface === 'grass' ? 90 : 130;
    osc.frequency.setValueAtTime(baseFreq + (Math.random() * 20 - 10), now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(surface === 'grass' ? 350 : 500, now);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  playJump() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(360, now + 0.18);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.21);
  }

  playDialogueBlip(pitchFactor = 1.0) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const freq = (420 + Math.random() * 60) * pitchFactor;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.15, now + 0.05);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  playEmotePop() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(740, now + 0.12);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  playPhotoShutter() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Shutter click 1
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(800, now);
    osc1.frequency.exponentialRampToValueAtTime(200, now + 0.04);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(now);
    osc1.stop(now + 0.06);

    // Shutter click 2 (rebound)
    setTimeout(() => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(500, t);
      osc2.frequency.exponentialRampToValueAtTime(150, t + 0.06);
      gain2.gain.setValueAtTime(0.15, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
      osc2.connect(gain2);
      gain2.connect(this.sfxGain);
      osc2.start(t);
      osc2.stop(t + 0.08);
    }, 90);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
    }
    return this.isMuted;
  }
}
