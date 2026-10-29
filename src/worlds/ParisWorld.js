import * as THREE from '../../vendor/three.module.js';
import { WorldBase } from './WorldBase.js';
import { NPC } from '../entities/NPC.js';
import { createToonMaterial, createGradientSkyDome } from '../shaders/ToonShaders.js';

/**
 * Destination 1: Paris — Eiffel Tower & Champ de Mars
 * Romantic golden-hour ambiance, cel-shaded monument, cozy bistro café,
 * and wandering paths with falling autumn leaves.
 */
export class ParisWorld extends WorldBase {
  constructor() {
    super('paris', 'Paris — Torre Eiffel');

    this.spawnPosition = new THREE.Vector3(0, 0, 32);
    this.spawnRotationY = Math.PI; // Face the Eiffel Tower

    this.lighting = {
      ambientColor: 0xffeedd,
      ambientIntensity: 0.9,
      sunColor: 0xffaa66,
      sunIntensity: 1.4,
      sunPosition: new THREE.Vector3(60, 45, 80),
      skyTop: 0x4a478a,    // Dusk violet
      skyHorizon: 0xff9f76, // Golden sunset peach
      groundColor: 0x3d405b
    };

    this.beaconMesh = null;
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

    // 2. Main Ground (Champ de Mars gravel & grass lawns)
    this.buildTerrain();

    // 3. The Stylized Eiffel Tower
    this.buildEiffelTower();

    // 4. Parisian Architecture & Environment
    this.buildParkElements();
    this.buildCafe();
    this.buildBoulevardBuildings();

    // 5. Environmental FX
    this.setupClouds(12, 50, 130, 42);
    this.setupBirds(8, 28, 38);
    this.setupAmbientParticles(140, 75, 0xffbe76); // Autumn golden leaves

    // 6. Interactive Points of Interest (POIs)
    this.addPOI(
      'poi-tower',
      'La Grande Dame (Torre Eiffel)',
      'Construída por Gustave Eiffel para a Exposição Universal de 1889. Possui mais de 18.000 peças de ferro pudelado e é o símbolo eterno do romance e da arte parisiense.',
      new THREE.Vector3(0, 0, 0),
      6.0
    );

    this.addPOI(
      'poi-cafe',
      'Café des Rêves',
      'O charme inigualável dos bistrôs parisienses: sentar em uma mesa ao ar livre, pedir um café au lait com croissant quentinho e praticar a "flânerie" — a arte de passear sem pressa.',
      new THREE.Vector3(-18, 0, 24),
      4.0
    );

    this.addPOI(
      'poi-allee',
      'Passeio do Champ de Mars',
      'Antigo campo militar transformado em um dos mais encantadores jardins públicos do mundo. Sob a luz dourada do entardecer, suas alamedas de cascalho revelam a vista perfeita.',
      new THREE.Vector3(0, 0, 36),
      4.5
    );

    // 7. NPCs
    this.setupNPCs();

    // 8. Wanderer Waypoints for Simulated Multiplayer
    this.waypoints = [
      new THREE.Vector3(0, 0, 18),
      new THREE.Vector3(-12, 0, 22),
      new THREE.Vector3(-16, 0, 34),
      new THREE.Vector3(0, 0, 42),
      new THREE.Vector3(14, 0, 32),
      new THREE.Vector3(12, 0, 16),
      new THREE.Vector3(0, 0, -8),
      new THREE.Vector3(-6, 0, 6)
    ];
  }

