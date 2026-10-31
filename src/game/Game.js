import * as THREE from 'three';
import { World } from './World.js';
import { Runner } from './Runner.js';
import { ParcelManager } from './ParcelManager.js';
import { Input } from './Input.js';
import { AudioSystem } from './Audio.js';
import { UI } from '../ui/UI.js';

export class Game {
  constructor(options) {
    this.canvas = options.canvas;
    this.root = options.root;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 240);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.audio = new AudioSystem();
    this.world = new World(this.scene);
    this.player = new Runner(this.scene, { name: 'YOU', color: 0xff765d });
    this.bots = [
      new Runner(this.scene, { name: 'ZIP', color: 0x4bd4be, isBot: true }),
      new Runner(this.scene, { name: 'BOXBUD', color: 0xffcf68, isBot: true }),
      new Runner(this.scene, { name: 'TAPE', color: 0x8f7be8, isBot: true }),
      new Runner(this.scene, { name: 'DASH', color: 0x65a9e8, isBot: true }),
      new Runner(this.scene, { name: 'PIP', color: 0xf08fb5, isBot: true })
    ];
    this.runners = [this.player].concat(this.bots);
    this.ui = new UI(this.root, {
      onPlay: () => this.startMatch(),
      onResume: () => this.resumeMatch(),
      onMenu: () => this.returnToMenu(),
      onSound: () => this.toggleSound(),
      onFullscreen: () => this.toggleFullscreen()
    });
    this.input = new Input(this.canvas, () => this.togglePause());
    this.parcels = new ParcelManager(this.scene, this.world, this.audio, (title, copy, type) => this.ui.showToast(title, copy, type));

