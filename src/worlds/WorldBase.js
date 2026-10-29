import * as THREE from '../../vendor/three.module.js';
import { createToonMaterial } from '../shaders/ToonShaders.js';

/**
 * Base Destination World Class
 * Houses common environmental systems: clouds, particles, flocking birds,
 * collision meshes, and interactive Points of Interest (POIs).
 */
export class WorldBase {
  constructor(id, name, options = {}) {
    this.id = id;
    this.name = name;
    this.group = new THREE.Group();

    this.colliders = []; // Meshes to test for collision
    this.npcs = [];      // NPCs in this world
    this.pois = [];      // Points of interest: [{ id, name, desc, position, radius }]
    this.waypoints = []; // Wanderer waypoints

    this.particles = null;
    this.birds = [];
    this.clouds = [];
    this.interactiveObjects = [];

    this.spawnPosition = new THREE.Vector3(0, 0, 15);
    this.spawnRotationY = 0;
  }

  addPOI(id, title, desc, position, radius = 3.5) {
    this.pois.push({
      id,
      title,
      desc,
      position: position.clone(),
      radius,
      visited: false
    });

    // Create a 3D visual beacon marker (pulsing diamond + ring)
    const markerGroup = new THREE.Group();
    markerGroup.position.copy(position).add(new THREE.Vector3(0, 1.4, 0));

    // Floating diamond
    const diamondGeo = new THREE.OctahedronGeometry(0.28, 0);
    const diamondMat = createToonMaterial(0x66bde6, { transparent: true, opacity: 0.9 });
    const diamondMesh = new THREE.Mesh(diamondGeo, diamondMat);
    markerGroup.add(diamondMesh);

    // Ground target ring
    const ringGeo = new THREE.RingGeometry(0.5, 0.6, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x66bde6,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = -1.35;
    markerGroup.add(ringMesh);

    this.group.add(markerGroup);

    this.interactiveObjects.push({
      markerGroup,
      diamondMesh,
      ringMesh,
      poiId: id,
      update: (time) => {
        diamondMesh.rotation.y = time * 1.5;
        diamondMesh.position.y = Math.sin(time * 2.5) * 0.12;
        ringMesh.scale.setScalar(1.0 + Math.sin(time * 3.0) * 0.08);
      }
    });
  }

  setupClouds(count = 14, minRadius = 60, maxRadius = 140, height = 35) {
    const cloudMat = createToonMaterial(0xffffff, { transparent: true, opacity: 0.88 });

    for (let i = 0; i < count; i++) {
      const cloudGroup = new THREE.Group();
      const angle = (i / count) * Math.PI * 2 + (Math.random() * 0.4);
      const dist = minRadius + Math.random() * (maxRadius - minRadius);

      cloudGroup.position.set(
        Math.cos(angle) * dist,
        height + Math.random() * 12 - 6,
        Math.sin(angle) * dist
      );

      // Fluffy puff composition using 4-6 overlapping spheres
      const puffCount = 5 + Math.floor(Math.random() * 3);
      for (let p = 0; p < puffCount; p++) {
        const radius = 3.5 + Math.random() * 2.5;
        const puffGeo = new THREE.SphereGeometry(radius, 8, 6);
        const puffMesh = new THREE.Mesh(puffGeo, cloudMat);
        puffMesh.position.set(
          (p - puffCount / 2) * 2.8 + (Math.random() * 1.2),
          Math.sin((p / puffCount) * Math.PI) * 1.8 + (Math.random() * 0.8),
          Math.random() * 2.0 - 1.0
        );
        cloudGroup.add(puffMesh);
      }

      this.group.add(cloudGroup);
      this.clouds.push({
        group: cloudGroup,
        speed: 0.8 + Math.random() * 0.6,
        radius: dist,
        angle: angle
      });
    }
  }

  setupBirds(count = 6, height = 24, orbitRadius = 45) {
    const birdMat = createToonMaterial(0x2b333e);

    for (let i = 0; i < count; i++) {
      const birdGroup = new THREE.Group();

      // Simple low-poly bird (body + two flapping wings)
      const bodyGeo = new THREE.ConeGeometry(0.12, 0.45, 4);
      bodyGeo.rotateX(Math.PI / 2);
      const bodyMesh = new THREE.Mesh(bodyGeo, birdMat);
      birdGroup.add(bodyMesh);

      // Left wing
      const wingGeo = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        0, 0, 0.1,
        -0.45, 0, -0.05,
        0, 0, -0.15
      ]);
      wingGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      wingGeo.computeVertexNormals();

      const leftWing = new THREE.Mesh(wingGeo, birdMat);
      birdGroup.add(leftWing);

      const rightWing = leftWing.clone();
      rightWing.scale.x = -1;
      birdGroup.add(rightWing);

      this.group.add(birdGroup);

      this.birds.push({
        group: birdGroup,
        leftWing,
        rightWing,
        orbitAngle: (i / count) * Math.PI * 2,
        orbitRadius: orbitRadius + (Math.random() * 10 - 5),
        height: height + (Math.random() * 8 - 4),
        speed: 0.35 + Math.random() * 0.15,
        flapFreq: 6.0 + Math.random() * 2.0
      });
    }
  }

  setupAmbientParticles(count = 150, areaSize = 80, particleColor = 0xffd166) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * areaSize;
      positions[i * 3 + 1] = Math.random() * 18 + 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * areaSize;

      velocities.push({
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(Math.random() * 0.3 + 0.15),
        vz: (Math.random() - 0.5) * 0.4
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(16, 16, 14, 0, Math.PI * 2);
    ctx.fill();

    const pTex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.PointsMaterial({
      size: 0.28,
      map: pTex,
      transparent: true,
      opacity: 0.6,
      color: particleColor,
      depthWrite: false
    });

    const pSystem = new THREE.Points(geo, mat);
    this.group.add(pSystem);

    this.particles = {
      system: pSystem,
      geo,
      velocities,
      count,
      areaSize
    };
  }

  update(dt, time, playerPos) {
    // Animate clouds
    this.clouds.forEach(cloud => {
      cloud.angle += (cloud.speed * 0.04) * dt;
      cloud.group.position.x = Math.cos(cloud.angle) * cloud.radius;
      cloud.group.position.z = Math.sin(cloud.angle) * cloud.radius;
    });

    // Animate birds
    this.birds.forEach(bird => {
      bird.orbitAngle += bird.speed * dt;
      bird.group.position.x = Math.cos(bird.orbitAngle) * bird.orbitRadius;
      bird.group.position.z = Math.sin(bird.orbitAngle) * bird.orbitRadius;
      bird.group.position.y = bird.height + Math.sin(time * 0.8) * 1.5;

      // Point forward along circular path
      bird.group.rotation.y = -bird.orbitAngle + Math.PI / 2;

      // Wing flapping
      const flap = Math.sin(time * bird.flapFreq) * 0.65;
      bird.leftWing.rotation.z = flap;
      bird.rightWing.rotation.z = -flap;
    });

    // Animate particles
    if (this.particles) {
      const posAttr = this.particles.geo.attributes.position;
      const arr = posAttr.array;
      const { velocities, count, areaSize } = this.particles;

      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        arr[idx] += velocities[i].vx * dt;
        arr[idx + 1] += velocities[i].vy * dt;
        arr[idx + 2] += velocities[i].vz * dt;

        // Reset if touches ground
        if (arr[idx + 1] <= 0.2) {
          arr[idx + 1] = 16.0;
          arr[idx] = (playerPos ? playerPos.x : 0) + (Math.random() - 0.5) * areaSize;
          arr[idx + 2] = (playerPos ? playerPos.z : 0) + (Math.random() - 0.5) * areaSize;
        }
      }
      posAttr.needsUpdate = true;
    }

    // Update POI markers
    this.interactiveObjects.forEach(obj => {
      obj.update(time);
    });

    // Update NPCs
    this.npcs.forEach(npc => {
      npc.update(dt, playerPos);
    });
  }

  // Simple height calculation for terrain surfaces
  getTerrainHeight(x, z) {
    return 0; // Default flat; overridden in subclasses
  }

  dispose() {
    // Cleanup Three.js geometries and materials
    this.group.traverse(child => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
  }
}
