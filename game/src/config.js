// config.js — every tunable value for Sizzle & Serve: recipes, ingredients,
// levels, timings, colours and the kitchen layout. One job: configuration.

(function () {
  'use strict';

  var SIZZLE = window.SIZZLE || (window.SIZZLE = {});

  // Canvas size the whole game is drawn at (scaled to the window by CSS).
  SIZZLE.CANVAS_WIDTH = 1280;
  SIZZLE.CANVAS_HEIGHT = 800;

  // --- Ingredients -----------------------------------------------------------
  // kind: display name, colour, whether it needs chopping, whether it needs
  // the grill, and the keyboard shortcut shown on its bin.
  SIZZLE.INGREDIENTS = {
    bun:     { name: 'Bun',     key: '1', chop: false, grill: false, colour: '#e8a94f', dark: '#b97e2c' },
    patty:   { name: 'Patty',   key: '2', chop: false, grill: true,  colour: '#8a5a33', dark: '#5f3a1d' },
    tomato:  { name: 'Tomato',  key: '3', chop: true,  grill: false, colour: '#e23b2e', dark: '#a82318' },
    lettuce: { name: 'Lettuce', key: '4', chop: true,  grill: false, colour: '#5dbb4a', dark: '#3a8a2c' },
    cheese:  { name: 'Cheese',  key: '5', chop: false, grill: false, colour: '#f7c948', dark: '#d9a41f' },
    onion:   { name: 'Onion',   key: '6', chop: true,  grill: false, colour: '#c9a0dc', dark: '#8e63a8' },
  };
  // The order the ingredient bins sit on the counter, left to right.
  SIZZLE.BIN_ORDER = ['bun', 'patty', 'tomato', 'lettuce', 'cheese', 'onion'];

  // --- Recipes ---------------------------------------------------------------
  // items list the finished form of each ingredient: 'cooked' for a grilled
  // patty, 'chopped' for chopped veg, 'plain' for bun and cheese.
  SIZZLE.RECIPES = [
    { id: 'classic',  name: 'Classic Burger',  items: ['bun', 'patty:cooked', 'lettuce:chopped', 'tomato:chopped'], price: 120, time: 55 },
    { id: 'melt',     name: 'Cheese Melt',     items: ['bun', 'patty:cooked', 'cheese:plain'],                     price: 100, time: 50 },
    { id: 'garden',   name: 'Garden Stack',    items: ['bun', 'lettuce:chopped', 'tomato:chopped', 'onion:chopped', 'cheese:plain'], price: 140, time: 60 },
    { id: 'double',   name: 'Double Trouble',  items: ['bun', 'patty:cooked', 'patty:cooked', 'cheese:plain', 'tomato:chopped'], price: 180, time: 65 },
    { id: 'veggie',   name: 'Veggie Delight',  items: ['bun', 'lettuce:chopped', 'tomato:chopped', 'cheese:plain', 'onion:chopped'], price: 130, time: 55 },
  ];

  // --- Shift / difficulty ----------------------------------------------------
  SIZZLE.SHIFT_SECONDS = 180;          // one shift lasts 3 minutes
  SIZZLE.ORDER_MAX_OPEN = 3;           // tickets on the board at once
  SIZZLE.ORDER_SPAWN_EVERY = 14;       // seconds between new tickets (early)
  SIZZLE.ORDER_SPAWN_MIN = 8;          // fastest spawn gap once the rush builds
  SIZZLE.RUSH_AFTER_SERVED = 4;        // every N served dishes the rush steps up
  SIZZLE.CHOP_CLICKS = 3;              // chops to finish one item on the board
  SIZZLE.GRILL_SECONDS = 4;            // seconds a patty needs on the grill
  SIZZLE.COMBO_WINDOW = 12;            // seconds to keep a combo alive
  SIZZLE.SERVE_BONUS_PER_SECOND = 2;   // coins per second left on a ticket

  // --- Palette ---------------------------------------------------------------
  SIZZLE.COLOURS = {
    wallTop: '#f7e3c2', wallBottom: '#efd3a8', floorA: '#d9a066', floorB: '#c98d52',
    hud: '#2e1d12', hudText: '#ffe9c4', accent: '#ff7a1a', accentDark: '#d95f00',
    boardWood: '#7a4a21', boardWoodDark: '#5d3413', boardPaper: '#fff8e7',
    counterTop: '#8a5a2b', counterFront: '#6e451f', counterEdge: '#4e2f12',
    steel: '#b9c0c7', steelDark: '#8b939c', plateWhite: '#fdfdf6',
    good: '#2fae4e', warn: '#f2a007', bad: '#d92b1f', ink: '#2b1a10',
    ticketRed: '#c0392b', ticketGreen: '#1e8449',
  };

  // --- Kitchen layout (canvas pixels) ----------------------------------------
  // HUD strip, order board, ingredient counter row, station row, bottom bar.
  SIZZLE.LAYOUT = {
    hud:      { x: 0,    y: 0,   w: 1280, h: 74 },
    board:    { x: 24,   y: 86,  w: 1232, h: 122 },
    bins:     { x: 24,   y: 232, w: 1232, h: 150 },
    stations: { x: 24,   y: 406, w: 1232, h: 210 },
    bottom:   { x: 24,   y: 632, w: 1232, h: 144 },
  };

  // Hit zones are derived from the layout so input and rendering agree.
  SIZZLE.binRect = function (index) {
    var L = SIZZLE.LAYOUT.bins;
    var gap = 12, w = (L.w - gap * (SIZZLE.BIN_ORDER.length - 1)) / SIZZLE.BIN_ORDER.length;
    return { x: L.x + index * (w + gap), y: L.y, w: w, h: L.h };
  };
  SIZZLE.stationRects = function () {
    var L = SIZZLE.LAYOUT.stations;
    var gap = 14, w = (L.w - gap * 3) / 4;
    return {
      chop:  { x: L.x,               y: L.y, w: w, h: L.h },
      grill: { x: L.x + (w + gap),   y: L.y, w: w, h: L.h },
      plate: { x: L.x + 2 * (w + gap), y: L.y, w: w, h: L.h },
      serve: { x: L.x + 3 * (w + gap), y: L.y, w: w, h: L.h },
    };
  };

  // --- Staged screenshot states ----------------------------------------------
  // ?shot=start|play|end renders one frozen, deterministic kitchen scene.
  SIZZLE.SHOT_QUERIES = ['start', 'play', 'end'];

  // A tiny deterministic RNG so staged scenes never vary between runs.
  SIZZLE.mulberry32 = function (seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
})();
