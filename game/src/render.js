// render.js — every pixel of Sizzle & Serve, drawn on one Canvas 2D.
// One job: draw the kitchen, the order board, the food and the overlays.
// No images are loaded anywhere; food, counters and customers are all
// drawn with canvas shapes, so the game needs no network at all.

(function () {
  'use strict';

  var SIZZLE = window.SIZZLE || (window.SIZZLE = {});
  var C = SIZZLE.COLOURS;

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function text(ctx, str, x, y, size, colour, align, weight) {
    ctx.fillStyle = colour || C.ink;
    ctx.font = (weight || 'bold') + ' ' + size + 'px Verdana, sans-serif';
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(str, x, y);
  }

  function formatTime(seconds) {
    var s = Math.max(0, Math.ceil(seconds));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
  }

  // --- Food ------------------------------------------------------------------
  // Each ingredient drawn as a little appetising picture, centred on (cx, cy)
  // inside a circle of radius r. 'form' is raw / chopped / cooked / plain.
  function drawIngredient(ctx, kind, cx, cy, r, form) {
    ctx.save();
    ctx.translate(cx, cy);
    var def = SIZZLE.INGREDIENTS[kind];
    if (kind === 'bun') {
      // Golden dome with sesame seeds over a flat base.
      ctx.fillStyle = def.dark;
      rr(ctx, -r, r * 0.25, r * 2, r * 0.5, r * 0.2); ctx.fill();
      ctx.fillStyle = def.colour;
      ctx.beginPath(); ctx.arc(0, r * 0.2, r * 0.95, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff3cf';
      [[-0.45, -0.45], [0.1, -0.65], [0.5, -0.35], [-0.05, -0.25], [0.42, -0.6]].forEach(function (p) {
        ctx.beginPath(); ctx.ellipse(p[0] * r, p[1] * r, r * 0.09, r * 0.06, 0.4, 0, Math.PI * 2); ctx.fill();
      });
    } else if (kind === 'patty') {
      ctx.fillStyle = form === 'cooked' ? '#6b4423' : '#9c6b43';
      rr(ctx, -r, -r * 0.55, r * 2, r * 1.1, r * 0.45); ctx.fill();
      ctx.fillStyle = form === 'cooked' ? '#4e2f16' : '#7d4f2c';
      [[-0.5, -0.2], [0.3, 0.15], [0.55, -0.25], [-0.1, 0.3]].forEach(function (p) {
        ctx.beginPath(); ctx.arc(p[0] * r, p[1] * r, r * 0.1, 0, Math.PI * 2); ctx.fill();
      });
      if (form === 'cooked') {
        ctx.strokeStyle = 'rgba(255,190,90,0.85)'; ctx.lineWidth = r * 0.08;
        ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.3); ctx.lineTo(r * 0.6, r * 0.25); ctx.stroke();
      }
    } else if (kind === 'tomato') {
      if (form === 'chopped') {
        // Two red half-moons, cut face showing.
        ctx.fillStyle = def.colour;
        ctx.beginPath(); ctx.arc(-r * 0.45, 0, r * 0.55, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(r * 0.45, 0, r * 0.55, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ff8a7a';
        ctx.beginPath(); ctx.arc(-r * 0.45, 0, r * 0.32, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(r * 0.45, 0, r * 0.32, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = def.colour;
        ctx.beginPath(); ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ff6f61';
        ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.3, r * 0.45, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#3a8a2c';
        ctx.beginPath(); ctx.moveTo(0, -r * 0.9); ctx.lineTo(-r * 0.25, -r * 1.15); ctx.lineTo(r * 0.25, -r * 1.15); ctx.closePath(); ctx.fill();
      }
    } else if (kind === 'lettuce') {
      ctx.fillStyle = def.dark;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = def.colour;
      for (var i = 0; i < 5; i++) {
        var a = (i / 5) * Math.PI * 2;
        ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45, r * 0.55, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = '#8fd67e'; ctx.lineWidth = r * 0.1;
      ctx.beginPath(); ctx.moveTo(-r * 0.7, 0); ctx.quadraticCurveTo(0, -r * 0.3, r * 0.7, 0); ctx.stroke();
    } else if (kind === 'cheese') {
      ctx.fillStyle = def.colour;
      ctx.beginPath(); ctx.moveTo(-r, r * 0.6); ctx.lineTo(0, -r); ctx.lineTo(r, r * 0.6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = def.dark;
      [[-0.25, 0.1], [0.3, 0.3], [0.05, -0.35]].forEach(function (p) {
        ctx.beginPath(); ctx.arc(p[0] * r, p[1] * r, r * 0.11, 0, Math.PI * 2); ctx.fill();
      });
    } else if (kind === 'onion') {
      if (form === 'chopped') {
        ctx.strokeStyle = '#e9d5f2'; ctx.lineWidth = r * 0.16;
        for (var j = 0; j < 3; j++) {
          ctx.beginPath(); ctx.arc((j - 1) * r * 0.55, 0, r * 0.5, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.strokeStyle = def.dark; ctx.lineWidth = r * 0.06;
        for (var k = 0; k < 3; k++) {
          ctx.beginPath(); ctx.arc((k - 1) * r * 0.55, 0, r * 0.5, 0, Math.PI * 2); ctx.stroke();
        }
      } else {
        ctx.fillStyle = '#e9d5f2';
        ctx.beginPath(); ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = def.dark; ctx.lineWidth = r * 0.12;
        ctx.beginPath(); ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#7fb069';
        ctx.beginPath(); ctx.moveTo(0, -r * 0.9); ctx.lineTo(-r * 0.2, -r * 1.25); ctx.lineTo(r * 0.2, -r * 1.25); ctx.closePath(); ctx.fill();
      }
    }
    ctx.restore();
  }

  // A finished dish stacked on a plate: bun at the bottom, then each item.
  function drawStackedDish(ctx, items, cx, cy, scale) {
    var s = scale || 1;
    var order = ['bun', 'patty', 'cheese', 'lettuce', 'tomato', 'onion'];
    var sorted = items.slice().sort(function (a, b) { return order.indexOf(a.kind) - order.indexOf(b.kind); });
    var y = cy + 34 * s;
    sorted.forEach(function (it) {
      var h = it.kind === 'bun' ? 26 : 16;
      drawIngredient(ctx, it.kind, cx, y - h / 2, 30 * s, it.form);
      y -= h * s + 2;
    });
    if (sorted.length > 0) {
      // Top bun crowns the stack.
      drawIngredient(ctx, 'bun', cx, y - 6 * s, 30 * s, 'plain');
    }
  }

  // --- Background --------------------------------------------------------------
  function drawBackground(ctx) {
    var W = SIZZLE.CANVAS_WIDTH, H = SIZZLE.CANVAS_HEIGHT;
    // Warm tiled wall up top, chequered floor below.
    ctx.fillStyle = C.wallTop; ctx.fillRect(0, 0, W, 210);
    ctx.fillStyle = 'rgba(180,120,60,0.18)';
    for (var x = 0; x < W; x += 64) ctx.fillRect(x, 196, 2, 14);
    ctx.fillStyle = C.wallBottom; ctx.fillRect(0, 210, W, 12);
    for (var fy = 222; fy < H; fy += 64) {
      for (var fx = 0; fx < W; fx += 64) {
        ctx.fillStyle = ((fx / 64 + fy / 64) % 2 === 0) ? C.floorA : C.floorB;
        ctx.fillRect(fx, fy, 64, 64);
      }
    }
    // A sunny window and a hanging menu board for kitchen character.
    ctx.fillStyle = '#bfe3f2'; rr(ctx, 1050, 8, 200, 60, 10); ctx.fill();
    ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 6; rr(ctx, 1050, 8, 200, 60, 10); ctx.stroke();
    ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(1150, 8); ctx.lineTo(1150, 68); ctx.moveTo(1050, 38); ctx.lineTo(1250, 38); ctx.stroke();
    text(ctx, '☀', 1110, 38, 26, '#f2a007', 'center');
    text(ctx, 'TODAY: FRESH & FAST', 1170, 38, 13, '#5d3413', 'center');
  }

  // --- HUD ----------------------------------------------------------------------
  function drawHud(ctx, state) {
    var L = SIZZLE.LAYOUT.hud;
    ctx.fillStyle = C.hud; ctx.fillRect(L.x, L.y, L.w, L.h);
    ctx.fillStyle = C.accent; ctx.fillRect(0, L.h - 6, L.w, 6);
    text(ctx, '🍳 SIZZLE & SERVE', 28, 38, 30, C.hudText, 'left');
    text(ctx, 'SCORE  ' + state.score, 330, 38, 24, '#ffd166', 'left');
    text(ctx, 'SERVED  ' + state.served, 560, 38, 20, '#9be29b', 'left');
    // The shift timer, big in the middle-right: the clock the player feels.
    var low = state.timeLeft <= 30 && state.screen === 'play';
    var timerColour = low ? '#ff5a4a' : '#ffffff';
    ctx.fillStyle = low ? '#5a130c' : '#3a2a1a';
    rr(ctx, 760, 10, 190, 54, 12); ctx.fill();
    ctx.strokeStyle = low ? '#ff5a4a' : '#ffd166'; ctx.lineWidth = 3;
    rr(ctx, 760, 10, 190, 54, 12); ctx.stroke();
    text(ctx, '⏱ ' + formatTime(state.timeLeft), 855, 39, 30, timerColour, 'center');
    // Combo badge.
    if (state.combo >= 2) {
      ctx.fillStyle = '#ff7a1a';
      rr(ctx, 970, 14, 130, 46, 23); ctx.fill();
      text(ctx, 'COMBO ×' + state.combo, 1035, 38, 22, '#ffffff', 'center');
    } else {
      text(ctx, 'COMBO ×1', 1035, 38, 20, '#c9a582', 'center');
    }
    text(ctx, 'M for sound', 1180, 38, 14, '#c9a582', 'center');
  }

  // --- Order board ---------------------------------------------------------------
  function drawOrderBoard(ctx, state) {
    var L = SIZZLE.LAYOUT.board;
    ctx.fillStyle = C.boardWood; rr(ctx, L.x, L.y, L.w, L.h, 12); ctx.fill();
    ctx.fillStyle = C.boardWoodDark; rr(ctx, L.x + 8, L.y + 8, L.w - 16, L.h - 16, 8); ctx.fill();
    text(ctx, 'ORDER BOARD', L.x + 22, L.y + 26, 18, '#ffd166', 'left');
    text(ctx, 'serve before the bar runs out!', L.x + 22, L.y + 48, 13, '#e8c9a0', 'left');
    text(ctx, '★ rush grows as you serve ★', L.x + 22, L.y + 96, 13, '#ffd166', 'left');

    var tx = L.x + 250;
    var tw = 300, th = L.h - 20, gap = 16;
    state.orders.forEach(function (order, idx) {
      var x = tx + idx * (tw + gap);
      var y = L.y + 10;
      var frac = Math.max(0, order.timeLeft / order.maxTime);
      var barColour = frac > 0.5 ? C.ticketGreen : frac > 0.25 ? C.warn : C.ticketRed;
      ctx.fillStyle = C.boardPaper; rr(ctx, x, y, tw, th, 10); ctx.fill();
      ctx.strokeStyle = order.served ? C.ticketGreen : barColour; ctx.lineWidth = 3;
      rr(ctx, x, y, tw, th, 10); ctx.stroke();
      // Customer face.
      ctx.fillStyle = order.customer.colour;
      ctx.beginPath(); ctx.arc(x + 28, y + 26, 18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = order.customer.skin;
      ctx.beginPath(); ctx.arc(x + 28, y + 28, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2b1a10';
      ctx.beginPath(); ctx.arc(x + 23, y + 26, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 33, y + 26, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 28, y + 33, 4, 0.15, Math.PI - 0.15); ctx.stroke();
      text(ctx, order.customer.name, x + 52, y + 18, 14, '#8a5a2b', 'left');
      text(ctx, order.recipe.name, x + 52, y + 40, 19, C.ink, 'left');
      // What the dish needs, as little food pictures.
      var ix = x + 14;
      order.recipe.items.forEach(function (spec) {
        var parts = spec.split(':');
        drawIngredient(ctx, parts[0], ix + 16, y + 74, 13, parts[1]);
        ix += 34;
      });
      text(ctx, '$' + order.recipe.price, x + tw - 14, y + 40, 17, '#1e8449', 'right');
      // Countdown bar.
      ctx.fillStyle = '#e5d5b8'; rr(ctx, x + 12, y + th - 16, tw - 24, 8, 4); ctx.fill();
      ctx.fillStyle = barColour; rr(ctx, x + 12, y + th - 16, (tw - 24) * frac, 8, 4); ctx.fill();
      if (order.served) {
        // Rubber-stamp across the ticket: the order is done.
        ctx.save();
        ctx.translate(x + tw / 2, y + th / 2 - 4); ctx.rotate(-0.18);
        text(ctx, 'SERVED ✓', 0, 0, 24, 'rgba(30,132,73,0.92)', 'center');
        ctx.restore();
      }
    });
    if (state.orders.length === 0 && state.screen === 'play') {
      text(ctx, 'No tickets — the next customer is on their way…', tx + 20, L.y + L.h / 2, 18, '#e8c9a0', 'left');
    }
    if (state.orders.length === 0 && state.screen === 'start') {
      text(ctx, 'Tickets land here — cook what they ask for!', tx + 20, L.y + L.h / 2, 18, '#e8c9a0', 'left');
    }
  }

  // --- Ingredient counter ---------------------------------------------------------
  function drawBins(ctx, state) {
    var L = SIZZLE.LAYOUT.bins;
    text(ctx, 'INGREDIENT COUNTER — click a bin (or press 1–6) to grab it', L.x + 4, L.y - 10, 13, '#fff3e0', 'left');
    SIZZLE.BIN_ORDER.forEach(function (kind, i) {
      var r = SIZZLE.binRect(i);
      var def = SIZZLE.INGREDIENTS[kind];
      var hover = SIZZLE.hover && SIZZLE.hover.zone === 'bin:' + kind;
      ctx.fillStyle = C.counterFront; rr(ctx, r.x, r.y, r.w, r.h, 12); ctx.fill();
      ctx.fillStyle = C.counterTop; rr(ctx, r.x, r.y, r.w, 26, 12); ctx.fill();
      ctx.fillRect(r.x, r.y + 14, r.w, 12);
      ctx.fillStyle = '#fff8e7'; rr(ctx, r.x + 10, r.y + 36, r.w - 20, r.h - 48, 10); ctx.fill();
      if (hover) { ctx.strokeStyle = C.accent; ctx.lineWidth = 4; rr(ctx, r.x, r.y, r.w, r.h, 12); ctx.stroke(); }
      drawIngredient(ctx, kind, r.x + r.w / 2, r.y + 72, 32, kind === 'patty' ? 'raw' : 'plain');
      text(ctx, def.name, r.x + r.w / 2, r.y + 112, 17, C.ink, 'center');
      ctx.fillStyle = C.hud; rr(ctx, r.x + r.w - 34, r.y + 8, 26, 26, 8); ctx.fill();
      text(ctx, def.key, r.x + r.w - 21, r.y + 22, 15, '#ffe9c4', 'center');
      if (def.chop) text(ctx, 'chop me ✂', r.x + r.w / 2, r.y + 130, 11, '#8a5a2b', 'center');
      if (def.grill) text(ctx, 'grill me 🔥', r.x + r.w / 2, r.y + 130, 11, '#8a5a2b', 'center');
    });
  }

  // --- Stations ---------------------------------------------------------------------
  function drawStations(ctx, state) {
    var L = SIZZLE.LAYOUT.stations;
    var st = SIZZLE.stationRects();
    text(ctx, 'STATIONS — chop, grill, assemble, then ring the bell', L.x + 4, L.y - 10, 13, '#fff3e0', 'left');

    // Chopping board.
    ctx.fillStyle = C.counterFront; rr(ctx, st.chop.x, st.chop.y, st.chop.w, st.chop.h, 12); ctx.fill();
    ctx.fillStyle = '#d9b078'; rr(ctx, st.chop.x + 16, st.chop.y + 46, st.chop.w - 32, st.chop.h - 96, 10); ctx.fill();
    ctx.strokeStyle = '#a87c46'; ctx.lineWidth = 2; rr(ctx, st.chop.x + 16, st.chop.y + 46, st.chop.w - 32, st.chop.h - 96, 10); ctx.stroke();
    text(ctx, '🔪 CHOPPING BOARD', st.chop.x + st.chop.w / 2, st.chop.y + 24, 16, '#ffe9c4', 'center');
    if (state.board) {
      drawIngredient(ctx, state.board.kind, st.chop.x + st.chop.w / 2, st.chop.y + 112, 34, 'raw');
      text(ctx, 'chop!  ' + '✂'.repeat(state.board.chopsLeft), st.chop.x + st.chop.w / 2, st.chop.y + 172, 16, C.ink, 'center');
    } else {
      text(ctx, 'click with veg in hand', st.chop.x + st.chop.w / 2, st.chop.y + 112, 15, '#8a5a2b', 'center');
      text(ctx, 'then click to chop', st.chop.x + st.chop.w / 2, st.chop.y + 136, 15, '#8a5a2b', 'center');
    }

    // Grill.
    ctx.fillStyle = '#3c3c40'; rr(ctx, st.grill.x, st.grill.y, st.grill.w, st.grill.h, 12); ctx.fill();
    ctx.fillStyle = '#222226'; rr(ctx, st.grill.x + 16, st.grill.y + 46, st.grill.w - 32, st.grill.h - 96, 10); ctx.fill();
    ctx.strokeStyle = C.steel; ctx.lineWidth = 3;
    for (var g = 0; g < 5; g++) {
      var gy = st.grill.y + 66 + g * 22;
      ctx.beginPath(); ctx.moveTo(st.grill.x + 26, gy); ctx.lineTo(st.grill.x + st.grill.w - 26, gy); ctx.stroke();
    }
    text(ctx, '🔥 GRILL', st.grill.x + st.grill.w / 2, st.grill.y + 24, 16, '#ffe9c4', 'center');
    if (state.grill) {
      // Flames licking the patty.
      ctx.fillStyle = '#ff7a1a';
      ctx.beginPath(); ctx.moveTo(st.grill.x + st.grill.w / 2 - 44, st.grill.y + 150);
      ctx.quadraticCurveTo(st.grill.x + st.grill.w / 2 - 20, st.grill.y + 100, st.grill.x + st.grill.w / 2, st.grill.y + 138);
      ctx.quadraticCurveTo(st.grill.x + st.grill.w / 2 + 20, st.grill.y + 100, st.grill.x + st.grill.w / 2 + 44, st.grill.y + 150);
      ctx.closePath(); ctx.fill();
      drawIngredient(ctx, 'patty', st.grill.x + st.grill.w / 2, st.grill.y + 122, 34, state.grill.progress >= 1 ? 'cooked' : 'raw');
      ctx.fillStyle = '#e5d5b8'; rr(ctx, st.grill.x + 30, st.grill.y + 168, st.grill.w - 60, 10, 5); ctx.fill();
      ctx.fillStyle = state.grill.progress >= 1 ? C.good : C.accent;
      rr(ctx, st.grill.x + 30, st.grill.y + 168, (st.grill.w - 60) * state.grill.progress, 10, 5); ctx.fill();
      text(ctx, state.grill.progress >= 1 ? 'READY — click to grab!' : 'sizzling…', st.grill.x + st.grill.w / 2, st.grill.y + 190, 14, '#ffe9c4', 'center');
    } else {
      text(ctx, 'click with a raw patty', st.grill.x + st.grill.w / 2, st.grill.y + 112, 15, '#c9a582', 'center');
      text(ctx, 'to start it sizzling', st.grill.x + st.grill.w / 2, st.grill.y + 136, 15, '#c9a582', 'center');
    }

    // Assembly plate — the dish grows here, layer by layer.
    ctx.fillStyle = C.counterFront; rr(ctx, st.plate.x, st.plate.y, st.plate.w, st.plate.h, 12); ctx.fill();
    text(ctx, '🍽 ASSEMBLY PLATE', st.plate.x + st.plate.w / 2, st.plate.y + 24, 16, '#ffe9c4', 'center');
    var pcx = st.plate.x + st.plate.w / 2, pcy = st.plate.y + 132;
    ctx.fillStyle = C.plateWhite;
    ctx.beginPath(); ctx.ellipse(pcx, pcy + 34, 108, 26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d8cfc0'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(pcx, pcy + 34, 108, 26, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(pcx, pcy + 30, 84, 18, 0, 0, Math.PI * 2); ctx.stroke();
    if (state.plate.length > 0) {
      // A tall stack shrinks so it never climbs over the station's heading.
      var dishScale = state.plate.length > 3 ? 0.65 : 1;
      drawStackedDish(ctx, state.plate, pcx, pcy - 20, dishScale);
      text(ctx, state.plate.length + ' layer' + (state.plate.length > 1 ? 's' : '') + ' on the plate', pcx, st.plate.y + 196, 14, '#ffe9c4', 'center');
    } else {
      text(ctx, 'click with food in hand', pcx, pcy - 6, 15, '#8a5a2b', 'center');
      text(ctx, 'to build the dish', pcx, pcy + 18, 15, '#8a5a2b', 'center');
    }

    // Serve bell.
    var ready = state.plate.length > 0;
    ctx.fillStyle = ready ? '#a83226' : C.counterFront; rr(ctx, st.serve.x, st.serve.y, st.serve.w, st.serve.h, 12); ctx.fill();
    text(ctx, '🔔 SERVE!', st.serve.x + st.serve.w / 2, st.serve.y + 24, 16, '#ffe9c4', 'center');
    var bcx = st.serve.x + st.serve.w / 2, bcy = st.serve.y + 118;
    ctx.fillStyle = '#3a2a1a'; rr(ctx, bcx - 62, bcy + 34, 124, 12, 6); ctx.fill();
    ctx.fillStyle = '#f7c948';
    ctx.beginPath(); ctx.arc(bcx, bcy + 10, 52, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d9a41f'; ctx.beginPath(); ctx.arc(bcx, bcy - 42, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.ellipse(bcx - 20, bcy - 12, 12, 20, -0.5, 0, Math.PI * 2); ctx.fill();
    if (ready) {
      // The green banner (drawn by drawServeFlash) takes this line's place.
    } else {
      text(ctx, 'ring when a dish matches', bcx, st.serve.y + 182, 14, '#c9a582', 'center');
      text(ctx, 'an order ticket', bcx, st.serve.y + 202, 14, '#c9a582', 'center');
    }
  }

  // --- Bottom bar -------------------------------------------------------------------
  function drawBottom(ctx, state) {
    var L = SIZZLE.LAYOUT.bottom;
    ctx.fillStyle = 'rgba(46,29,18,0.92)'; rr(ctx, L.x, L.y, L.w, L.h, 12); ctx.fill();
    // In-hand tray.
    ctx.fillStyle = '#fff8e7'; rr(ctx, L.x + 16, L.y + 16, 300, L.h - 32, 10); ctx.fill();
    text(ctx, 'IN HAND', L.x + 36, L.y + 34, 13, '#8a5a2b', 'left');
    if (state.hand) {
      drawIngredient(ctx, state.hand.kind, L.x + 76, L.y + 84, 30, state.hand.form);
      var label = SIZZLE.INGREDIENTS[state.hand.kind].name + ' — ' + state.hand.form;
      text(ctx, label, L.x + 122, L.y + 84, 15, C.ink, 'left');
    } else {
      text(ctx, 'empty hands', L.x + 122, L.y + 84, 15, '#8a5a2b', 'left');
    }
    // Message toast.
    if (state.message && state.messageTimer > 0) {
      var colour = state.messageKind === 'good' ? '#9be29b' : state.messageKind === 'bad' ? '#ff9a8a' : '#ffe9c4';
      text(ctx, state.message, L.x + 360, L.y + 40, 20, colour, 'left');
    }
    text(ctx, 'How to play:  1–6 grab  •  C chop  •  G grill  •  Space add to plate  •  Enter / bell serves  •  B bin', L.x + 360, L.y + 78, 15, '#c9a582', 'left');
    text(ctx, 'Match the ticket exactly, beat its timer, and keep the combo alive for bonus coins.', L.x + 360, L.y + 104, 15, '#c9a582', 'left');
    // Served / missed tally on the right.
    text(ctx, 'SERVED ' + state.served + '   •   MISSED ' + state.missed, L.x + L.w - 24, L.y + 40, 18, '#ffe9c4', 'right');
    text(ctx, 'BEST COMBO ×' + state.bestCombo, L.x + L.w - 24, L.y + 70, 15, '#ffd166', 'right');
  }

  // --- Overlays -----------------------------------------------------------------------
  function drawStartOverlay(ctx, state) {
    ctx.fillStyle = 'rgba(30,16,8,0.55)'; ctx.fillRect(0, 0, SIZZLE.CANVAS_WIDTH, SIZZLE.CANVAS_HEIGHT);
    var w = 720, h = 380, x = (SIZZLE.CANVAS_WIDTH - w) / 2, y = 220;
    ctx.fillStyle = '#fff8e7'; rr(ctx, x, y, w, h, 20); ctx.fill();
    ctx.strokeStyle = C.accent; ctx.lineWidth = 6; rr(ctx, x, y, w, h, 20); ctx.stroke();
    text(ctx, '🍳 SIZZLE & SERVE 🍔', 640, y + 56, 44, C.accentDark, 'center');
    text(ctx, 'The 3-minute kitchen rush — cook every ticket before its timer runs out!', 640, y + 106, 19, C.ink, 'center');
    text(ctx, '1  Grab ingredients from the counter', 640, y + 152, 20, C.ink, 'center');
    text(ctx, '2  Chop veg on the board, grill patties on the grill', 640, y + 184, 20, C.ink, 'center');
    text(ctx, '3  Stack the dish on the plate, ring the bell to serve', 640, y + 216, 20, C.ink, 'center');
    text(ctx, 'Fast serves and combos earn bonus coins. Good luck, chef!', 640, y + 250, 17, '#8a5a2b', 'center');
    ctx.fillStyle = C.accent; rr(ctx, 640 - 190, y + 282, 380, 62, 14); ctx.fill();
    text(ctx, '▶  CLICK TO START COOKING', 640, y + 314, 24, '#ffffff', 'center');
    text(ctx, 'mouse + keyboard  •  no downloads, plays offline', 640, y + 366, 13, '#8a5a2b', 'center');
  }

  function drawGameOverOverlay(ctx, state) {
    ctx.fillStyle = 'rgba(30,16,8,0.6)'; ctx.fillRect(0, 0, SIZZLE.CANVAS_WIDTH, SIZZLE.CANVAS_HEIGHT);
    var w = 680, h = 380, x = (SIZZLE.CANVAS_WIDTH - w) / 2, y = 190;
    ctx.fillStyle = '#fff8e7'; rr(ctx, x, y, w, h, 20); ctx.fill();
    ctx.strokeStyle = C.accent; ctx.lineWidth = 6; rr(ctx, x, y, w, h, 20); ctx.stroke();
    text(ctx, '⏰ SHIFT OVER!', 640, y + 60, 42, C.accentDark, 'center');
    text(ctx, 'FINAL SCORE  ' + state.score, 640, y + 128, 30, C.ink, 'center');
    text(ctx, 'Dishes served: ' + state.served + '    •    Missed: ' + state.missed, 640, y + 178, 20, C.ink, 'center');
    text(ctx, 'Best combo: ×' + state.bestCombo, 640, y + 212, 20, C.ink, 'center');
    var verdict = state.score >= 800 ? 'Head-chef material! 🏆' : state.score >= 400 ? 'Solid shift, chef!' : 'The kitchen humbled you — go again!';
    text(ctx, verdict, 640, y + 250, 18, '#8a5a2b', 'center');
    ctx.fillStyle = C.accent; rr(ctx, 640 - 170, y + 286, 340, 56, 14); ctx.fill();
    text(ctx, '▶  PLAY AGAIN  (click or R)', 640, y + 315, 22, '#ffffff', 'center');
  }

  // "PLATE READY!" flash banner, tucked at the foot of the serve station
  // so it never covers another station's heading.
  function drawServeFlash(ctx, state) {
    if (state.flashServe <= 0 || state.plate.length === 0) return;
    var st = SIZZLE.stationRects().serve;
    ctx.save();
    ctx.translate(st.x + st.w / 2, st.y + st.h - 26);
    ctx.fillStyle = C.good; rr(ctx, -118, -20, 236, 40, 12); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; rr(ctx, -118, -20, 236, 40, 12); ctx.stroke();
    text(ctx, '★ PLATE READY! ★', 0, 1, 19, '#ffffff', 'center');
    ctx.restore();
  }

  function render(ctx, state) {
    drawBackground(ctx);
    drawHud(ctx, state);
    drawOrderBoard(ctx, state);
    drawBins(ctx, state);
    drawStations(ctx, state);
    drawBottom(ctx, state);
    drawServeFlash(ctx, state);
    if (state.screen === 'start') drawStartOverlay(ctx, state);
    if (state.screen === 'over') drawGameOverOverlay(ctx, state);
  }

  SIZZLE.render = {
    render: render,
    drawIngredient: drawIngredient,
    drawStackedDish: drawStackedDish,
    formatTime: formatTime,
  };
})();
