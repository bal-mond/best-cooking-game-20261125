// audio.js — tiny WebAudio synth sounds for Sizzle & Serve.
// No audio files: every sound is an oscillator blip made in code.

(function () {
  'use strict';

  var SIZZLE = window.SIZZLE || (window.SIZZLE = {});

  var audioContext = null;
  var muted = false;

  function ensureContext() {
    if (!audioContext) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioContext = new AC();
    }
    if (audioContext.state === 'suspended') audioContext.resume();
    return audioContext;
  }

  // One short tone: frequency, length in seconds, wave shape, volume.
  function blip(freq, seconds, type, volume, when) {
    if (muted) return;
    var ctx = ensureContext();
    if (!ctx) return;
    var t0 = ctx.currentTime + (when || 0);
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(volume || 0.12, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + seconds);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.02);
  }

  // A quick downward slide, used for the "wrong dish" buzz.
  function slideBuzz() {
    if (muted) return;
    var ctx = ensureContext();
    if (!ctx) return;
    var t0 = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, t0);
    osc.frequency.exponentialRampToValueAtTime(70, t0 + 0.25);
    gain.gain.setValueAtTime(0.10, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.3);
  }

  SIZZLE.audio = {
    // Call once from the first user gesture so the browser unlocks sound.
    unlock: function () { ensureContext(); },
    toggleMute: function () { muted = !muted; return muted; },
    isMuted: function () { return muted; },

    pick:    function () { blip(520, 0.07, 'triangle', 0.10); },
    place:   function () { blip(340, 0.08, 'triangle', 0.10); },
    chop:    function () { blip(220, 0.05, 'square', 0.07); blip(180, 0.05, 'square', 0.06, 0.03); },
    sizzle:  function () { blip(880, 0.12, 'sine', 0.06); blip(1174, 0.10, 'sine', 0.05, 0.08); },
    ding:    function () { blip(1046, 0.18, 'sine', 0.12); blip(1568, 0.25, 'sine', 0.08, 0.09); },
    serve:   function () { blip(523, 0.10, 'triangle', 0.12); blip(659, 0.10, 'triangle', 0.12, 0.09); blip(784, 0.18, 'triangle', 0.12, 0.18); },
    wrong:   function () { slideBuzz(); },
    tick:    function () { blip(980, 0.05, 'sine', 0.05); },
    gameOver:function () { blip(392, 0.2, 'triangle', 0.12); blip(311, 0.2, 'triangle', 0.12, 0.18); blip(262, 0.35, 'triangle', 0.12, 0.36); },
  };
})();
