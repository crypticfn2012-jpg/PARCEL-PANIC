# PARCEL PANIC

**Steal. Deliver. Survive.**

A stylised 3D browser delivery party game built with Three.js, JavaScript and Vite.

## Run locally

Requires Node.js 20+.

    npm install
    npm run dev

Vite prints the local development URL when the server starts.

## Production build

    npm run build
    npm run preview

The production site is generated in the dist folder.

## Controls

| Input | Action |
| --- | --- |
| WASD / touch stick | Move |
| Mouse / touch swipe on the right side | Rotate the third-person camera |
| Space / Jump button | Jump |
| Shift / Run button | Sprint |
| E / Pick button | Pick up a parcel or steal from a nearby runner |
| Q / Throw button | Throw a carried parcel |
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
- Keyboard/mouse controls and mobile touch joystick, camera swipe and action buttons.
- GitHub Actions workflow for a Vite build and GitHub Pages deployment.

**Important:** the current runners are local AI opponents. This milestone is not online multiplayer and does not represent bots as real people.

## Next milestones

1. Authoritative multiplayer server, matchmaking, reconnect handling and server-validated scoring.
2. Additional game modes, maps, obstacles and match events.
3. Player identity, persistent accounts, XP, coins and statistics.
4. Locker, cosmetic inventory, shop, achievements and Battle Pass.
5. Daily rewards, playtime rewards, streaks and challenges.
6. Parties, friends, leaderboards and ranked matchmaking.
7. CrazyGames SDK integration, platform lifecycle handling and full QA.

## GitHub Pages

The workflow in .github/workflows/pages.yml runs a production build on every push to main. To publish, first enable Pages in repository settings and set **Pages → Build and deployment → Source** to **GitHub Actions**. Then open **Actions → Deploy Parcel Panic to GitHub Pages → Run workflow**. The deploy job is intentionally manual until Pages has been enabled. The configured Vite base path is /PARCEL-PANIC/.

## Project structure

- **src/game/Game.js**: match lifecycle, camera, input orchestration and scoring loop.
- **src/game/World.js**: Neon Depot scene, lighting, geometry, hazards and collision.
- **src/game/Runner.js**: player and AI runner movement/character models.
- **src/game/ParcelManager.js**: parcel tiers, ownership, pickup, stealing, throwing and delivery.
- **src/game/Input.js**: keyboard, pointer-lock input and mobile touch controls.
- **src/game/Audio.js**: lightweight Web Audio feedback.
- **src/ui/UI.js**: menus, HUD, pause, help and results.
- **src/style.css**: responsive game interface.
