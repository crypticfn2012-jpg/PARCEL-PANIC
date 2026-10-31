import * as THREE from 'three';

const TYPES = {
  common: { label: 'COMMON', value: 10, color: 0xc69a6a, emissive: 0x241307, speedMultiplier: 0.96 },
  rare: { label: 'RARE', value: 25, color: 0x4e9de3, emissive: 0x102747, speedMultiplier: 0.91 },
  epic: { label: 'EPIC', value: 50, color: 0x9b72e6, emissive: 0x2a1550, speedMultiplier: 0.84 },
  golden: { label: 'GOLDEN', value: 100, color: 0xffce55, emissive: 0x6d3b05, speedMultiplier: 0.76 },
  diamond: { label: 'DIAMOND', value: 150, color: 0x7deee7, emissive: 0x1a625e, speedMultiplier: 0.69 }
};

const SPAWNS = [
  [-27, -17], [-22, 0], [-25, 25], [-12, -28], [-10, 7], [-7, 28],
  [8, -27], [11, 0], [12, 28], [25, -20], [27, 7], [26, 26],
  [0, 17], [-2, -10], [19, 15], [-19, -15]
];

export class ParcelManager {
  constructor(scene, world, audio, onMessage) {
    this.scene = scene;
    this.world = world;
    this.audio = audio;
    this.onMessage = onMessage;
    this.parcels = [];
    this.elapsed = 0;
    this.spawnSerial = 0;
    this.reset();
  }

  rollType() {
    const roll = Math.random() * 100;
    if (roll < 62) return 'common';
    if (roll < 86) return 'rare';
    if (roll < 96) return 'epic';
    if (roll < 99.3) return 'golden';
    return 'diamond';
  }