  buildTerrain() {
    // Large base ground
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    groundGeo.rotateX(-Math.PI / 2);
    const gravelMat = createToonMaterial(0xdfd3c3); // Warm Parisian gravel
    const groundMesh = new THREE.Mesh(groundGeo, gravelMat);
    groundMesh.receiveShadow = true;
    this.group.add(groundMesh);

    // Symmetrical Champ de Mars green lawns
    const lawnMat = createToonMaterial(0x6a9955);
    const lawnGeo = new THREE.PlaneGeometry(16, 45);
    lawnGeo.rotateX(-Math.PI / 2);

    // Left lawn
    const lawnLeft = new THREE.Mesh(lawnGeo, lawnMat);
    lawnLeft.position.set(-14, 0.02, 28);
    lawnLeft.receiveShadow = true;
    this.group.add(lawnLeft);

    // Right lawn
    const lawnRight = new THREE.Mesh(lawnGeo, lawnMat);
    lawnRight.position.set(14, 0.02, 28);
    lawnRight.receiveShadow = true;
    this.group.add(lawnRight);

    // Stone curbing along lawn edges
    const curbMat = createToonMaterial(0xb0a89d);
    const curbGeo = new THREE.BoxGeometry(0.3, 0.15, 45);

    const curbL1 = new THREE.Mesh(curbGeo, curbMat);
    curbL1.position.set(-6, 0.08, 28);
    this.group.add(curbL1);

    const curbL2 = new THREE.Mesh(curbGeo, curbMat);
    curbL2.position.set(-22, 0.08, 28);
    this.group.add(curbL2);

    const curbR1 = new THREE.Mesh(curbGeo, curbMat);
    curbR1.position.set(6, 0.08, 28);
    this.group.add(curbR1);

    const curbR2 = new THREE.Mesh(curbGeo, curbMat);
    curbR2.position.set(22, 0.08, 28);
    this.group.add(curbR2);
  }

  buildEiffelTower() {
    const towerGroup = new THREE.Group();
    towerGroup.position.set(0, 0, 0);

    const ironMat = createToonMaterial(0xb8860b); // Stylized warm bronze/iron
    const darkIronMat = createToonMaterial(0x7c5a0b);

    // Base Leg Pillars (4 corner legs slanting inward)
    const legGeo = new THREE.BoxGeometry(2.4, 14, 2.4);
    const legRadius = 8.5;

    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      const x = Math.cos(angle) * legRadius;
      const z = Math.sin(angle) * legRadius;

      const leg = new THREE.Mesh(legGeo, ironMat);
      leg.position.set(x, 6.5, z);
      // Slant inward towards center
      leg.lookAt(0, 24, 0);
      leg.castShadow = true;
      towerGroup.add(leg);

      // Stone pedestal plinth
      const plinthGeo = new THREE.BoxGeometry(3.6, 1.2, 3.6);
      const plinthMesh = new THREE.Mesh(plinthGeo, createToonMaterial(0x8c8275));
      plinthMesh.position.set(x, 0.6, z);
      plinthMesh.castShadow = true;
      towerGroup.add(plinthMesh);
      this.colliders.push(plinthMesh);
    }

    // Great Monumental Arches connecting the legs
    const archMat = ironMat;
    for (let i = 0; i < 4; i++) {
      const archGeo = new THREE.TorusGeometry(6.2, 0.5, 6, 16, Math.PI);
      const arch = new THREE.Mesh(archGeo, archMat);
      arch.position.set(0, 2.0, 0);
      arch.rotation.y = (i * Math.PI) / 2;
      if (i % 2 === 0) arch.position.z = (i === 0 ? 8.5 : -8.5);
      else arch.position.x = (i === 1 ? 8.5 : -8.5);
      arch.position.y = 5.2;
      towerGroup.add(arch);
    }

    // First Platform (Deck & Railing)
    const plat1Geo = new THREE.BoxGeometry(16, 1.4, 16);
    const plat1 = new THREE.Mesh(plat1Geo, darkIronMat);
    plat1.position.y = 12.8;
    plat1.castShadow = true;
    towerGroup.add(plat1);

    // Mid Section (tapering upper legs)
    const midGeo = new THREE.ConeGeometry(5.8, 14, 4, 1, true);
    midGeo.rotateY(Math.PI / 4);
    const midMesh = new THREE.Mesh(midGeo, ironMat);
    midMesh.position.y = 20.2;
    midMesh.castShadow = true;
    towerGroup.add(midMesh);