    this.state = 'menu';
    this.remaining = 180;
    this.cameraYaw = 0;
    this.cameraPitch = 0.43;
    this.cameraTarget = new THREE.Vector3();
    this.cameraDesired = new THREE.Vector3();
    this.menuCameraPosition = new THREE.Vector3(19, 15, 27);
    this.clock = new THREE.Clock();
    this.elapsed = 0;
    this.lastBotDeliveryToast = 0;
    this.resize = this.resize.bind(this);
    this.frame = this.frame.bind(this);
    this.handleVisibility = () => {
      if (document.hidden && this.state === 'playing') this.togglePause();
    };
    window.addEventListener('resize', this.resize);
    document.addEventListener('visibilitychange', this.handleVisibility);
    this.resize();
    this.placeMenuRunners();
    this.updateCamera(0, true);
    this.renderer.setAnimationLoop(this.frame);
  }

  placeMenuRunners() {
    this.player.carrying = null;
    this.player.position.set(0, 0, 0);
    this.player.velocity.set(0, 0, 0);
    this.player.root.rotation.y = -0.4;
    this.bots.forEach((bot, index) => {
      bot.carrying = null;
      bot.position.set(40 + index * 3, -30, 40);
      bot.velocity.set(0, 0, 0);
    });
  }

  resize() {
    const width = Math.max(320, window.innerWidth);
    const height = Math.max(320, window.innerHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  }

  startMatch() {
    this.audio.unlock();
    this.audio.play('click');
    this.state = 'playing';
    this.remaining = 180;
    this.elapsed = 0;
    this.cameraYaw = 0;
    this.cameraPitch = 0.43;
    const matchSpawns = [
      new THREE.Vector3(0, 0, 24),
      new THREE.Vector3(-22, 0, 18),
      new THREE.Vector3(-11, 0, 23),
      new THREE.Vector3(12, 0, 23),
      new THREE.Vector3(23, 0, 16),
      new THREE.Vector3(-20, 0, -8)
    ];
    this.runners.forEach((runner, index) => runner.reset(matchSpawns[index]));
    this.parcels.reset();
    this.input.setEnabled(true);
    this.ui.showGame();
    this.ui.showToast('THE SHIFT IS ON', 'Grab a parcel and make the drop.', 'good');
    this.updateCamera(0, true);
  }

  returnToMenu() {
    this.state = 'menu';
    this.input.setEnabled(false);
    this.parcels.reset();
    this.placeMenuRunners();
    this.ui.showMenu();
  }

  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.input.setEnabled(false);
      this.ui.showPause();
    } else if (this.state === 'paused') {
      this.resumeMatch();
    }
  }

  resumeMatch() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.input.setEnabled(true);
    this.ui.hidePause();
    this.audio.unlock();
  }

  toggleSound() {
    this.audio.setEnabled(!this.audio.enabled);
    this.ui.setSoundState(this.audio.enabled);
    if (this.audio.enabled) this.audio.play('click');
  }

  async toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await this.root.closest('#app').requestFullscreen();
    } catch (error) {
      console.warn('Fullscreen is not available in this browser.', error);
    }
  }

  updateCamera(delta, snap = false) {
    if (this.state === 'menu' || !this.player) {
      this.camera.position.lerp(this.menuCameraPosition, snap ? 1 : Math.min(1, delta * 1.2));
      this.camera.lookAt(0, 1.1, 0);
      return;
    }
    const distance = 10.8;
    const horizontal = Math.cos(this.cameraPitch) * distance;
    const vertical = Math.sin(this.cameraPitch) * distance;
    this.cameraDesired.set(
      this.player.position.x + Math.sin(this.cameraYaw) * horizontal,
      this.player.position.y + vertical + 1.25,
      this.player.position.z + Math.cos(this.cameraYaw) * horizontal
    );
    this.camera.position.lerp(this.cameraDesired, snap ? 1 : Math.min(1, delta * 7.5));
    this.cameraTarget.set(this.player.position.x, this.player.position.y + 1.15, this.player.position.z);
    this.camera.lookAt(this.cameraTarget);
  }

  updateBots(delta) {
    this.bots.forEach((bot) => {
      bot.updateBot(this.parcels, this.world, delta);
      this.world.resolveRunner(bot);
      if (!bot.carrying && bot.botTarget && bot.botTarget.active && bot.botTarget.inWorld) {
        if (bot.position.distanceTo(bot.botTarget.mesh.position) < 1.95) this.parcels.pickUp(bot, bot.botTarget);
      }
      if (this.world.checkJumpPad(bot)) bot.velocity.y = Math.max(bot.velocity.y, 13.5);
    });
  }

  resolveRunnerBumps() {
    for (let i = 0; i < this.runners.length; i++) {
      for (let j = i + 1; j < this.runners.length; j++) {
        const a = this.runners[i];
        const b = this.runners[j];
        const dx = b.position.x - a.position.x;
        const dz = b.position.z - a.position.z;
        const distanceSq = dx * dx + dz * dz;
        if (distanceSq > 0.94 * 0.94 || distanceSq < 0.0001) continue;
        const distance = Math.sqrt(distanceSq);
        const nx = dx / distance;
        const nz = dz / distance;
        const overlap = 0.94 - distance;
        a.position.x -= nx * overlap * 0.5;
        a.position.z -= nz * overlap * 0.5;
        b.position.x += nx * overlap * 0.5;
        b.position.z += nz * overlap * 0.5;
        const playerSprinting = a === this.player && this.input.isDown('shift');
        const botSprinting = b === this.player && this.input.isDown('shift');
        if (playerSprinting && a.velocity.length() > 6) {
          b.knockback(new THREE.Vector3(nx, 0, nz), 4.8);
          if (b.carrying && Math.random() < 0.22) this.parcels.drop(b, new THREE.Vector3(nx, 0, nz), false);
        } else if (botSprinting && b.velocity.length() > 6) {
          a.knockback(new THREE.Vector3(-nx, 0, -nz), 3.8);
        }
      }
    }
  }

  updateMatch(delta) {
    const mouse = this.input.consumeMouse();
    if (this.input.pointerLocked || this.input.touchLookActive) {
      this.cameraYaw -= mouse.x * 0.0025;
      this.cameraPitch = THREE.MathUtils.clamp(this.cameraPitch + mouse.y * 0.0017, 0.28, 0.78);
    }
    this.player.updatePlayer(this.input, this.cameraYaw, delta, this.audio);
    this.world.resolveRunner(this.player);
    if (this.world.checkJumpPad(this.player)) this.audio.play('jump');

    if (this.input.consume('e')) {
      const success = this.parcels.interact(this.player, this.runners);
      if (!success) this.ui.showToast('NOT IN REACH', 'Move closer to a parcel or another runner.', '');
    }
    if (this.input.consume('q') && this.player.carrying) {
      const direction = new THREE.Vector3(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw));
      this.parcels.drop(this.player, direction, true);
      this.audio.play('steal');
      this.ui.showToast('PARCEL THROWN', 'Make sure you get it back.', 'warn');
    }

    this.updateBots(delta);
    this.resolveRunnerBumps();
    this.parcels.update(delta);
    const deliveries = this.parcels.processDeliveries(this.runners);
    deliveries.forEach((delivery) => {
      if (delivery.runner === this.player) {
        this.audio.play('deliver');
        this.ui.showToast('DELIVERY COMPLETE', '+' + delivery.value + ' POINTS · ' + delivery.label, 'good');
      } else if (this.elapsed - this.lastBotDeliveryToast > 4.5) {
        this.lastBotDeliveryToast = this.elapsed;
        this.ui.showToast(delivery.runner.name + ' MADE A DROP', '+' + delivery.value + ' POINTS', '');
      }
    });

    this.remaining -= delta;
    if (this.remaining <= 0) {
      this.remaining = 0;
      this.finishMatch();
      return;
    }
    this.ui.updateHUD(this.player, this.runners, this.remaining, this.world);
  }

  finishMatch() {
    this.state = 'results';
    this.input.setEnabled(false);
    const sorted = this.runners.slice().sort((a, b) => b.score - a.score);
    this.audio.play(sorted[0] === this.player ? 'win' : 'deliver');
    this.ui.showResults(this.player, this.runners);
  }

  frame() {
    const delta = Math.min(this.clock.getDelta(), 0.04);
    this.world.update(delta);
    if (this.state === 'playing') {
      this.elapsed += delta;
      this.updateMatch(delta);
      this.updateCamera(delta);
    } else if (this.state === 'menu') {
      this.elapsed += delta;
      this.player.root.rotation.y = Math.sin(this.elapsed * 0.45) * 0.28;
      this.player.body.position.y = 1.12 + Math.sin(this.elapsed * 1.5) * 0.025;
      this.updateCamera(delta);
    } else if (this.state === 'paused' || this.state === 'results') {
      this.updateCamera(delta);
    }
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this.renderer.setAnimationLoop(null);
    this.input.destroy();
    this.renderer.dispose();
    window.removeEventListener('resize', this.resize);
    document.removeEventListener('visibilitychange', this.handleVisibility);
  }
}