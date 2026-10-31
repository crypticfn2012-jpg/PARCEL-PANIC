export class Input {
  constructor(canvas, onPause) {
    this.canvas = canvas;
    this.onPause = onPause;
    this.keys = new Set();
    this.pressed = new Set();
    this.mouseX = 0;
    this.mouseY = 0;
    this.pointerLocked = false;
    this.touchLookPointer = null;
    this.touchLookActive = false;
    this.touchLast = { x: 0, y: 0 };
    this.touchAxis = { x: 0, y: 0 };
    this.isTouch = !!(navigator.maxTouchPoints > 0 || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches));

    this.handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      if (['w', 'a', 's', 'd', ' ', 'shift', 'e', 'q', 'c', 'control', 'escape'].includes(key)) event.preventDefault();
      if (key === 'escape') {
        if (!event.repeat) this.onPause();
        return;
      }
      if (!this.enabled) return;
      if (!this.keys.has(key)) this.pressed.add(key);
      this.keys.add(key);
    };
    this.handleKeyUp = (event) => this.keys.delete(event.key.toLowerCase());
    this.handleMouseMove = (event) => {
      if (this.pointerLocked) {
        this.mouseX += event.movementX || 0;
        this.mouseY += event.movementY || 0;
      }
    };
    this.handlePointerLock = () => {
      this.pointerLocked = document.pointerLockElement === this.canvas;
    };
    this.handleCanvasClick = () => {
      if (this.enabled && !this.isTouch && !this.pointerLocked && this.canvas.requestPointerLock) {
        try { this.canvas.requestPointerLock(); } catch (error) { /* Pointer lock is optional. */ }
      }
    };
    this.handleTouchLookDown = (event) => {
      if (!this.enabled || event.pointerType !== 'touch' || event.clientX < window.innerWidth * 0.34 || event.clientY > window.innerHeight * 0.78) return;
      this.touchLookPointer = event.pointerId;
      this.touchLookActive = true;
      this.touchLast.x = event.clientX;
      this.touchLast.y = event.clientY;
    };
    this.handleTouchLookMove = (event) => {
      if (this.touchLookPointer !== event.pointerId) return;
      this.mouseX += event.clientX - this.touchLast.x;
      this.mouseY += event.clientY - this.touchLast.y;
      this.touchLast.x = event.clientX;
      this.touchLast.y = event.clientY;
    };
    this.handleTouchLookUp = (event) => {
      if (this.touchLookPointer !== event.pointerId) return;
      this.touchLookPointer = null;
      this.touchLookActive = false;
    };

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('pointermove', this.handleTouchLookMove);
    window.addEventListener('pointerup', this.handleTouchLookUp);
    window.addEventListener('pointercancel', this.handleTouchLookUp);
    document.addEventListener('pointerlockchange', this.handlePointerLock);
    canvas.addEventListener('click', this.handleCanvasClick);
    canvas.addEventListener('pointerdown', this.handleTouchLookDown);
    this.enabled = false;
    this.setupTouchControls();
  }

  setupTouchControls() {
    const zone = document.querySelector('#touch-zone');
    const knob = document.querySelector('#touch-knob');
    if (zone && knob) {
      let pointerId = null;
      let center = { x: 0, y: 0 };
      const radius = 46;
      const updateStick = (event) => {
        if (pointerId !== event.pointerId) return;
        const dx = event.clientX - center.x;
        const dy = event.clientY - center.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const scale = length > radius ? radius / length : 1;
        this.touchAxis.x = Math.max(-1, Math.min(1, dx * scale / radius));
        this.touchAxis.y = Math.max(-1, Math.min(1, dy * scale / radius));
        knob.style.transform = 'translate(' + (this.touchAxis.x * radius) + 'px, ' + (this.touchAxis.y * radius) + 'px)';
      };
      zone.addEventListener('pointerdown', (event) => {
        if (event.pointerType !== 'touch' && this.isTouch) return;
        event.preventDefault();
        pointerId = event.pointerId;
        const rect = zone.getBoundingClientRect();
        center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        if (zone.setPointerCapture) zone.setPointerCapture(pointerId);
        updateStick(event);
      });
      zone.addEventListener('pointermove', updateStick);
      const release = (event) => {
        if (pointerId !== event.pointerId) return;
        pointerId = null;
        this.touchAxis.x = 0;
        this.touchAxis.y = 0;
        knob.style.transform = 'translate(0px, 0px)';
      };
      zone.addEventListener('pointerup', release);
      zone.addEventListener('pointercancel', release);
    }

    const bindButton = (selector, key) => {
      const button = document.querySelector(selector);
      if (!button) return;
      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        if (button.setPointerCapture) button.setPointerCapture(event.pointerId);
        this.keys.add(key);
        this.pressed.add(key);
        button.classList.add('pressed');
      });
      const release = () => {
        this.keys.delete(key);
        button.classList.remove('pressed');
      };
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('lostpointercapture', release);
    };
    bindButton('#touch-jump', ' ');
    bindButton('#touch-sprint', 'shift');
    bindButton('#touch-interact', 'e');
    bindButton('#touch-throw', 'q');
  }

  isDown(key) {
    const value = key.toLowerCase();
    if (this.keys.has(value)) return true;
    if (value === 'w') return this.touchAxis.y < -0.22;
    if (value === 's') return this.touchAxis.y > 0.22;
    if (value === 'a') return this.touchAxis.x < -0.22;
    if (value === 'd') return this.touchAxis.x > 0.22;
    return false;
  }

  consume(key) {
    const value = this.pressed.has(key.toLowerCase());
    this.pressed.delete(key.toLowerCase());
    return value;
  }

  consumeMouse() {
    const value = { x: this.mouseX, y: this.mouseY };
    this.mouseX = 0;
    this.mouseY = 0;
    return value;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.keys.clear();
      this.pressed.clear();
      this.touchAxis.x = 0;
      this.touchAxis.y = 0;
      this.touchLookPointer = null;
      this.touchLookActive = false;
      const knob = document.querySelector('#touch-knob');
      if (knob) knob.style.transform = 'translate(0px, 0px)';
      if (this.pointerLocked && document.exitPointerLock) document.exitPointerLock();
    }
  }

  destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('pointermove', this.handleTouchLookMove);
    window.removeEventListener('pointerup', this.handleTouchLookUp);
    window.removeEventListener('pointercancel', this.handleTouchLookUp);
    document.removeEventListener('pointerlockchange', this.handlePointerLock);
    this.canvas.removeEventListener('click', this.handleCanvasClick);
    this.canvas.removeEventListener('pointerdown', this.handleTouchLookDown);
  }
}