  createMesh(typeKey) {
    const type = TYPES[typeKey];
    const group = new THREE.Group();
    const baseMat = new THREE.MeshStandardMaterial({ color: type.color, roughness: 0.38, metalness: typeKey === 'golden' || typeKey === 'diamond' ? 0.3 : 0.05, emissive: type.emissive, emissiveIntensity: typeKey === 'common' ? 0.25 : 0.78 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x32404b, roughness: 0.6 });
    const tapeMat = new THREE.MeshStandardMaterial({ color: typeKey === 'common' ? 0xf0d8ac : 0xf5f4df, roughness: 0.48 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.68, 0.78), baseMat);
    box.position.y = 0.47;
    box.castShadow = true;
    box.receiveShadow = true;
    group.add(box);

    const strapTop = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.7, 0.82), tapeMat);
    strapTop.position.set(0, 0.47, 0);
    group.add(strapTop);
    const strapSide = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.12, 0.16), tapeMat);
    strapSide.position.set(0, 0.47, 0);
    group.add(strapSide);
    const label = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.21, 0.035), new THREE.MeshStandardMaterial({ color: 0xfff4d9, roughness: 0.82 }));
    label.position.set(0.2, 0.48, -0.405);
    group.add(label);
    const stamp = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.04), darkMat);
    stamp.position.set(0.2, 0.49, -0.428);
    group.add(stamp);
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.86), darkMat);
    base.position.y = 0.08;
    group.add(base);

    if (typeKey === 'golden' || typeKey === 'diamond') {
      const glow = new THREE.PointLight(type.color, typeKey === 'golden' ? 2.3 : 3.2, 5, 2);
      glow.position.set(0, 1.1, 0);
      group.add(glow);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.72, 0.035, 8, 32),
        new THREE.MeshStandardMaterial({ color: type.color, emissive: type.color, emissiveIntensity: 0.9 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.2;
      group.add(ring);
    }
    group.userData.typeKey = typeKey;
    return group;
  }

  reset() {
    this.parcels.forEach((parcel) => {
      if (parcel.mesh && parcel.mesh.parent) parcel.mesh.parent.remove(parcel.mesh);
    });
    this.parcels = [];
    this.elapsed = 0;
    this.spawnSerial = 0;
    for (let i = 0; i < 11; i++) this.spawnParcel(i);
  }

  spawnParcel(slotIndex) {
    const spawn = SPAWNS[slotIndex % SPAWNS.length];
    const position = new THREE.Vector3(spawn[0], 0, spawn[1]);
    const typeKey = this.rollType();
    const mesh = this.createMesh(typeKey);
    mesh.position.copy(position);
    this.scene.add(mesh);
    const parcel = {
      id: 'parcel-' + (++this.spawnSerial),
      slotIndex,
      typeKey,
      type: TYPES[typeKey],
      mesh,
      active: true,
      inWorld: true,
      owner: null,
      velocity: new THREE.Vector3(),
      bobOffset: Math.random() * Math.PI * 2,
      dropExpires: 0,
      respawnAt: 0,
      basePosition: position.clone()
    };
    this.parcels.push(parcel);
    return parcel;
  }

  nearestAvailable(position, limit = 2.6) {
    let nearest = null;
    let nearestDistance = limit;
    this.parcels.forEach((parcel) => {
      if (!parcel.active || !parcel.inWorld || parcel.owner) return;
      const distance = position.distanceTo(parcel.mesh.position);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = parcel;
      }
    });
    return nearest;
  }

  pickUp(runner, parcel) {
    if (!parcel || !parcel.active || !parcel.inWorld || parcel.owner || runner.carrying) return false;
    if (parcel.mesh.parent) parcel.mesh.parent.remove(parcel.mesh);
    runner.root.add(parcel.mesh);
    parcel.mesh.position.set(0, 1.48, -0.64);
    parcel.mesh.rotation.set(-0.15, Math.PI, 0.08);
    parcel.mesh.scale.setScalar(0.82);
    parcel.inWorld = false;
    parcel.owner = runner;
    runner.carrying = parcel;
    if (runner.isBot !== true) {
      this.audio.play('pickup');
      this.onMessage('PACKAGE SECURED', parcel.type.label + ' · ' + parcel.type.value + ' POINTS', 'good');
    }
    return true;
  }

  interact(runner, runners) {
    if (runner.carrying) return false;
    // Stealing from a nearby carrier is deliberately a little closer than collecting a loose parcel.
    let targetCarrier = null;
    let nearestCarrier = 2.05;
    runners.forEach((other) => {
      if (other === runner || !other.carrying || !other.carrying.active) return;
      const distance = runner.position.distanceTo(other.position);
      if (distance < nearestCarrier) {
        nearestCarrier = distance;
        targetCarrier = other;
      }
    });
    if (targetCarrier) {
      const parcel = targetCarrier.carrying;
      if (parcel && parcel.mesh.parent) parcel.mesh.parent.remove(parcel.mesh);
      targetCarrier.carrying = null;
      parcel.owner = null;
      runner.steals += 1;
      runner.root.add(parcel.mesh);
      parcel.mesh.position.set(0, 1.48, -0.64);
      parcel.mesh.rotation.set(-0.15, Math.PI, 0.08);
      parcel.mesh.scale.setScalar(0.82);
      parcel.owner = runner;
      runner.carrying = parcel;
      if (!runner.isBot) {
        this.audio.play('steal');
        this.onMessage('NICE SNATCH!', 'You stole a ' + parcel.type.label.toLowerCase() + ' parcel.', 'warn');
      }
      return true;
    }

    const parcel = this.nearestAvailable(runner.position, 2.65);
    if (!parcel) return false;
    return this.pickUp(runner, parcel);
  }

  drop(runner, direction, thrown = true) {
    const parcel = runner.carrying;
    if (!parcel) return false;
    if (parcel.mesh.parent) parcel.mesh.parent.remove(parcel.mesh);
    this.scene.add(parcel.mesh);
    parcel.mesh.scale.setScalar(1);
    parcel.mesh.position.copy(runner.position).add(new THREE.Vector3(0, 1.25, 0)).addScaledVector(direction, 1.15);
    parcel.mesh.rotation.set(0.18, runner.root.rotation.y, 0.12);
    parcel.owner = null;
    parcel.inWorld = true;
    parcel.velocity.set(direction.x * (thrown ? 8.6 : 2.0), thrown ? 5.6 : 1.8, direction.z * (thrown ? 8.6 : 2.0));
    parcel.dropExpires = this.elapsed + (thrown ? 15 : 12);
    parcel.basePosition.copy(parcel.mesh.position);
    runner.carrying = null;
    return true;
  }

  processDeliveries(runners) {
    const completed = [];
    runners.forEach((runner) => {
      if (!runner.carrying) return;
      const dx = runner.position.x - this.world.deliveryCenter.x;
      const dz = runner.position.z - this.world.deliveryCenter.z;
      if (dx * dx + dz * dz > this.world.deliveryRadius * this.world.deliveryRadius) return;

      const parcel = runner.carrying;
      runner.score += parcel.type.value;
      runner.deliveries += 1;
      completed.push({ runner, value: parcel.type.value, label: parcel.type.label });
      if (parcel.mesh.parent) parcel.mesh.parent.remove(parcel.mesh);
      parcel.owner = null;
      parcel.inWorld = false;
      parcel.active = false;
      parcel.respawnAt = this.elapsed + 3.8;
      runner.carrying = null;
    });
    return completed;
  }

  update(delta) {
    this.elapsed += delta;
    this.parcels.forEach((parcel) => {
      if (!parcel.active && parcel.respawnAt > 0 && this.elapsed >= parcel.respawnAt) {
        const slot = parcel.slotIndex;
        if (parcel.mesh.parent) parcel.mesh.parent.remove(parcel.mesh);
        this.parcels = this.parcels.filter((item) => item !== parcel);
        this.spawnParcel(slot);
        return;
      }
      if (!parcel.active || !parcel.inWorld) return;

      if (parcel.dropExpires > 0) {
        parcel.velocity.y -= 18 * delta;
        parcel.mesh.position.addScaledVector(parcel.velocity, delta);
        if (parcel.mesh.position.y < 0.47) {
          parcel.mesh.position.y = 0.47;
          parcel.velocity.y = Math.max(0, -parcel.velocity.y * 0.32);
          parcel.velocity.x *= 0.78;
          parcel.velocity.z *= 0.78;
          if (parcel.velocity.lengthSq() < 0.8) parcel.velocity.set(0, 0, 0);
        }
        parcel.mesh.rotation.x += parcel.velocity.z * delta * 0.035;
        parcel.mesh.rotation.z -= parcel.velocity.x * delta * 0.035;
        if (this.elapsed >= parcel.dropExpires) {
          parcel.active = false;
          parcel.respawnAt = this.elapsed + 1.5;
          if (parcel.mesh.parent) parcel.mesh.parent.remove(parcel.mesh);
          return;
        }
      } else {
        parcel.mesh.position.y = 0.04 + Math.sin(this.elapsed * 2.2 + parcel.bobOffset) * 0.12;
        parcel.mesh.rotation.y += delta * 0.42;
      }
    });
  }
}