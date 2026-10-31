# PARCEL PANIC

**Steal. Deliver. Survive.**

A stylised 3D browser delivery party game built with Three.js, JavaScript and Vite.

## Run locally

Requires Node.js 20+.

\`\`\`bash
npm install
npm run dev
\`\`\`

Vite prints the local development URL when the server starts.

## Production build

\`\`\`bash
npm run build
npm run preview
\`\`\`

The production site is generated in \`dist/\`.

## Controls

| Input | Action |
| --- | --- |
| WASD | Move |
| Mouse | Rotate the third-person camera (click the game canvas to capture the mouse) |
| Space | Jump |
| Shift | Sprint |
| E | Pick up a parcel or steal from a nearby runner |
| Q | Throw a carried parcel |
| C / Ctrl | Slide |
| Escape | Pause / resume |

## Current milestone

### Milestone 1 — playable core
- Three-dimensional Neon Depot arena with city surroundings, obstacles, a delivery zone and boost pads.
- Third-person player movement, jumping, sprinting, sliding, camera look and collision handling.
- Five local AI runners with parcel-seeking and delivery behaviour.
- Common, rare, epic, golden and diamond parcels with different values and carrying penalties.
- Pickup, stealing, throwing, dropping, delivery scoring, a three-minute match and results leaderboard.
- Responsive HUD, pause/results screens, sound effects and fullscreen toggle.
- GitHub Actions workflow for a Vite build and GitHub Pages deployment.

**Important:** the current runners are local AI opponents. This milestone is not online multiplayer and does not represent bots as real people.

## Next milestones

1. Authoritative multiplayer server, matchmaking, reconnect handling and server-validated scoring.
2. Additional game modes, maps, obstacles and match events.
3. Player identity, persistent accounts, XP, coins and statistics.
4. Locker, cosmetic inventory, shop, achievements and Battle Pass.
5. Daily rewards, playtime rewards, streaks and challenges.
6. Parties, friends, leaderboards and ranked matchmaking.
7. CrazyGames SDK integration, platform lifecycle handling, mobile controls and full QA.

## GitHub Pages

The workflow in \`.github/workflows/pages.yml\` builds the project on pushes to \`main\` and deploys the \`dist\` folder. In repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**. The configured Vite base path is \`/PARCEL-PANIC/\`.

## Project structure

- \`src/game/Game.js\`: match lifecycle, camera, input orchestration and scoring loop.
- \`src/game/World.js\`: Neon Depot scene, lighting, geometry, hazards and collision.
- \`src/game/Runner.js\`: player and AI runner movement/character models.
- \`src/game/ParcelManager.js\`: parcel tiers, ownership, pickup, stealing, throwing and delivery.
- \`src/game/Input.js\`: keyboard and pointer-lock input.
- \`src/game/Audio.js\`: lightweight Web Audio feedback.
- \`src/ui/UI.js\`: menus, HUD, pause, help and results.
- \`src/style.css\`: responsive game interface.
