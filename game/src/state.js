// state.js — the kitchen's live state: orders, timers, score, combos,
// the plate being assembled, the grill and the chopping board.
// One job: hold the game state and the rules that change it.

(function () {
  'use strict';

  var SIZZLE = window.SIZZLE || (window.SIZZLE = {});
  var nextOrderId = 1;

  // A fresh, empty shift.
  function newGameState() {
    return {
      screen: 'start',          // 'start' | 'play' | 'over'
      score: 0,
      served: 0,
      missed: 0,
      combo: 0,
      bestCombo: 0,
      comboTimer: 0,
      timeLeft: SIZZLE.SHIFT_SECONDS,
      spawnTimer: 6,
      orders: [],
      hand: null,               // { kind, form: 'raw'|'chopped'|'cooked'|'plain' } or null
      plate: [],                // items on the assembly plate, same shape as hand
      grill: null,              // { kind:'patty', progress: 0..1 } while cooking
      board: null,              // { kind, chopsLeft } while chopping
      message: '',
      messageTimer: 0,
      messageKind: 'info',
      flashServe: 0,            // seconds left on the "served!" flash
      lastTickSecond: -1,
      staged: null,             // 'start' | 'play' | 'end' when frozen for a screenshot
    };
  }

  SIZZLE.newGameState = newGameState;

  // --- Orders ----------------------------------------------------------------
  function randomRecipe(rng) {
    var list = SIZZLE.RECIPES;
    return list[Math.floor(rng() * list.length)];
  }

  var CUSTOMERS = [
    { name: 'Maya', colour: '#e74c3c', skin: '#f2c89b' },
    { name: 'Ben',  colour: '#2980b9', skin: '#c98d5f' },
    { name: 'Lia',  colour: '#8e44ad', skin: '#f2c89b' },
    { name: 'Omar', colour: '#16a085', skin: '#8a5a33' },
    { name: 'Rosa', colour: '#d35400', skin: '#e8b88a' },
  ];

  function spawnOrder(state, rng) {
    if (state.orders.length >= SIZZLE.ORDER_MAX_OPEN) return;
    var recipe = randomRecipe(rng);
    // A fresh face for each ticket: avoid two orders from the same customer.
    var free = CUSTOMERS.filter(function (c) {
      return !state.orders.some(function (o) { return o.customer.name === c.name; });
    });
    var pool = free.length ? free : CUSTOMERS;
    var customer = pool[Math.floor(rng() * pool.length)];
    state.orders.push({
      id: nextOrderId++,
      recipe: recipe,
      customer: customer,
      timeLeft: recipe.time,
      maxTime: recipe.time,
      served: false,
    });
  }

  // --- Serving ----------------------------------------------------------------
  // Does the plate hold exactly the items an open order asks for?
  function plateMatchesOrder(plate, recipe) {
    var want = recipe.items.slice().sort();
    var have = plate.map(function (it) { return it.kind + ':' + it.form; }).sort();
    if (want.length !== have.length) return false;
    for (var i = 0; i < want.length; i++) if (want[i] !== have[i]) return false;
    return true;
  }

  // Try to serve the plate at the bell. Returns 'served' | 'wrong' | 'empty'.
  function servePlate(state) {
    if (state.plate.length === 0) return 'empty';
    for (var i = 0; i < state.orders.length; i++) {
      var order = state.orders[i];
      if (plateMatchesOrder(state.plate, order.recipe)) {
        var timeBonus = Math.round(order.timeLeft) * SIZZLE.SERVE_BONUS_PER_SECOND;
        var comboBonus = state.combo * 10;
        var earned = order.recipe.price + timeBonus + comboBonus;
        state.score += earned;
        state.served++;
        state.combo++;
        if (state.combo > state.bestCombo) state.bestCombo = state.combo;
        state.comboTimer = SIZZLE.COMBO_WINDOW;
        state.orders.splice(i, 1);
        state.plate = [];
        state.flashServe = 1.2;
        setMessage(state, '+' + earned + '  ' + order.recipe.name + ' served!', 'good');
        return 'served';
      }
    }
    state.combo = 0;
    setMessage(state, 'No order wants this dish — check the tickets!', 'bad');
    return 'wrong';
  }

  // --- Messages ---------------------------------------------------------------
  function setMessage(state, text, kind) {
    state.message = text;
    state.messageKind = kind || 'info';
    state.messageTimer = 2.6;
  }
  SIZZLE.setMessage = setMessage;

  // --- Picking up, chopping, grilling, plating -------------------------------
  function finishedForm(kind) {
    var def = SIZZLE.INGREDIENTS[kind];
    if (def.grill) return 'cooked';
    if (def.chop) return 'chopped';
    return 'plain';
  }
  SIZZLE.finishedForm = finishedForm;

  // Grab an ingredient from its bin into the hand (hand must be empty).
  function grabIngredient(state, kind) {
    if (state.hand) { setMessage(state, 'Hands full — place it somewhere first!', 'warn'); return false; }
    state.hand = { kind: kind, form: 'raw' };
    return true;
  }

  // Put the carried item on the chopping board and start chopping it.
  function startChopping(state) {
    var hand = state.hand;
    if (!hand || !SIZZLE.INGREDIENTS[hand.kind].chop || hand.form !== 'raw') return false;
    if (state.board) return false;
    state.board = { kind: hand.kind, chopsLeft: SIZZLE.CHOP_CLICKS };
    state.hand = null;
    return true;
  }

  // One chop on the board; when done the chopped item returns to the hand.
  function chopOnce(state) {
    if (!state.board) return false;
    state.board.chopsLeft--;
    if (state.board.chopsLeft <= 0) {
      state.hand = { kind: state.board.kind, form: 'chopped' };
      state.board = null;
      return 'done';
    }
    return 'chopping';
  }

  // Put a raw patty on the grill.
  function startGrilling(state) {
    var hand = state.hand;
    if (!hand || hand.kind !== 'patty' || hand.form !== 'raw') return false;
    if (state.grill) return false;
    state.grill = { kind: 'patty', progress: 0 };
    state.hand = null;
    return true;
  }

  // Take a finished patty off the grill into the hand.
  function takeFromGrill(state) {
    if (!state.grill || state.grill.progress < 1) return false;
    if (state.hand) return false;
    state.hand = { kind: 'patty', form: 'cooked' };
    state.grill = null;
    return true;
  }

  // Add the carried item to the assembly plate.
  function addToPlate(state) {
    if (!state.hand) return false;
    if (state.hand.form === 'raw' && SIZZLE.INGREDIENTS[state.hand.kind].chop) {
      setMessage(state, 'Chop it first on the board!', 'warn');
      return false;
    }
    if (state.hand.form === 'raw' && state.hand.kind === 'patty') {
      setMessage(state, 'Grill the patty first!', 'warn');
      return false;
    }
    state.plate.push(state.hand);
    state.hand = null;
    return true;
  }

  // Drop the carried item (or the plate) in the bin.
  function trashHand(state) {
    if (state.hand) { state.hand = null; return true; }
    if (state.plate.length) { state.plate = []; setMessage(state, 'Plate cleared.', 'info'); return true; }
    return false;
  }

  // --- Per-frame update --------------------------------------------------------
  function update(state, dt, rng) {
    if (state.screen !== 'play' || state.staged) return;
    state.timeLeft -= dt;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      state.screen = 'over';
      SIZZLE.audio.gameOver();
      return;
    }
    var whole = Math.ceil(state.timeLeft);
    if (whole !== state.lastTickSecond) {
      state.lastTickSecond = whole;
      if (whole <= 10) SIZZLE.audio.tick();
    }
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) state.combo = 0;
    }
    if (state.messageTimer > 0) state.messageTimer -= dt;
    if (state.flashServe > 0) state.flashServe -= dt;

    // Grill cooks while a patty sits on it.
    if (state.grill && state.grill.progress < 1) {
      state.grill.progress += dt / SIZZLE.GRILL_SECONDS;
      if (state.grill.progress >= 1) {
        state.grill.progress = 1;
        SIZZLE.audio.ding();
        setMessage(state, 'Patty ready — grab it off the grill!', 'good');
      }
    }

    // Tickets count down; an expired ticket is a missed order.
    for (var i = state.orders.length - 1; i >= 0; i--) {
      var order = state.orders[i];
      order.timeLeft -= dt;
      if (order.timeLeft <= 0) {
        state.orders.splice(i, 1);
        state.missed++;
        state.combo = 0;
        setMessage(state, 'Order expired — ' + order.customer.name + ' walked away!', 'bad');
        SIZZLE.audio.wrong();
      }
    }

    // New tickets arrive faster as the shift's rush builds.
    var rush = Math.floor(state.served / SIZZLE.RUSH_AFTER_SERVED);
    var gap = Math.max(SIZZLE.ORDER_SPAWN_MIN, SIZZLE.ORDER_SPAWN_EVERY - rush * 2);
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnOrder(state, rng);
      state.spawnTimer = gap;
    }
  }

  function startShift(state, rng) {
    var fresh = newGameState();
    fresh.screen = 'play';
    state.screen = fresh.screen;
    state.score = 0; state.served = 0; state.missed = 0;
    state.combo = 0; state.bestCombo = 0; state.comboTimer = 0;
    state.timeLeft = SIZZLE.SHIFT_SECONDS;
    state.spawnTimer = 6;
    state.orders = []; state.hand = null; state.plate = [];
    state.grill = null; state.board = null;
    state.message = 'First tickets are in — grab ingredients!';
    state.messageKind = 'info'; state.messageTimer = 3;
    spawnOrder(state, rng);
    spawnOrder(state, rng);
  }

  // --- Staged screenshot scenes ------------------------------------------------
  // Frozen, deterministic scenes for ?shot=start|play|end. They render the
  // moment a screenshot needs and never advance, so every run looks the same.
  function buildStagedShot(name) {
    var state = newGameState();
    state.staged = name;
    var rng = SIZZLE.mulberry32(20261125);
    if (name === 'start') {
      state.screen = 'start';
      state.timeLeft = SIZZLE.SHIFT_SECONDS;
      state.score = 0;
      spawnOrder(state, rng);
      spawnOrder(state, rng);
      return state;
    }
    if (name === 'play') {
      state.screen = 'play';
      state.timeLeft = 84;                 // 01:24 on the clock
      state.score = 340;
      state.served = 3;
      state.combo = 3;
      state.bestCombo = 3;
      state.comboTimer = 8;
      spawnOrder(state, rng);
      spawnOrder(state, rng);
      spawnOrder(state, rng);
      // A patty sizzling on the grill, veg half-chopped on the board…
      state.grill = { kind: 'patty', progress: 0.55 };
      state.board = { kind: 'tomato', chopsLeft: 1 };
      // …and a burger mid-assembly on the plate: bun, patty, lettuce so far.
      state.plate = [
        { kind: 'bun', form: 'plain' },
        { kind: 'patty', form: 'cooked' },
        { kind: 'lettuce', form: 'chopped' },
      ];
      state.hand = { kind: 'tomato', form: 'chopped' };
      state.message = 'Add the tomato, then ring the bell!';
      state.messageKind = 'info';
      state.messageTimer = 99;
      return state;
    }
    // 'end': the shift's highlight — a finished plate ready to serve.
    state.screen = 'play';
    state.timeLeft = 42;                   // 00:42 left, rush is on
    state.score = 620;
    state.served = 5;
    state.combo = 4;
    state.bestCombo = 4;
    state.comboTimer = 6;
    spawnOrder(state, rng);
    state.orders[0].served = true;         // the just-served ticket, stamped
    spawnOrder(state, rng);
    state.plate = [
      { kind: 'bun', form: 'plain' },
      { kind: 'patty', form: 'cooked' },
      { kind: 'cheese', form: 'plain' },
      { kind: 'lettuce', form: 'chopped' },
      { kind: 'tomato', form: 'chopped' },
    ];
    state.flashServe = 99;                 // keep the "PLATE READY!" banner up
    state.message = 'Plate ready — ring the bell to serve!';
    state.messageKind = 'good';
    state.messageTimer = 99;
    return state;
  }

  SIZZLE.stateApi = {
    newGameState: newGameState,
    spawnOrder: spawnOrder,
    servePlate: servePlate,
    grabIngredient: grabIngredient,
    startChopping: startChopping,
    chopOnce: chopOnce,
    startGrilling: startGrilling,
    takeFromGrill: takeFromGrill,
    addToPlate: addToPlate,
    trashHand: trashHand,
    update: update,
    startShift: startShift,
    buildStagedShot: buildStagedShot,
    plateMatchesOrder: plateMatchesOrder,
  };
})();
