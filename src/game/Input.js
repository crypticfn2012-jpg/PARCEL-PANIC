export class Input {
  constructor(canvas, onPause) {
    this.canvas = canvas;
    this.onPause = onPause;
    this.keys = new Set();
    this.pressed = new Set();
    this.mouseX = 0;
    this.mouseY = 0;
    this.pointerLocked = false;

    this.handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      if (['w', 'a', 's', 'd', ' ', 'shift', 'e', 'q', 'c', 'control', 'escape'].includes(key)) event.preventDefault();
      if (!this.keys.has(key)) this.pressed.add(key);
      this.keys.add(key);
      if (key === 'escape') this.onPause();
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
      if (this.enabled && !this.pointerLocked && this.canvas.requestPointerLock) {
        try { this.canvas.requestPointerLock(); } catch (error) { /* Pointer lock is optional. */ }
      }
    };

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('pointerlockchange', this.handlePointerLock);
    canvas.addEventListener('click', this.handleCanvasClick);
    this.enabled = false;
  }

  isDown(key) { return this.keys.has(key.toLowerCase()); }
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
      if (this.pointerLocked && document.exitPointerLock) document.exitPointerLock();
    }
  }
  destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('pointerlockchange', this.handlePointerLock);
    this.canvas.removeEventListener('click', this.handleCanvasClick);
  }
}