    // Second Platform
    const plat2Geo = new THREE.BoxGeometry(9.5, 1.0, 9.5);
    const plat2 = new THREE.Mesh(plat2Geo, darkIronMat);
    plat2.position.y = 27.5;
    plat2.castShadow = true;
    towerGroup.add(plat2);

    // Tower Spire (high pinnacle)
    const spireGeo = new THREE.ConeGeometry(2.8, 22, 4, 1);
    spireGeo.rotateY(Math.PI / 4);
    const spireMesh = new THREE.Mesh(spireGeo, ironMat);
    spireMesh.position.y = 39.0;
    spireMesh.castShadow = true;
    towerGroup.add(spireMesh);

    // Top Lantern & Dome
    const domeGeo = new THREE.SphereGeometry(1.2, 12, 10);
    const domeMesh = new THREE.Mesh(domeGeo, createToonMaterial(0xffdd66));
    domeMesh.position.y = 50.4;
    towerGroup.add(domeMesh);

    // Rotating nocturnal beacon beam
    const beaconGeo = new THREE.ConeGeometry(4.0, 48, 12, 1, true);
    beaconGeo.rotateX(Math.PI / 2);
    beaconGeo.translate(0, 0, 24);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0xfff6c2,
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    this.beaconMesh.position.y = 50.4;
    towerGroup.add(this.beaconMesh);

