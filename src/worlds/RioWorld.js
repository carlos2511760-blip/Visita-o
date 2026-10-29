import * as THREE from '../../vendor/three.module.js';
import { WorldBase } from './WorldBase.js';
import { NPC } from '../entities/NPC.js';
import { createToonMaterial, createGradientSkyDome, createToonWater } from '../shaders/ToonShaders.js';

/**
 * Destination 2: Rio de Janeiro — Cristo Redentor & Corcovado
 * Lush tropical mountaintop terrace, majestic open-armed monument,
 * breathtaking vista of Guanabara Bay and Sugarloaf Mountain (Pão de Açúcar).
 */
export class RioWorld extends WorldBase {
  constructor() {
    super('rio', 'Rio de Janeiro — Cristo Redentor');

    this.spawnPosition = new THREE.Vector3(0, 4.2, 28);
    this.spawnRotationY = Math.PI; // Face the Christ the Redeemer monument

    this.lighting = {
      ambientColor: 0xe0f2fe,
      ambientIntensity: 0.95,
      sunColor: 0xfffbeb,
      sunIntensity: 1.5,
      sunPosition: new THREE.Vector3(-50, 65, 70),
      skyTop: 0x38bdf8,     // Tropical azure sky
      skyHorizon: 0xbae6fd, // Gentle ocean breeze cyan
      groundColor: 0x166534  // Lush Tijuca rainforest green
    };

    this.waterMesh = null;
    this.build();
  }

  build() {
    // 1. Sky Dome
    const sky = createGradientSkyDome(
      this.lighting.skyTop,
      this.lighting.skyHorizon,
      this.lighting.groundColor
    );
    this.group.add(sky);

    // 2. Corcovado Mountain Peak & Multi-tiered Viewing Terraces
    this.buildMountainAndTerraces();

    // 3. Christ the Redeemer Monument
    this.buildChristStatue();

    // 4. Distant Panorama: Guanabara Bay & Sugarloaf Mountain
    this.buildBayPanorama();

    // 5. Tropical Vegetation (Palms, Planters, Railings)
    this.buildTropicalEnvironment();

    // 6. Environmental FX
    this.setupClouds(14, 45, 120, 22); // Low mountain clouds
    this.setupBirds(10, 18, 32);
    this.setupAmbientParticles(120, 65, 0x67e8f9); // Tropical sun dust particles

    // 7. Interactive Points of Interest (POIs)
    this.addPOI(
      'poi-cristo',
      'Santuário do Cristo Redentor',
      'Inaugurado em 12 de outubro de 1931 no cume do Morro do Corcovado a 710 metros de altitude. Eleito uma das Novas 7 Maravilhas do Mundo Moderno, com seus braços abertos em perpétuo acolhimento.',
      new THREE.Vector3(0, 4.2, 0),
      6.5
    );

    this.addPOI(
      'poi-pao-acucar',
      'Mirante do Pão de Açúcar',
      'Daqui se descortina a clássica curva da Enseada de Botafogo e o morro do Pão de Açúcar emergindo das águas azuis da Baía de Guanabara. Uma das paisagens mais célebres do planeta.',
      new THREE.Vector3(14, 4.2, 16),
      4.2
    );

    this.addPOI(
      'poi-floresta',
      'Parque Nacional da Tijuca',
      'A maior floresta urbana replantada do mundo, com rica biodiversidade da Mata Atlântica que abraça o Corcovado com bromélias, tucanos, macacos-prego e cachoeiras cristalinas.',
      new THREE.Vector3(-14, 4.2, 22),
      4.2
    );

    // 8. NPCs
    this.setupNPCs();

    // 9. Wanderer Waypoints
    this.waypoints = [
      new THREE.Vector3(0, 4.2, 18),
      new THREE.Vector3(-8, 4.2, 14),
      new THREE.Vector3(-14, 4.2, 22),
      new THREE.Vector3(0, 4.2, 28),
      new THREE.Vector3(12, 4.2, 24),
      new THREE.Vector3(14, 4.2, 14),
      new THREE.Vector3(8, 4.2, 4),
      new THREE.Vector3(-8, 4.2, 4)
    ];
  }

