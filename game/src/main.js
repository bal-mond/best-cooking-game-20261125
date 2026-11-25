// main.js — the game loop and boot for Sizzle & Serve.
// One job: start the canvas, run the frame loop, and set up a staged
// screenshot scene when the URL asks for one (?shot=start|play|end).

(function () {
  'use strict';

  var SIZZLE = window.SIZZLE || (window.SIZZLE = {});

  // A seeded RNG for live play so a shift is varied but reproducible.
  var liveRng = SIZZLE.mulberry32((Date.now() % 2147483647) || 1);

  function readShotParam() {
    var params = new URLSearchParams(window.location.search || '');
    var shot = params.get('shot');
    if (shot && SIZZLE.SHOT_QUERIES.indexOf(shot) !== -1) return shot;
    return null;
  }

  function boot() {
    var canvas = document.getElementById('game');
    if (!canvas) return;
    canvas.width = SIZZLE.CANVAS_WIDTH;
    canvas.height = SIZZLE.CANVAS_HEIGHT;
    var ctx = canvas.getContext('2d');

    var shot = readShotParam();
    var state;
    if (shot) {
      // Staged scene: frozen on load, exactly as the screenshot needs it.
      state = SIZZLE.stateApi.buildStagedShot(shot);
    } else {
      state = SIZZLE.stateApi.newGameState();
    }
    SIZZLE.state = state;
    SIZZLE.input.bindInput(canvas, state, liveRng);

    var last = performance.now();
    function frame(now) {
      var dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!state.staged) SIZZLE.stateApi.update(state, dt, liveRng);
      SIZZLE.render.render(ctx, state);
      window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);

    // Marker for automated checks: the staged scene is drawn on first frame.
    if (shot) {
      document.title = 'Sizzle & Serve — shot ' + shot;
      canvas.setAttribute('data-shot', shot);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