    this.group.add(towerGroup);
  }

  buildParkElements() {
    // Parisian Cast-Iron Streetlamps
    const lampMat = createToonMaterial(0x1e272e);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffe082 });

    const lampPositions = [
      [-5.5, 15], [5.5, 15],
      [-5.5, 27], [5.5, 27],
      [-5.5, 39], [5.5, 39],
      [-5.5, 51], [5.5, 51]
    ];

    lampPositions.forEach(([x, z]) => {
      const lamp = new THREE.Group();
      lamp.position.set(x, 0, z);

      // Post
      const postGeo = new THREE.CylinderGeometry(0.1, 0.14, 4.2, 8);
      const postMesh = new THREE.Mesh(postGeo, lampMat);
      postMesh.position.y = 2.1;
      lamp.add(postMesh);

      // Lantern Glass & Crown
      const lanternGeo = new THREE.BoxGeometry(0.45, 0.6, 0.45);
      const lanternMesh = new THREE.Mesh(lanternGeo, glowMat);
      lanternMesh.position.y = 4.2;
      lamp.add(lanternMesh);

      this.group.add(lamp);
      this.colliders.push(postMesh);
    });

    // Autumn Parisian Trees (Fluffy low-poly foliage)
    const treeTrunkMat = createToonMaterial(0x5c4033);
    const leafColors = [0xf59e0b, 0xd97706, 0xef4444, 0x84cc16];

    const treePositions = [
      [-23.5, 12], [-23.5, 22], [-23.5, 32], [-23.5, 42],
      [23.5, 12], [23.5, 22], [23.5, 32], [23.5, 42]
    ];

    treePositions.forEach(([x, z], idx) => {
      const tree = new THREE.Group();
      tree.position.set(x, 0, z);

      // Trunk
      const trunkGeo = new THREE.CylinderGeometry(0.3, 0.45, 4.5, 7);
      const trunk = new THREE.Mesh(trunkGeo, treeTrunkMat);
      trunk.position.y = 2.25;
      trunk.castShadow = true;
      tree.add(trunk);
      this.colliders.push(trunk);

      // Foliage Puffs
      const leafColor = leafColors[idx % leafColors.length];
      const foliageMat = createToonMaterial(leafColor);

      for (let p = 0; p < 4; p++) {
        const puffGeo = new THREE.SphereGeometry(1.8 + Math.random() * 0.5, 8, 7);
        const puff = new THREE.Mesh(puffGeo, foliageMat);
        puff.position.set(
          (Math.random() - 0.5) * 1.2,
          4.4 + p * 1.1,
          (Math.random() - 0.5) * 1.2
        );
        puff.castShadow = true;
        tree.add(puff);
      }

      this.group.add(tree);
    });

    // Park Benches
    const benchPositions = [
      { pos: [-5.2, 21], rot: Math.PI / 2 },
      { pos: [5.2, 21], rot: -Math.PI / 2 },
      { pos: [-5.2, 33], rot: Math.PI / 2 },
      { pos: [5.2, 33], rot: -Math.PI / 2 }
    ];

    const benchMat = createToonMaterial(0x274e13); // Paris Dark Green
    const legBenchMat = createToonMaterial(0x181c22);

    benchPositions.forEach(({ pos, rot }) => {
      const bench = new THREE.Group();
      bench.position.set(pos[0], 0, pos[1]);
      bench.rotation.y = rot;

      // Wooden Slats
      const seatGeo = new THREE.BoxGeometry(2.0, 0.08, 0.6);
      const seat = new THREE.Mesh(seatGeo, benchMat);
      seat.position.y = 0.48;
      bench.add(seat);

      // Backrest
      const backGeo = new THREE.BoxGeometry(2.0, 0.45, 0.08);
      const back = new THREE.Mesh(backGeo, benchMat);
      back.position.set(0, 0.76, -0.26);
      bench.add(back);

      // Legs
      const legGeo = new THREE.BoxGeometry(0.1, 0.48, 0.6);
      const leg1 = new THREE.Mesh(legGeo, legBenchMat);
      leg1.position.set(-0.85, 0.24, 0);
      bench.add(leg1);
      const leg2 = new THREE.Mesh(legGeo, legBenchMat);
      leg2.position.set(0.85, 0.24, 0);
      bench.add(leg2);

      this.group.add(bench);
      this.colliders.push(seat);
    });
  }

  buildCafe() {
    // Bistro Terrace "Café des Rêves"
    const cafeGroup = new THREE.Group();
    cafeGroup.position.set(-18, 0, 24);

    // Raised wood deck
    const deckGeo = new THREE.BoxGeometry(8, 0.2, 6);
    const deckMat = createToonMaterial(0x96613d);
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.y = 0.1;
    cafeGroup.add(deck);

    // Striped Awning Canopy
    const awningGeo = new THREE.PlaneGeometry(8, 3.2);
    awningGeo.rotateX(0.35);
    const awningMat = createToonMaterial(0xc25959); // French Red
    const awning = new THREE.Mesh(awningGeo, awningMat);
    awning.position.set(0, 3.8, -1.8);
    cafeGroup.add(awning);

    // Bistro Tables & Chairs
    const tableMat = createToonMaterial(0xf4ede2); // Marble top
    const metalMat = createToonMaterial(0x1f2937);

    for (let t = 0; t < 3; t++) {
      const tableGroup = new THREE.Group();
      tableGroup.position.set((t - 1) * 2.4, 0.2, (t % 2) * 1.2 - 0.6);

      // Table Top & Leg
      const topGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.04, 16);
      const top = new THREE.Mesh(topGeo, tableMat);
      top.position.y = 0.82;
      tableGroup.add(top);

      const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8);
      const leg = new THREE.Mesh(legGeo, metalMat);
      leg.position.y = 0.41;
      tableGroup.add(leg);

      // Croissant on plate
      const plateGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.02, 12);
      const plate = new THREE.Mesh(plateGeo, createToonMaterial(0xffffff));
      plate.position.set(0.1, 0.84, 0.1);
      tableGroup.add(plate);

      const croissGeo = new THREE.TorusGeometry(0.07, 0.04, 6, 8, Math.PI * 1.2);
      const croiss = new THREE.Mesh(croissGeo, createToonMaterial(0xd97706));
      croiss.position.set(0.1, 0.87, 0.1);
      croiss.rotation.x = Math.PI / 2;
      tableGroup.add(croiss);

      cafeGroup.add(tableGroup);
      this.colliders.push(top);
    }

    this.group.add(cafeGroup);
  }

  buildBoulevardBuildings() {
    // Distant Parisian Haussmannian facades (perimeter backdrop)
    const facadeMat = createToonMaterial(0xe8dfd1);
    const roofMat = createToonMaterial(0x52616b); // Zinc grey Mansard roof
    const windowMat = createToonMaterial(0x2d3748);

    const buildingPositions = [
      [-36, 15, 0], [36, 15, Math.PI],
      [-36, 35, 0], [36, 35, Math.PI]
    ];

    buildingPositions.forEach(([x, z, rot]) => {
      const bldg = new THREE.Group();
      bldg.position.set(x, 0, z);
      bldg.rotation.y = rot;

      // Main Block
      const blockGeo = new THREE.BoxGeometry(10, 14, 16);
      const block = new THREE.Mesh(blockGeo, facadeMat);
      block.position.y = 7.0;
      bldg.add(block);

      // Mansard Roof
      const roofGeo = new THREE.ConeGeometry(8.5, 4.5, 4);
      roofGeo.rotateY(Math.PI / 4);
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.y = 16.25;
      bldg.add(roof);

      // Stylized Windows
      for (let floor = 0; floor < 3; floor++) {
        for (let col = 0; col < 3; col++) {
          const winGeo = new THREE.PlaneGeometry(0.8, 1.4);
          const win = new THREE.Mesh(winGeo, windowMat);
          win.position.set(5.02, 3.5 + floor * 3.4, (col - 1) * 3.8);
          win.rotation.y = Math.PI / 2;
          bldg.add(win);
        }
      }

      this.group.add(bldg);
      this.colliders.push(block);
    });
  }

  setupNPCs() {
    // 1. Pierre (The Artist)
    const pierre = new NPC({
      id: 'pierre',
      name: 'Pierre (O Pintor)',
      role: 'Artista de Montmartre',
      type: 'artist',
      hat: 'beret',
      palette: {
        jacket: 0x2b333e,
        pants: 0x8a5a36,
        hatColor: 0xc25959
      },
      position: new THREE.Vector3(4.5, 0, 18),
      rotationY: Math.PI + 0.35,
      dialogue: [
        'Ah, bonjour mon ami! Veja só como a luz dourada bate nas vigas de ferro da Torre...',
        'Pinto Paris há trinta anos, mas cada entardecer aqui no Champ de Mars traz uma cor nova e inesquecível.',
        'Dica de artista: use o Modo Fotógrafo lá no mirante. O enquadramento com a alameda fica divino!'
      ]
    });
    this.npcs.push(pierre);
    this.group.add(pierre.group);

    // 2. Camille (At the Café)
    const camille = new NPC({
      id: 'camille',
      name: 'Camille (A Confeiteira)',
      role: 'Apreciadora de Pâtisserie',
      type: 'generic',
      hat: 'none',
      palette: {
        jacket: 0x66bde6,
        pants: 0xf4ede2,
        hair: 0xd97706
      },
      position: new THREE.Vector3(-19.5, 0.2, 23.5),
      rotationY: 0.8,
      dialogue: [
        'Bonjour! Você já provou um croissant fresco olhando a Torre Eiffel?',
        'O segredo de Paris é nunca correr. Caminhe devagar, respire o ar de outono e aprecie cada instante.',
        'Se encontrar outros viajantes pelo caminho, mande um aceno ou um coração para eles!'
      ]
    });
    this.npcs.push(camille);
    this.group.add(camille.group);
  }

  update(dt, time, playerPos) {
    super.update(dt, time, playerPos);

    // Rotate Eiffel Tower beacon light
    if (this.beaconMesh) {
      this.beaconMesh.rotation.y = time * 0.45;
    }
  }
}
