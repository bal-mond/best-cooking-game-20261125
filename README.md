[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/bal-mond/best-cooking-game-20261125/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/bal-mond/best-cooking-game-20261125/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

# Sizzle & Serve — a 3-minute kitchen rush

A timed cooking game that plays offline in desktop Chrome from static files.
Order tickets land on the board, each with its own countdown. Grab
ingredients from the counter, chop veg on the board, grill patties on the
grill, stack the dish on the assembly plate, and ring the bell to serve
before the ticket expires. Fast serves and combos earn bonus coins, and the
rush steps up as you serve more dishes. One 3-minute shift: serve as many
orders as you can before the clock runs out.

## How to play

- **Mouse:** click an ingredient bin to grab it, click a station to use it,
  click the plate to add food, click the bell to serve.
- **Keyboard:** `1–6` grab ingredients, `C` chop, `G` grill, `Space` add to
  plate, `Enter` serve, `B` bin (throw away), `M` mute, `R` restart.
- A dish must match its ticket exactly — chopped veg, grilled patties, the
  right layers — or the customer walks away.

## How to run it

```sh
node serve.ts        # serves game/ at http://localhost:8080
```

or simply open `game/index.html` in a browser. No build step, no network
requests, no libraries — vanilla JS and Canvas 2D, with WebAudio synth
beeps for sound.

Staged screenshots: `game/index.html?shot=start`, `?shot=play`, `?shot=end`
(seed `&seed=1` is accepted and ignored — the scenes are deterministic).

## Layout

- `game/index.html` — the page and script order
- `game/src/config.js` — recipes, ingredients, tuning, colours, layout
- `game/src/state.js` — orders, timers, score, combos, serving rules
- `game/src/input.js` — mouse and keyboard
- `game/src/render.js` — all canvas drawing (kitchen, food, tickets)
- `game/src/audio.js` — WebAudio synth sounds
- `game/src/main.js` — game loop and boot
- `main.ts` — the make.fun hand-in program (copies `game/` and
  `screenshots/` to `/output` and writes `dossier.json`)
- `screenshots/` — three real renders of the game in a browser
