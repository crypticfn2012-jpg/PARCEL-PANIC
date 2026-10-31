import * as THREE from 'three';

const MAT = {
  floor: new THREE.MeshStandardMaterial({ color: 0x263b4a, roughness: 0.88, metalness: 0.08 }),
  floorDark: new THREE.MeshStandardMaterial({ color: 0x1a2b39, roughness: 0.86 }),
  concrete: new THREE.MeshStandardMaterial({ color: 0x526575, roughness: 0.78 }),
  concreteLight: new THREE.MeshStandardMaterial({ color: 0x8ba0a9, roughness: 0.74 }),
  coral: new THREE.MeshStandardMaterial({ color: 0xff7057, roughness: 0.5, emissive: 0x401008 }),
  teal: new THREE.MeshStandardMaterial({ color: 0x4bd4be, roughness: 0.48, emissive: 0x0b3730 }),
  yellow: new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.5, emissive: 0x49300a }),
  dark: new THREE.MeshStandardMaterial({ color: 0x142431, roughness: 0.85 }),
  glass: new THREE.MeshStandardMaterial({ color: 0x4a8997, roughness: 0.22, metalness: 0.35, transparent: true, opacity: 0.72 })
};

export class World {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.movingParts = [];
    this.jumpPads = [];
    this.time = 0;
    this.deliveryCenter = new THREE.Vector3(0, 0, -31);
    this.deliveryRadius = 5.6;
    this.spawnPoints = [
      new THREE.Vector3(-22, 0, 18), new THREE.Vector3(-11, 0, 23),
      new THREE.Vector3(0, 0, 24), new THREE.Vector3(12, 0, 23),
      new THREE.Vector3(23, 0, 16), new THREE.Vector3(20, 0, -9),
      new THREE.Vector3(-20, 0, -8)
    ];
    this.build();
  }

  box(parent, x, y, z, sx, sy, sz, material, options = {}) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = options.castShadow !== false;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  cylinder(parent, x, y, z, radiusTop, radiusBottom, height, material, segments = 24) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  addCollider(x, z, width, depth, height) {
    this.colliders.push({
      minX: x - width / 2, maxX: x + width / 2,
      minZ: z - depth / 2, maxZ: z + depth / 2,
      height: height
    });
  }

  build() {
    this.scene.background = new THREE.Color(0x91b8be);
    this.scene.fog = new THREE.Fog(0x91b8be, 65, 150);

    const hemi = new THREE.HemisphereLight(0xd9f4f2, 0x304454, 2.05);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff0d7, 3.2);
    sun.position.set(-28, 48, 24);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -52;
    sun.shadow.camera.right = 52;
    sun.shadow.camera.top = 52;
    sun.shadow.camera.bottom = -52;
    sun.shadow.bias = -0.00018;
    this.scene.add(sun);

    const floor = new THREE.Mesh(new THREE.BoxGeometry(78, 1.4, 78), MAT.floor);
    floor.position.set(0, -0.72, 0);
    floor.receiveShadow = true;
    this.scene.add(floor);

    const inner = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), new THREE.MeshStandardMaterial({ color: 0x354c5b, roughness: 0.92 }));
    inner.rotation.x = -Math.PI / 2;
    inner.position.y = 0.012;
    inner.receiveShadow = true;
    this.scene.add(inner);

    const grid = new THREE.GridHelper(70, 35, 0x6c8b91, 0x496775);
    grid.position.y = 0.024;
    grid.material.transparent = true;
    grid.material.opacity = 0.22;
    this.scene.add(grid);

    this.addPerimeter();
    this.addBuildings();
    this.addObstacles();
    this.addDeliveryZone();
    this.addJumpPads();
    this.addStreetDetails();
  }

  addPerimeter() {
    const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0xff775b, emissive: 0x8e2412, emissiveIntensity: 0.8, roughness: 0.35 });
    const rail = new THREE.MeshStandardMaterial({ color: 0x8fa8b0, metalness: 0.6, roughness: 0.38 });
    for (const side of [-1, 1]) {
      this.box(this.scene, side * 36, 0.35, 0, 0.45, 0.7, 72, rail);
      this.box(this.scene, side * 36, 0.82, 0, 0.13, 0.12, 72, edgeMaterial, { castShadow: false });
      this.box(this.scene, 0, 0.35, side * 36, 72, 0.7, 0.45, rail);
      this.box(this.scene, 0, 0.82, side * 36, 72, 0.12, 0.13, edgeMaterial, { castShadow: false });
    }
    const corners = [[-36, -36], [36, -36], [-36, 36], [36, 36]];
    corners.forEach((p) => {
      this.cylinder(this.scene, p[0], 1.35, p[1], 0.56, 0.56, 2.3, MAT.dark, 12);
      const lamp = this.cylinder(this.scene, p[0], 2.58, p[1], 0.25, 0.25, 0.18, MAT.yellow, 12);
      lamp.material.emissiveIntensity = 1.4;
    });
  }

  addBuildings() {
    const buildings = [
      [-49, -31, 11, 24, 14, 0x456271], [-49, 0, 12, 32, 12, 0x586b78],
      [-47, 32, 14, 20, 18, 0x3d596b], [48, -33, 13, 22, 17, 0x597481],
      [49, 2, 12, 28, 12, 0x3e6572], [48, 34, 14, 20, 16, 0x536777],
      [-20, -49, 16, 17, 13, 0x607c86], [15, -49, 19, 20, 16, 0x486878],
      [-16, 49, 20, 17, 14, 0x4b6c79], [19, 49, 17, 24, 17, 0x58717c]
    ];
    buildings.forEach((b, index) => {
      const [x, z, w, h, d, color] = b;
      const base = new THREE.MeshStandardMaterial({ color: color, roughness: 0.72, metalness: 0.12 });
      const body = this.box(this.scene, x, h / 2 - 1, z, w, h, d, base);
      body.castShadow = true;
      this.box(this.scene, x, h - 0.7, z, w + 0.7, 0.55, d + 0.7, MAT.concreteLight);
      const windowMat = index % 2 ? MAT.glass : new THREE.MeshStandardMaterial({ color: 0xf0c77a, emissive: 0x52310c, emissiveIntensity: 0.22 });
      const columns = Math.max(2, Math.floor(w / 3.2));
      for (let col = 0; col < columns; col++) {
        const wx = x - w / 2 + 1.6 + col * ((w - 3.2) / Math.max(1, columns - 1));
        for (let row = 0; row < Math.floor(h / 4); row++) {
          this.box(this.scene, wx, 1.2 + row * 3.3, z - d / 2 - 0.025, 1.1, 1.6, 0.08, windowMat, { castShadow: false });
        }
      }
      if (index % 3 === 0) {
        const sign = this.box(this.scene, x, h - 3, z - d / 2 - 0.12, Math.min(6, w - 2), 1.25, 0.18, MAT.coral, { castShadow: false });
        sign.material = MAT.teal;
      }
    });

    const distantColors = [0x6b8990, 0x80979a, 0x54717e, 0x93a5a1];
    for (let i = 0; i < 16; i++) {
      const angle = i / 16 * Math.PI * 2;
      const radius = 73 + (i % 3) * 5;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      const h = 13 + (i % 5) * 4;
      const mat = new THREE.MeshStandardMaterial({ color: distantColors[i % distantColors.length], roughness: 0.9 });
      this.box(this.scene, x, h / 2 - 1, z, 10 + (i % 3) * 2, h, 9 + (i % 4), mat, { castShadow: false });
    }
  }

  addObstacles() {
    const obstacles = [
      [-13, -17, 6, 3, 3.0, MAT.concrete],
      [12, -16, 5, 4, 2.8, MAT.concrete],
      [-17, 3, 4, 7, 2.6, MAT.concreteLight],
      [17, 5, 5, 5, 2.4, MAT.concreteLight],
      [-5, 11, 7, 2.2, 2.1, MAT.coral],
      [7, 13, 6, 2.2, 2.1, MAT.teal],
      [-24, -11, 3.1, 3.1, 2.3, MAT.yellow],
      [25, -5, 3.2, 3.2, 2.5, MAT.yellow],
      [-24, 18, 4, 3, 3, MAT.concrete],
      [24, 19, 4, 3, 3, MAT.concrete]
    ];
    obstacles.forEach((o, index) => {
      const [x, z, w, d, h, material] = o;
      this.box(this.scene, x, h / 2, z, w, h, d, material);
      this.box(this.scene, x, h + 0.08, z, w + 0.16, 0.16, d + 0.16, MAT.dark);
      if (index % 2 === 0) {
        for (let k = -1; k <= 1; k++) {
          this.box(this.scene, x + k * (w / 3), h + 0.19, z, 0.13, 0.08, d - 0.4, MAT.yellow, { castShadow: false });
        }
      }
      this.addCollider(x, z, w, d, h + 0.2);
    });

    // A pair of low warehouse ramps makes a useful shortcut across the centre.
    const rampMat = new THREE.MeshStandardMaterial({ color: 0x6b8791, roughness: 0.75 });
    const rampA = this.box(this.scene, 0, 0.65, -1.4, 7.5, 1.1, 3.5, rampMat);
    rampA.rotation.x = -0.15;
    rampA.rotation.z = 0.08;
    const stripe = this.box(this.scene, 0, 1.26, -1.4, 6.4, 0.08, 0.18, MAT.yellow);
    stripe.rotation.x = -0.15;

    // The central sorting tower is a landmark and a soft obstacle.
    this.cylinder(this.scene, 0, 1.5, 21, 2.1, 2.1, 3, MAT.dark, 16);
    this.cylinder(this.scene, 0, 3.12, 21, 1.45, 1.45, 0.22, MAT.teal, 16);
    this.addCollider(0, 21, 3.8, 3.8, 3.3);

    // Moving sweepers are visual hazards: collision is represented by a wide safe buffer.
    const sweeperGroup = new THREE.Group();
    sweeperGroup.position.set(0, 0.9, 7);
    this.scene.add(sweeperGroup);
    this.cylinder(sweeperGroup, 0, 0, 0, 0.45, 0.45, 1.8, MAT.dark, 16);
    this.box(sweeperGroup, 0, 0, 0, 10.5, 0.22, 0.42, MAT.coral);
    this.box(sweeperGroup, 0, 0.16, 0, 10.2, 0.09, 0.18, MAT.yellow, { castShadow: false });
    this.movingParts.push({ object: sweeperGroup, speed: 0.34, phase: 0 });
  }

  addDeliveryZone() {
    const pad = this.cylinder(this.scene, 0, 0.08, -31, 6.5, 6.5, 0.16, new THREE.MeshStandardMaterial({ color: 0x1f625f, emissive: 0x0b2b28, roughness: 0.48 }), 48);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(5.9, 0.16, 10, 64),
      new THREE.MeshStandardMaterial({ color: 0x6df2d0, emissive: 0x1e967c, emissiveIntensity: 1.1, roughness: 0.25 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0.22, -31);
    this.scene.add(ring);
    this.deliveryRing = ring;
    this.deliveryPad = pad;

    const center = this.cylinder(this.scene, 0, 0.2, -31, 2.15, 2.15, 0.12, MAT.teal, 32);
    center.material.emissiveIntensity = 1.3;
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * Math.PI * 2;
      const marker = this.box(this.scene, Math.sin(a) * 4.8, 0.31, -31 + Math.cos(a) * 4.8, 0.22, 0.12, 1.0, MAT.yellow);
      marker.rotation.y = a;
    }
    const glow = new THREE.PointLight(0x5bffdc, 22, 17, 2);
    glow.position.set(0, 4, -31);
    this.scene.add(glow);
    this.deliveryLight = glow;
  }

  addJumpPads() {
    const spots = [[-20, 9], [19, -23], [7, 27]];
    spots.forEach((p, index) => {
      const group = new THREE.Group();
      group.position.set(p[0], 0, p[1]);
      this.scene.add(group);
      this.cylinder(group, 0, 0.13, 0, 1.9, 1.9, 0.24, MAT.dark, 24);
      const pad = this.cylinder(group, 0, 0.29, 0, 1.5, 1.5, 0.11, index === 1 ? MAT.coral : MAT.teal, 24);
      pad.material.emissiveIntensity = 1.1;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.07, 8, 40), MAT.yellow);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.38;
      group.add(ring);
      this.jumpPads.push({ center: new THREE.Vector3(p[0], 0, p[1]), radius: 1.8 });
    });
  }

  addStreetDetails() {
    // Painted crossing strips, lane dashes and container stacks make the arena read as a city loading depot.
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xe6d8b6, roughness: 0.84, transparent: true, opacity: 0.65 });
    for (let i = -3; i <= 3; i++) {
      this.box(this.scene, i * 1.8, 0.035, -23.4, 0.75, 0.045, 0.22, lineMat, { castShadow: false });
      this.box(this.scene, i * 1.8, 0.035, 5.5, 0.75, 0.045, 0.22, lineMat, { castShadow: false });
    }
    const containerColors = [MAT.coral, MAT.teal, MAT.yellow];
    for (let row = 0; row < 3; row++) {
      const x = -29 + row * 3.0;
      const z = -27;
      this.box(this.scene, x, 1.25, z, 2.6, 2.5, 5.4, containerColors[row]);
      for (let k = 0; k < 5; k++) {
        this.box(this.scene, x - 0.9 + k * 0.45, 1.3, z - 2.76, 0.08, 2.15, 0.08, MAT.dark, { castShadow: false });
      }
    }
    // Small bollards around the loading lane.
    for (const x of [-9, 9]) {
      for (const z of [-28, -20]) {
        this.cylinder(this.scene, x, 0.48, z, 0.18, 0.2, 0.9, MAT.yellow, 12);
      }
    }
  }

  update(delta) {
    this.time += delta;
    this.movingParts.forEach((part) => {
      part.object.rotation.y += delta * part.speed;
      part.object.position.y = 0.9 + Math.sin(this.time * 2 + part.phase) * 0.05;
    });
    if (this.deliveryRing) {
      const pulse = 1 + Math.sin(this.time * 2.2) * 0.025;
      this.deliveryRing.scale.setScalar(pulse);
      this.deliveryLight.intensity = 17 + Math.sin(this.time * 3) * 3;
    }
  }

  checkJumpPad(runner) {
    if (runner.jumpPadCooldown > 0) return false;
    for (const pad of this.jumpPads) {
      const dx = runner.position.x - pad.center.x;
      const dz = runner.position.z - pad.center.z;
      if (dx * dx + dz * dz < pad.radius * pad.radius && runner.position.y < 0.35) {
        runner.velocity.y = 16.5;
        runner.jumpPadCooldown = 1.4;
        return true;
      }
    }
    return false;
  }

  resolveRunner(runner) {
    const radius = 0.48;
    for (const box of this.colliders) {
      if (runner.position.y > box.height + 0.35) continue;
      const closestX = Math.max(box.minX, Math.min(runner.position.x, box.maxX));
      const closestZ = Math.max(box.minZ, Math.min(runner.position.z, box.maxZ));
      const dx = runner.position.x - closestX;
      const dz = runner.position.z - closestZ;
      const distSq = dx * dx + dz * dz;
      if (distSq < radius * radius) {
        if (distSq > 0.0001) {
          const dist = Math.sqrt(distSq);
          const push = radius - dist;
          runner.position.x += dx / dist * push;
          runner.position.z += dz / dist * push;
        } else {
          const left = Math.abs(runner.position.x - box.minX);
          const right = Math.abs(box.maxX - runner.position.x);
          const near = Math.abs(runner.position.z - box.minZ);
          const far = Math.abs(box.maxZ - runner.position.z);
          const smallest = Math.min(left, right, near, far);
          if (smallest === left) runner.position.x = box.minX - radius;
          else if (smallest === right) runner.position.x = box.maxX + radius;
          else if (smallest === near) runner.position.z = box.minZ - radius;
          else runner.position.z = box.maxZ + radius;
        }
      }
    }
    runner.position.x = THREE.MathUtils.clamp(runner.position.x, -34.2, 34.2);
    runner.position.z = THREE.MathUtils.clamp(runner.position.z, -34.2, 34.2);
  }
}