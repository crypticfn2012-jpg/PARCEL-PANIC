export class UI {
  constructor(root, handlers) {
    this.root = root;
    this.handlers = handlers;
    this.lastHudUpdate = 0;
    this.root.innerHTML = [
      '<div class="topbar">',
        '<div class="brand-lockup"><div class="brand-mark"><span></span><span></span><span></span></div><div><div class="brand-name">PARCEL<span>PANIC</span></div><div class="brand-tag">STEAL. DELIVER. SURVIVE.</div></div></div>',
        '<div class="topbar-actions"><div class="session-chip"><i></i><span>LOCAL PRACTICE</span></div><button class="icon-button" id="sound-toggle" aria-label="Toggle sound" title="Toggle sound"><span class="sound-glyph">♫</span></button><button class="icon-button" id="fullscreen-button" aria-label="Toggle fullscreen" title="Fullscreen">⛶</button></div>',
      '</div>',
      '<section class="menu-screen" id="menu-screen">',
        '<div class="menu-layout">',
          '<div class="hero-copy">',
            '<div class="eyebrow"><span class="eyebrow-line"></span> THE CITY IS YOURS FOR THE TAKING</div>',
            '<h1>STEAL.<br>DELIVER.<br><em>SURVIVE.</em></h1>',
            '<p class="hero-description">Grab a parcel, dodge the chaos and make the drop. Everyone wants the big score — don’t let them take yours.</p>',
            '<div class="hero-actions"><button class="play-button" id="play-button"><span class="play-icon">▶</span><span><b>START A RUN</b><small>3 MINUTES · QUICK MATCH</small></span><span class="play-arrow">↗</span></button><button class="secondary-button" id="how-button">HOW TO PLAY <span>＋</span></button></div>',
            '<div class="menu-footnote"><span class="footnote-dot"></span> NO DOWNLOAD. JUST DELIVER.</div>',
          '</div>',
          '<aside class="route-card">',
            '<div class="card-head"><div><span class="section-kicker">THE QUICK ROUTE</span><h2>Make it count.</h2></div><span class="route-number">01 — 03</span></div>',
            '<div class="route-step"><div class="step-icon step-package">▦</div><div><b>GRAB A PARCEL</b><p>Find a drop around the depot. Better parcels mean bigger points.</p></div></div>',
            '<div class="route-connector"></div>',
            '<div class="route-step"><div class="step-icon step-run">↗</div><div><b>MAKE THE RUN</b><p>Jump the gaps, hit the boost pads and watch your back.</p></div></div>',
            '<div class="route-connector"></div>',
            '<div class="route-step"><div class="step-icon step-drop">↓</div><div><b>MAKE THE DROP</b><p>Get your parcel into the glowing delivery zone to score.</p></div></div>',
            '<div class="route-footer"><span>FIRST TO THE TOP</span><span class="route-footer-icon">✳</span></div>',
          '</aside>',
          '<aside class="map-stamp"><div class="stamp-top">NOW SERVING</div><div class="stamp-city">NEON<br>DEPOT</div><div class="stamp-line"></div><div class="stamp-bottom"><span>MAP 01</span><span>EST. 2026</span></div></aside>',
        '</div>',
        '<div class="menu-bottom"><div class="controls-preview"><span class="control-label">QUICK CONTROLS</span><span><kbd>WASD</kbd> MOVE</span><span><kbd>SPACE</kbd> JUMP</span><span><kbd>E</kbd> PICK UP / STEAL</span><span><kbd>Q</kbd> THROW</span></div><div class="build-label">EARLY ACCESS BUILD <b>0.1.0</b></div></div>',
      '</section>',
      '<section class="game-hud hidden" id="game-hud">',
        '<div class="hud-top-left"><div class="score-card"><span class="hud-label">YOUR SCORE</span><strong id="hud-score">000</strong><span class="score-caption">POINTS DELIVERED</span></div><div class="carrying-card" id="carrying-card"><span class="carry-dot"></span><div><small>YOUR LOAD</small><b id="carry-name">EMPTY HANDS</b></div><strong id="carry-value">—</strong></div></div>',
        '<div class="match-clock"><span class="clock-label">TIME LEFT</span><strong id="hud-timer">03:00</strong><div class="clock-track"><i id="timer-fill"></i></div></div>',
        '<div class="leaderboard"><div class="leader-head"><span>DEPOT RANKINGS</span><span>PTS</span></div><div id="leader-list"></div></div>',
        '<div class="delivery-indicator"><span class="delivery-pulse"></span><div><small>DROP ZONE</small><b>NEON DEPOT</b></div><span class="delivery-distance" id="delivery-distance">FIND IT</span></div>',
        '<div class="interaction-prompt" id="interaction-prompt"><kbd>E</kbd><span>COLLECT PARCEL</span></div>',
        '<div class="event-toast" id="event-toast"><b id="toast-title">PACKAGE SECURED</b><span id="toast-copy">COMMON · 10 POINTS</span></div>',
        '<div class="hud-controls"><span><kbd>SHIFT</kbd> SPRINT</span><span><kbd>C</kbd> SLIDE</span><span><kbd>Q</kbd> THROW</span><span><kbd>ESC</kbd> PAUSE</span></div>',
      '</section>',
      '<section class="overlay-screen hidden" id="pause-screen"><div class="overlay-card pause-card"><div class="eyebrow">TAKE A BREATHER</div><h2>RUN PAUSED.</h2><p>The parcels aren’t going anywhere. Probably.</p><button class="play-button compact" id="resume-button"><span class="play-icon">▶</span><span><b>BACK TO IT</b><small>RESUME MATCH</small></span></button><button class="secondary-button full-width" id="pause-menu-button">LEAVE MATCH</button></div></section>',
      '<section class="overlay-screen hidden" id="results-screen"><div class="overlay-card results-card"><div class="results-topline"><span class="eyebrow">SHIFT COMPLETE</span><span class="results-stamp">NEON DEPOT · 01</span></div><h2 id="results-title">NICE RUN.</h2><p id="results-subtitle">The depot has a new top runner.</p><div class="results-summary"><div><small>YOUR SCORE</small><strong id="results-score">0</strong></div><div><small>DELIVERIES</small><strong id="results-deliveries">0</strong></div><div><small>PARCELS STOLEN</small><strong id="results-steals">0</strong></div></div><div class="results-rankings" id="results-rankings"></div><div class="results-actions"><button class="play-button compact" id="again-button"><span class="play-icon">↻</span><span><b>RUN IT BACK</b><small>PLAY ANOTHER MATCH</small></span></button><button class="secondary-button" id="results-menu-button">MAIN MENU</button></div></div></section>',
      '<section class="help-popover hidden" id="help-popover"><button class="help-close" id="help-close" aria-label="Close help">×</button><div class="eyebrow">THE DELIVERY PLAYBOOK</div><h2>HOW TO PLAY</h2><div class="help-grid"><div><kbd>W A S D</kbd><b>Move</b></div><div><kbd>MOUSE</kbd><b>Look around</b></div><div><kbd>SPACE</kbd><b>Jump</b></div><div><kbd>SHIFT</kbd><b>Sprint</b></div><div><kbd>E</kbd><b>Pick up or steal</b></div><div><kbd>Q</kbd><b>Throw your parcel</b></div><div><kbd>C</kbd><b>Slide</b></div><div><kbd>ESC</kbd><b>Pause</b></div></div><p>Carry one parcel at a time. Heavier parcels slow you down, but deliver more points. Step inside the glowing NEON DEPOT to score. Tap E near another runner to steal their load.</p><button class="play-button compact" id="help-play-button"><span class="play-icon">▶</span><span><b>GOT IT</b><small>LET’S MAKE THE DROP</small></span></button></section>'
    ].join('');

    this.menu = this.root.querySelector('#menu-screen');
    this.hud = this.root.querySelector('#game-hud');
    this.pauseScreen = this.root.querySelector('#pause-screen');
    this.resultsScreen = this.root.querySelector('#results-screen');
    this.help = this.root.querySelector('#help-popover');
    this.toastTimer = null;
    this.bind();
    this.showMenu();
  }

  bind() {
    this.root.querySelector('#play-button').addEventListener('click', this.handlers.onPlay);
    this.root.querySelector('#again-button').addEventListener('click', this.handlers.onPlay);
    this.root.querySelector('#help-play-button').addEventListener('click', () => {
      this.help.classList.add('hidden');
      this.handlers.onPlay();
    });
    this.root.querySelector('#resume-button').addEventListener('click', this.handlers.onResume);
    this.root.querySelector('#pause-menu-button').addEventListener('click', this.handlers.onMenu);
    this.root.querySelector('#results-menu-button').addEventListener('click', this.handlers.onMenu);
    this.root.querySelector('#how-button').addEventListener('click', () => this.help.classList.remove('hidden'));
    this.root.querySelector('#help-close').addEventListener('click', () => this.help.classList.add('hidden'));
    this.root.querySelector('#sound-toggle').addEventListener('click', this.handlers.onSound);
    this.root.querySelector('#fullscreen-button').addEventListener('click', this.handlers.onFullscreen);
  }

  showMenu() {
    this.menu.classList.remove('hidden');
    this.hud.classList.add('hidden');
    this.pauseScreen.classList.add('hidden');
    this.resultsScreen.classList.add('hidden');
    this.help.classList.add('hidden');
  }
  showGame() {
    this.menu.classList.add('hidden');
    this.hud.classList.remove('hidden');
    this.pauseScreen.classList.add('hidden');
    this.resultsScreen.classList.add('hidden');
    this.help.classList.add('hidden');
  }
  showPause() { this.pauseScreen.classList.remove('hidden'); }
  hidePause() { this.pauseScreen.classList.add('hidden'); }

  showToast(title, copy, type) {
    const toast = this.root.querySelector('#event-toast');
    toast.classList.remove('show', 'good', 'warn');
    this.root.querySelector('#toast-title').textContent = title;
    this.root.querySelector('#toast-copy').textContent = copy;
    if (type) toast.classList.add(type);
    void toast.offsetWidth;
    toast.classList.add('show');
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2100);
  }

  updateHUD(player, runners, remaining, world) {
    const now = performance.now();
    if (now - this.lastHudUpdate < 90) return;
    this.lastHudUpdate = now;
    this.root.querySelector('#hud-score').textContent = String(player.score).padStart(3, '0');
    const minutes = Math.floor(Math.max(0, remaining) / 60);
    const seconds = Math.floor(Math.max(0, remaining) % 60);
    this.root.querySelector('#hud-timer').textContent = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
    this.root.querySelector('#timer-fill').style.width = Math.max(0, remaining / 180 * 100) + '%';

    const carryName = this.root.querySelector('#carry-name');
    const carryValue = this.root.querySelector('#carry-value');
    const carryingCard = this.root.querySelector('#carrying-card');
    if (player.carrying) {
      carryName.textContent = player.carrying.type.label + ' PARCEL';
      carryValue.textContent = '+' + player.carrying.type.value;
      carryingCard.classList.add('has-load');
    } else {
      carryName.textContent = 'EMPTY HANDS';
      carryValue.textContent = '—';
      carryingCard.classList.remove('has-load');
    }

    const ranking = runners.slice().sort((a, b) => b.score - a.score).slice(0, 6);
    this.root.querySelector('#leader-list').innerHTML = ranking.map((runner, index) => {
      const name = runner.isBot ? runner.name : 'YOU';
      return '<div class="leader-row ' + (runner === player ? 'you' : '') + '"><span class="leader-rank">' + String(index + 1).padStart(2, '0') + '</span><span class="leader-name">' + name + (runner.isBot ? '<i>AI</i>' : '<i>YOU</i>') + '</span><strong>' + runner.score + '</strong></div>';
    }).join('');

    const distance = player.position.distanceTo(world.deliveryCenter);
    const delivery = this.root.querySelector('#delivery-distance');
    delivery.textContent = distance < world.deliveryRadius ? 'IN ZONE' : Math.round(distance) + 'M AWAY';
    delivery.classList.toggle('in-zone', distance < world.deliveryRadius);

    const prompt = this.root.querySelector('#interaction-prompt');
    prompt.classList.toggle('carry-active', !!player.carrying);
    prompt.querySelector('span').textContent = player.carrying ? 'Q THROW PARCEL' : 'E COLLECT / STEAL';
  }

  showResults(player, runners) {
    const sorted = runners.slice().sort((a, b) => b.score - a.score);
    const winner = sorted[0];
    this.root.querySelector('#results-title').textContent = winner === player ? 'YOU OWNED THE DEPOT.' : 'SHIFT COMPLETE.';
    this.root.querySelector('#results-subtitle').textContent = winner === player ? 'Clean deliveries. Questionable morals. Great work.' : winner.name + ' topped the board. Run it back and take the crown.';
    this.root.querySelector('#results-score').textContent = player.score;
    this.root.querySelector('#results-deliveries').textContent = player.deliveries;
    this.root.querySelector('#results-steals').textContent = player.steals;
    this.root.querySelector('#results-rankings').innerHTML = sorted.map((runner, index) => {
      return '<div class="result-row ' + (runner === player ? 'you' : '') + '"><span class="result-rank">' + (index + 1) + '</span><b>' + (runner.isBot ? runner.name : 'YOU') + '</b><small>' + runner.deliveries + ' DELIVERIES</small><strong>' + runner.score + '</strong></div>';
    }).join('');
    this.menu.classList.add('hidden');
    this.hud.classList.add('hidden');
    this.pauseScreen.classList.add('hidden');
    this.resultsScreen.classList.remove('hidden');
  }

  setSoundState(enabled) {
    const button = this.root.querySelector('#sound-toggle');
    button.classList.toggle('muted', !enabled);
    button.setAttribute('aria-label', enabled ? 'Mute sound' : 'Enable sound');
  }
}