  buildMountainAndTerraces() {
    // Corcovado Mountain Peak (Rock slope base)
    const peakGeo = new THREE.ConeGeometry(38, 28, 12, 2);
    const rockMat = createToonMaterial(0x475569);
    const peakMesh = new THREE.Mesh(peakGeo, rockMat);
    peakMesh.position.y = -10;
    this.group.add(peakMesh);

    // Lush vegetation blanket covering mountain flank
    const forestGeo = new THREE.ConeGeometry(42, 22, 14, 1);
    const forestMat = createToonMaterial(0x15803d); // Deep Tijuca green
    const forestMesh = new THREE.Mesh(forestGeo, forestMat);
    forestMesh.position.y = -14;
    this.group.add(forestMesh);

    // Main Observation Terrace Plazas (multi-level stone platforms)
    const stoneMat = createToonMaterial(0xd6d3d1); // Warm light granite stone

    // Upper Monument Platform
    const upperPlatGeo = new THREE.CylinderGeometry(14, 15, 1.2, 16);
    const upperPlat = new THREE.Mesh(upperPlatGeo, stoneMat);
    upperPlat.position.set(0, 3.6, 0);
    upperPlat.receiveShadow = true;
    this.group.add(upperPlat);
    this.colliders.push(upperPlat);

    // Lower Viewing Deck / Promenade
    const lowerDeckGeo = new THREE.BoxGeometry(32, 1.2, 36);
    const lowerDeck = new THREE.Mesh(lowerDeckGeo, stoneMat);
    lowerDeck.position.set(0, 3.6, 18);
    lowerDeck.receiveShadow = true;
    this.group.add(lowerDeck);
    this.colliders.push(lowerDeck);

    // Stone Balustrades / Railings along perimeter
    const railMat = createToonMaterial(0xffffff);
    const railSections = [
      { pos: [-16, 4.7, 18], size: [0.3, 1.0, 36] }, // Left railing
      { pos: [16, 4.7, 18], size: [0.3, 1.0, 36] },  // Right railing
      { pos: [0, 4.7, 36], size: [32, 1.0, 0.3] }    // Front edge railing
    ];

    railSections.forEach(({ pos, size }) => {
      const railGeo = new THREE.BoxGeometry(...size);
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(...pos);
      this.group.add(rail);
      this.colliders.push(rail);
    });

    // Decorative Compass Rose in center of lower deck
    const compassGeo = new THREE.CircleGeometry(3.2, 24);
    compassGeo.rotateX(-Math.PI / 2);
    const compassMat = createToonMaterial(0x38bdf8);
    const compass = new THREE.Mesh(compassGeo, compassMat);
    compass.position.set(0, 4.22, 18);
    this.group.add(compass);
  }

  buildChristStatue() {
    const statueGroup = new THREE.Group();
    statueGroup.position.set(0, 4.2, 0);

    const stoneSoapMat = createToonMaterial(0xe2e8f0); // Pale soapstone
    const pedMat = createToonMaterial(0x64748b);       // Dark granite pedestal

    // 1. Pedestal Base & Chapel
    const pedGeo = new THREE.BoxGeometry(6.2, 8.0, 6.2);
    const pedestal = new THREE.Mesh(pedGeo, pedMat);
    pedestal.position.y = 4.0;
    pedestal.castShadow = true;
    statueGroup.add(pedestal);
    this.colliders.push(pedestal);

    // Chapel Arched Portal
    const doorGeo = new THREE.PlaneGeometry(1.6, 2.8);
    const doorMat = createToonMaterial(0x1e293b);
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 2.4, 3.12);
    statueGroup.add(door);

    // 2. Christ Figure: Robed Body
    const bodyGeo = new THREE.CylinderGeometry(1.4, 2.4, 18, 12);
    const body = new THREE.Mesh(bodyGeo, stoneSoapMat);
    body.position.y = 17.0;
    body.castShadow = true;
    statueGroup.add(body);

    // Robe mantle folds
    const drapeGeo = new THREE.CylinderGeometry(1.6, 2.2, 14, 8);
    const drape = new THREE.Mesh(drapeGeo, stoneSoapMat);
    drape.position.y = 17.5;
    statueGroup.add(drape);

    // 3. Welcoming Open Arms (Span of 28 meters)
    const armGeo = new THREE.BoxGeometry(26, 1.4, 1.4);
    const arms = new THREE.Mesh(armGeo, stoneSoapMat);
    arms.position.set(0, 24.2, 0);
    arms.castShadow = true;
    statueGroup.add(arms);

