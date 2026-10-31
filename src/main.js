import './style.css';
import { Game } from './game/Game.js';

const canvas = document.querySelector('#game-canvas');
const root = document.querySelector('#ui-root');

try {
  const game = new Game({ canvas, root });
  window.parcelPanic = game;
} catch (error) {
  console.error('Parcel Panic failed to initialise:', error);
  root.innerHTML = '<div class="fatal-error"><div class="fatal-card"><span class="eyebrow">PARCEL PANIC</span><h1>Something went wrong.</h1><p>The game could not start. Refresh the page to try again.</p><pre></pre></div></div>';
  const pre = root.querySelector('pre');
  if (pre) pre.textContent = error && error.message ? error.message : String(error);
}