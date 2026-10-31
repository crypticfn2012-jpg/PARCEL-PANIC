import * as THREE from 'three';

export class Runner {
  constructor(scene, options = {}) {
    this.name = options.name || 'RUNNER';
    this.color = options.color || 0xff765d;
    this.isBot = !!options.isBot;
    this.scene = scene;
    this.root = new THREE.Group();
    this.scene.add(this.root);
    this.position = this.root.position;
    this.velocity = new THREE.Vector3();
    this.score = 0;
    this.deliveries = 0;
    this.steals = 0;
    this.carrying = null;
    this.grounded = true;
    this.jumpPadCooldown = 0;
    this.slideTimer = 0;
    this.stunTimer = 0;
    this.invulnerableTimer = 0;
    this.animationTime = Math.random() * 4;
    this.botTarget = null;
    this.botThink = 0;
    this.buildCharacter();
  }

  buildCharacter() {
    const main = new THREE.MeshStandardMaterial({ color: this.color, roughness: 0.62 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x253341, roughness: 0.72 });
    const skin = new THREE.MeshStandardMaterial({ color: 0xf1c39f, roughness: 0.8 });
    const accent = new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.48, metalness: 0.1 });
    const capsule = new THREE.Mesh(new THREE.CapsuleGeometry(0.46, 0.78, 5, 10), main);
    capsule.position.y = 1.12;
    capsule.castShadow = true;
    this.root.add(capsule);
    this.body = capsule;

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 14), skin);
    head.position.set(0, 2.06, 0);
    head.castShadow = true;
    this.root.add(head);

    const face = new THREE.Group();
    face.position.set(0, 2.06, -0.36);
    this.root.add(face);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x172633 });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), eyeMat);
    eyeL.position.set(-0.13, 0.01, -0.015);
    face.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.13;
    face.add(eyeR);

    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.42, 0.15, 16), accent);
    hat.position.set(0, 2.43, 0.02);
    hat.castShadow = true;
    this.root.add(hat);
    const hatTop = new THREE.Mesh(new THREE.SphereGeometry(0.27, 16, 10), accent);
    hatTop.scale.y = 0.42;
    hatTop.position.set(0, 2.52, 0.02);
    this.root.add(hatTop);

    this.arms = [];
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.43, 3, 8), main);
      arm.position.set(side * 0.53, 1.24, -0.02);
      arm.rotation.z = side * -0.18;
      arm.castShadow = true;
      this.root.add(arm);
      this.arms.push(arm);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), skin);
      hand.position.set(side * 0.57, 0.9, -0.03);
      this.root.add(hand);

      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.35, 3, 8), dark);
      leg.position.set(side * 0.23, 0.35, 0.02);
      leg.castShadow = true;
      this.root.add(leg);
    }

    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.7, 0.28), dark);
    bag.position.set(0, 1.25, 0.43);
    bag.castShadow = true;
    this.root.add(bag);
    const bagStripe = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.13, 0.3), accent);
    bagStripe.position.set(0, 1.37, 0.45);
    this.root.add(bagStripe);

    const ring = new THREE.Mesh(
      new THREE.CircleGeometry(0.63, 24),
      new THREE.MeshBasicMaterial({ color: this.color, transparent: true, opacity: this.isBot ? 0.14 : 0.2, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.035;
    this.root.add(ring);
    this.shadowRing = ring;
  }

  updatePlayer(input, cameraYaw, delta, audio) {
    this.animationTime += delta;
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= delta;
    if (this.jumpPadCooldown > 0) this.jumpPadCooldown -= delta;
    if (this.slideTimer > 0) this.slideTimer -= delta;
    if (this.stunTimer > 0) {
      this.stunTimer -= delta;
      this.velocity.x *= 0.93;
      this.velocity.z *= 0.93;
      this.applyPhysics(delta);
      return;
    }

    const forward = new THREE.Vector3(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
    const right = new THREE.Vector3(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));
    const move = new THREE.Vector3();
    if (input.isDown('w')) move.add(forward);
    if (input.isDown('s')) move.sub(forward);
    if (input.isDown('d')) move.add(right);
    if (input.isDown('a')) move.sub(right);
    if (move.lengthSq() > 0) move.normalize();

    if ((input.consume('c') || input.consume('control')) && this.grounded) {
      this.slideTimer = 0.72;
    }
    const sprinting = input.isDown('shift');
    let speed = sprinting ? 10.4 : 7.25;
    if (this.carrying) speed *= this.carrying.type.speedMultiplier;
    if (this.slideTimer > 0) speed *= 1.38;

    const response = this.grounded ? 13 : 4.5;
    this.velocity.x += (move.x * speed - this.velocity.x) * Math.min(1, response * delta);
    this.velocity.z += (move.z * speed - this.velocity.z) * Math.min(1, response * delta);

    if (move.lengthSq() === 0) {
      const friction = this.grounded ? 10 : 1.0;
      this.velocity.x *= Math.max(0, 1 - friction * delta);
      this.velocity.z *= Math.max(0, 1 - friction * delta);
    } else {
      this.root.rotation.y = Math.atan2(-move.x, -move.z);
    }

    if (input.consume(' ') && this.grounded) {
      this.velocity.y = 9.2;
      this.grounded = false;
      audio.play('jump');
    }
    this.applyPhysics(delta);
    this.animateCharacter(move.lengthSq() > 0.04, delta);
  }

  updateBot(manager, world, delta) {
    this.animationTime += delta;
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= delta;
    if (this.jumpPadCooldown > 0) this.jumpPadCooldown -= delta;
    if (this.slideTimer > 0) this.slideTimer -= delta;
    this.botThink -= delta;

    let target = null;
    if (this.carrying) {
      target = world.deliveryCenter;
    } else if (this.botThink <= 0 || !this.botTarget || !this.botTarget.active || this.botTarget.owner) {
      this.botTarget = manager.nearestAvailable(this.position, 70);
      this.botThink = 0.35 + Math.random() * 0.4;
    }
    if (this.carrying) target = world.deliveryCenter;
    else if (this.botTarget) target = this.botTarget.mesh.position;

    const move = new THREE.Vector3();
    if (target) {
      move.set(target.x - this.position.x, 0, target.z - this.position.z);
      if (move.lengthSq() > 0.01) move.normalize();
      // Lightweight steering nudges runners away from nearby collision boxes.
      world.colliders.forEach((box) => {
        const cx = Math.max(box.minX - 1.2, Math.min(this.position.x, box.maxX + 1.2));
        const cz = Math.max(box.minZ - 1.2, Math.min(this.position.z, box.maxZ + 1.2));
        const away = new THREE.Vector3(this.position.x - cx, 0, this.position.z - cz);
        if (away.lengthSq() > 0.01 && away.lengthSq() < 2.2) {
          away.normalize().multiplyScalar(0.85);
          move.add(away);
        }
      });
      if (move.lengthSq() > 0) move.normalize();
    }

    let speed = this.carrying ? 5.6 : 6.25;
    this.velocity.x += (move.x * speed - this.velocity.x) * Math.min(1, 7 * delta);
    this.velocity.z += (move.z * speed - this.velocity.z) * Math.min(1, 7 * delta);
    if (move.lengthSq() > 0.01) this.root.rotation.y = Math.atan2(-move.x, -move.z);

    if (this.grounded && Math.random() < delta * 0.32 && this.position.y < 0.08) {
      this.velocity.y = 8.2;
      this.grounded = false;
    }
    this.applyPhysics(delta);
    this.animateCharacter(move.lengthSq() > 0.04, delta);
  }

  applyPhysics(delta) {
    this.velocity.y -= 24 * delta;
    this.position.addScaledVector(this.velocity, delta);
    if (this.position.y <= 0) {
      this.position.y = 0;
      this.velocity.y = 0;
      this.grounded = true;
    }
  }

  animateCharacter(moving, delta) {
    const bob = moving && this.grounded ? Math.sin(this.animationTime * 13) * 0.055 : 0;
    this.body.position.y = 1.12 + bob;
    this.arms[0].rotation.x = moving ? Math.sin(this.animationTime * 13) * 0.36 : 0;
    this.arms[1].rotation.x = moving ? -Math.sin(this.animationTime * 13) * 0.36 : 0;
    if (this.carrying) {
      this.arms[0].rotation.x = -0.45;
      this.arms[1].rotation.x = -0.45;
    }
    this.shadowRing.material.opacity = this.invulnerableTimer > 0 ? 0.42 : (this.isBot ? 0.12 : 0.18);
  }

  knockback(direction, strength) {
    if (this.invulnerableTimer > 0) return;
    this.velocity.x += direction.x * strength;
    this.velocity.z += direction.z * strength;
    this.velocity.y = Math.max(this.velocity.y, 3.1);
    this.stunTimer = Math.max(this.stunTimer, 0.18);
  }

  reset(position) {
    this.position.copy(position);
    this.velocity.set(0, 0, 0);
    this.score = 0;
    this.deliveries = 0;
    this.steals = 0;
    this.carrying = null;
    this.grounded = true;
    this.slideTimer = 0;
    this.stunTimer = 0;
    this.invulnerableTimer = 2;
    this.botTarget = null;
  }
}