    // Hands
    const handGeo = new THREE.BoxGeometry(1.6, 0.4, 1.6);
    const leftHand = new THREE.Mesh(handGeo, stoneSoapMat);
    leftHand.position.set(-13.5, 24.2, 0);
    statueGroup.add(leftHand);

    const rightHand = new THREE.Mesh(handGeo, stoneSoapMat);
    rightHand.position.set(13.5, 24.2, 0);
    statueGroup.add(rightHand);

    // 4. Head & Halo/Crown
    const headGeo = new THREE.SphereGeometry(1.5, 12, 10);
    headGeo.scale(0.85, 1.15, 0.95);
    const head = new THREE.Mesh(headGeo, stoneSoapMat);
    head.position.set(0, 27.2, 0.2);
    head.castShadow = true;
    statueGroup.add(head);

    // Soft celestial rim glow
    const haloGeo = new THREE.TorusGeometry(1.8, 0.08, 8, 24);
    haloGeo.rotateX(Math.PI / 2);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0xffedd5, transparent: true, opacity: 0.75 });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.set(0, 28.5, 0.2);
    statueGroup.add(halo);

    this.group.add(statueGroup);
  }

  buildBayPanorama() {
    // Azure Guanabara Bay Water far below
    this.waterMesh = createToonWater(260, 260, 0x0284c7, 0xe0f2fe);
    this.waterMesh.position.set(40, -42, 60);
    this.group.add(this.waterMesh);

    // Sugarloaf Mountain (Pão de Açúcar) iconic granite dome rising from sea
    const paoGroup = new THREE.Group();
    paoGroup.position.set(75, -12, 65);

    // Main granite dome
    const domeGeo = new THREE.SphereGeometry(22, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.55);
    domeGeo.scale(1.0, 1.6, 0.9);
    const graniteMat = createToonMaterial(0x64748b);
    const domeMesh = new THREE.Mesh(domeGeo, graniteMat);
    paoGroup.add(domeMesh);

    // Flank hill (Morro da Urca)
    const urcaGeo = new THREE.SphereGeometry(14, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55);
    urcaGeo.scale(1.2, 1.2, 1.0);
    const urcaMesh = new THREE.Mesh(urcaGeo, graniteMat);
    urcaMesh.position.set(-18, -4, -8);
    paoGroup.add(urcaMesh);

    // Tropical vegetation on lower slopes
    const paoVegGeo = new THREE.ConeGeometry(25, 12, 12);
    const vegMat = createToonMaterial(0x166534);
    const vegMesh = new THREE.Mesh(paoVegGeo, vegMat);
    vegMesh.position.y = -8;
    paoGroup.add(vegMesh);

    this.group.add(paoGroup);

    // Distant sailboats in the bay
    for (let s = 0; s < 5; s++) {
      const boatGroup = new THREE.Group();
      boatGroup.position.set(25 + s * 16, -41, 40 + s * 12);

      const hullGeo = new THREE.BoxGeometry(1.6, 0.5, 3.2);
      const hullMat = createToonMaterial(0xffffff);
      const hull = new THREE.Mesh(hullGeo, hullMat);
      boatGroup.add(hull);

      const sailGeo = new THREE.BufferGeometry();
      const sailVerts = new Float32Array([
        0, 0, 1.2,
        0, 3.4, -0.4,
        0, 0, -1.2
      ]);
      sailGeo.setAttribute('position', new THREE.BufferAttribute(sailVerts, 3));
      sailGeo.computeVertexNormals();
      const sailMat = createToonMaterial(0xf8fafc, { side: THREE.DoubleSide });
      const sail = new THREE.Mesh(sailGeo, sailMat);
      boatGroup.add(sail);

      this.group.add(boatGroup);
    }
  }

  buildTropicalEnvironment() {
    // Swaying Palm Trees along the terrace approaches
    const palmPositions = [
      [-17, 3.6, 8], [17, 3.6, 8],
      [-17, 3.6, 26], [17, 3.6, 26]
    ];

    const trunkMat = createToonMaterial(0x785338);
    const frondMat = createToonMaterial(0x22c55e);

    palmPositions.forEach(([x, y, z]) => {
      const palm = new THREE.Group();
      palm.position.set(x, y, z);

      // Curved Trunk
      const trunkGeo = new THREE.CylinderGeometry(0.24, 0.36, 7.5, 7);
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 3.75;
      trunk.rotation.z = (x < 0 ? -0.12 : 0.12);
      palm.add(trunk);
      this.colliders.push(trunk);

      // Palm Crown & Fronds (6 arching palm leaves)
      for (let f = 0; f < 6; f++) {
        const angle = (f / 6) * Math.PI * 2;
        const frondGeo = new THREE.BufferGeometry();
        const verts = new Float32Array([
          0, 0, 0,
          Math.cos(angle) * 3.4, -1.2, Math.sin(angle) * 3.4,
          Math.cos(angle + 0.3) * 1.8, -0.4, Math.sin(angle + 0.3) * 1.8
        ]);
        frondGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
        frondGeo.computeVertexNormals();

        const frond = new THREE.Mesh(frondGeo, frondMat);
        frond.position.y = 7.4;
        palm.add(frond);
      }

      this.group.add(palm);
    });

    // Viewing Telescopes / Binoculars on pedestals
    const binoMat = createToonMaterial(0x0284c7);
    const binoPositions = [
      { pos: [15.2, 4.2, 16], rot: Math.PI / 2 },
      { pos: [15.2, 4.2, 28], rot: Math.PI / 2 }
    ];

    binoPositions.forEach(({ pos, rot }) => {
      const bino = new THREE.Group();
      bino.position.set(...pos);
      bino.rotation.y = rot;

      const standGeo = new THREE.CylinderGeometry(0.08, 0.14, 1.2, 8);
      const stand = new THREE.Mesh(standGeo, binoMat);
      stand.position.y = 0.6;
      bino.add(stand);

      const opticGeo = new THREE.BoxGeometry(0.35, 0.22, 0.6);
      const optic = new THREE.Mesh(opticGeo, binoMat);
      optic.position.y = 1.25;
      optic.rotation.x = -0.15;
      bino.add(optic);

      this.group.add(bino);
      this.colliders.push(stand);
    });
  }

  setupNPCs() {
    // 1. Zé do Mirante (Local Tour Guide)
    const ze = new NPC({
      id: 'ze',
      name: 'Zé do Mirante (Guia Turístico)',
      role: 'Guia Carioca Oficial',
      type: 'guide',
      hat: 'visor',
      palette: {
        jacket: 0xf59e0b, // Warm sun yellow
        pants: 0x0284c7,  // Ocean blue
        hatColor: 0x10b981
      },
      position: new THREE.Vector3(12, 4.2, 16),
      rotationY: -Math.PI / 2 + 0.2,
      dialogue: [
        'E aí, meu camarada! Bem-vindo ao cume do Corcovado!',
        'Olha essa vista do Pão de Açúcar e da Baía de Guanabara... não tem nada igual no mundo inteiro!',
        'Sinta essa brisa tropical, relaxe os ombros e aproveite cada segundo desse visual abençoado.'
      ]
    });
    this.npcs.push(ze);
    this.group.add(ze.group);

    // 2. Dona Cida (Coconut Cart)
    const cida = new NPC({
      id: 'cida',
      name: 'Dona Cida (Água de Coco)',
      role: 'Hospitalidade Carioca',
      type: 'coconut',
      hat: 'none',
      palette: {
        jacket: 0x10b981, // Tropical green
        pants: 0xf4ede2,
        hair: 0x3d271d
      },
      position: new THREE.Vector3(-12, 4.2, 22),
      rotationY: Math.PI / 2 - 0.3,
      dialogue: [
        'Oi, meu bem! Uma água de coco bem geladinha pra refrescar sua caminhada?',
        'O Cristo está sempre de braços abertos esperando por você. Vá até a base dele tirar uma bela foto!',
        'Aproveite a música relaxante e passeie sem nenhuma pressa!'
      ]
    });
    this.npcs.push(cida);
    this.group.add(cida.group);
  }

  update(dt, time, playerPos) {
    super.update(dt, time, playerPos);

    // Animate Guanabara Bay water waves
    if (this.waterMesh && this.waterMesh.update) {
      this.waterMesh.update(dt);
    }
  }

  getTerrainHeight(x, z) {
    // Main deck is at y = 4.2
    return 4.2;
  }
}
