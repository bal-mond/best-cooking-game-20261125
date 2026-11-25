// Sizzle & Serve — the hand-in program for best-cooking-game-20261125-0137.
// Node 22, standard library only. It gathers the game and its screenshots
// from beside this file into the output directory and writes dossier.json
// with the vendored make.fun library, exactly as the kit asks.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// In the grader's container MAKEFUN_OUTPUT_DIR is unset and /output is used.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Start from a clean output directory so a stale file can never leak in.
// The output directory itself is NEVER removed: in the grader it is a
// bind-mounted /output, and removing a bind-mount point throws EBUSY
// ("Device or resource busy"), which would abort the run. Only the
// contents are cleared, never the directory itself. That also keeps
// the two grader runs byte-identical: nothing from a previous run
// survives to change the second one.
mkdirSync(outputDir, { recursive: true });
for (const name of readdirSync(outputDir)) {
  rmSync(join(outputDir, name), { recursive: true, force: true });
}

// The playable game: plain static files under game/.
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });

// The screenshots, taken from the game's own code in a browser.
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The dossier the judge reads, built from exactly what was copied above.
// Its caps mirror the gate's own limits, so a game that passes here
// passes the scorer's dossier check too.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
