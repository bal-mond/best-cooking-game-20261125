// input.js — mouse and keyboard for Sizzle & Serve.
// One job: turn clicks and key presses into kitchen actions.
// Hit zones come from config.js so input and rendering always agree.

(function () {
  'use strict';

  var SIZZLE = window.SIZZLE || (window.SIZZLE = {});

  function inside(rect, x, y) {
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
  }

  // Where did this click land? Returns a zone name or null.
  function zoneAt(x, y) {
    var L = SIZZLE.LAYOUT;
    if (inside(L.hud, x, y)) return 'hud';
    if (inside(L.board, x, y)) return 'board';
    for (var i = 0; i < SIZZLE.BIN_ORDER.length; i++) {
      if (inside(SIZZLE.binRect(i), x, y)) return 'bin:' + SIZZLE.BIN_ORDER[i];
    }
    var st = SIZZLE.stationRects();
    if (inside(st.chop, x, y)) return 'chop';
    if (inside(st.grill, x, y)) return 'grill';
    if (inside(st.plate, x, y)) return 'plate';
    if (inside(st.serve, x, y)) return 'serve';
    if (inside(L.bottom, x, y)) return 'bottom';
    return null;
  }

  // Carry out one click on a zone. Returns true when something happened.
  function handleClick(state, rng, x, y) {
    var zone = zoneAt(x, y);
    var api = SIZZLE.stateApi;
    var audio = SIZZLE.audio;

    if (state.screen === 'start') {
      api.startShift(state, rng);
      audio.ding();
      return true;
    }
    if (state.screen === 'over') {
      api.startShift(state, rng);
      audio.ding();
      return true;
    }
    if (!zone) return false;

    if (zone.indexOf('bin:') === 0) {
      var kind = zone.slice(4);
      if (api.grabIngredient(state, kind)) { audio.pick(); return true; }
      return false;
    }
    if (zone === 'chop') {
      if (state.board) {
        var result = api.chopOnce(state);
        audio.chop();
        if (result === 'done') SIZZLE.setMessage(state, 'Chopped! Add it to the plate.', 'good');
        return true;
      }
      if (api.startChopping(state)) { audio.chop(); return true; }
      return false;
    }
    if (zone === 'grill') {
      if (state.grill && state.grill.progress >= 1) {
        if (api.takeFromGrill(state)) { audio.pick(); return true; }
        return false;
      }
      if (api.startGrilling(state)) { audio.sizzle(); return true; }
      return false;
    }
    if (zone === 'plate') {
      if (api.addToPlate(state)) { audio.place(); return true; }
      return false;
    }
    if (zone === 'serve') {
      var outcome = api.servePlate(state);
      if (outcome === 'served') { audio.serve(); return true; }
      if (outcome === 'wrong') { audio.wrong(); return true; }
      return false;
    }
    if (zone === 'bottom') {
      // Clicking the tray area tosses what is in hand; the bin icon clears it.
      if (api.trashHand(state)) { audio.place(); return true; }
      return false;
    }
    return false;
  }

  // Keyboard shortcuts: 1-6 grab ingredients, C chop, G grill, Space plate,
  // Enter serve / start, B bin (trash), M mute, R restart, P pause is unused
  // (the shift is short) — R restarts from the game-over screen.
  function handleKey(state, rng, key) {
    var api = SIZZLE.stateApi;
    var audio = SIZZLE.audio;
    var k = key.toLowerCase();

    if (k === 'm') { audio.toggleMute(); return true; }
    if (state.screen === 'start' && (k === 'enter' || k === ' ')) {
      api.startShift(state, rng); audio.ding(); return true;
    }
    if (state.screen === 'over' && (k === 'r' || k === 'enter' || k === ' ')) {
      api.startShift(state, rng); audio.ding(); return true;
    }
    if (state.screen !== 'play') return false;

    var binIndex = ['1', '2', '3', '4', '5', '6'].indexOf(k);
    if (binIndex !== -1) {
      if (api.grabIngredient(state, SIZZLE.BIN_ORDER[binIndex])) audio.pick();
      return true;
    }
    if (k === 'c') {
      if (state.board) { api.chopOnce(state); audio.chop(); }
      else if (api.startChopping(state)) audio.chop();
      return true;
    }
    if (k === 'g') {
      if (state.grill && state.grill.progress >= 1) { if (api.takeFromGrill(state)) audio.pick(); }
      else if (api.startGrilling(state)) audio.sizzle();
      return true;
    }
    if (k === ' ') {
      if (api.addToPlate(state)) audio.place();
      return true;
    }
    if (k === 'enter') {
      var outcome = api.servePlate(state);
      if (outcome === 'served') audio.serve();
      else if (outcome === 'wrong') audio.wrong();
      return true;
    }
    if (k === 'b' || k === 'backspace' || k === 'delete') {
      if (api.trashHand(state)) audio.place();
      return true;
    }
    return false;
  }

  // Wire the canvas and the keyboard to a state object. Returns a small
  // handle with the canvas coordinate mapper (handy for tests and shots).
  function bindInput(canvas, state, rng) {
    function toCanvas(clientX, clientY) {
      var rect = canvas.getBoundingClientRect();
      return {
        x: (clientX - rect.left) * (SIZZLE.CANVAS_WIDTH / rect.width),
        y: (clientY - rect.top) * (SIZZLE.CANVAS_HEIGHT / rect.height),
      };
    }
    canvas.addEventListener('click', function (event) {
      SIZZLE.audio.unlock();
      var p = toCanvas(event.clientX, event.clientY);
      handleClick(state, rng, p.x, p.y);
    });
    canvas.addEventListener('mousemove', function (event) {
      var p = toCanvas(event.clientX, event.clientY);
      SIZZLE.hover = { x: p.x, y: p.y, zone: zoneAt(p.x, p.y) };
    });
    window.addEventListener('keydown', function (event) {
      if (event.repeat) return;
      SIZZLE.audio.unlock();
      if (handleKey(state, rng, event.key)) event.preventDefault();
    });
    return { zoneAt: zoneAt, handleClick: handleClick, handleKey: handleKey, toCanvas: toCanvas };
  }

  SIZZLE.input = {
    zoneAt: zoneAt,
    handleClick: handleClick,
    handleKey: handleKey,
    bindInput: bindInput,
  };
})();
