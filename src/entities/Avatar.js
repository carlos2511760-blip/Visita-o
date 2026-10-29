import * as THREE from '../../vendor/three.module.js';
import { createToonMaterial } from '../shaders/ToonShaders.js';

/**
 * Stylized, Cozy Procedural Avatar
 * Complete with procedural skeletal movement, customization, and accessories.
 */
export class Avatar {
  constructor(options = {}) {
    this.group = new THREE.Group();
    this.name = options.name || 'Wanderer';
    this.isPlayer = options.isPlayer || false;

    // Default aesthetic palette (inspired by Messenger DS)
    this.palette = {
      skin: options.skin || 0xffd8b3,
      hair: options.hair || 0x3d271d,
      jacket: options.jacket || 0x66bde6, // Messenger Cyan/Blue
      pants: options.pants || 0x2b333e,  // Slate Navy
      shoes: options.shoes || 0x181c22,
      backpack: options.backpack || 0xc25959, // Warm Coral
      hat: options.hat || 'none', // 'none' | 'beret' | 'visor' | 'beanie'
      ...options.palette
    };

    // Animation state
    this.animTime = 0;
    this.currentAnim = 'idle'; // 'idle' | 'walk' | 'run' | 'jump' | 'wave' | 'sit'
    this.walkSpeed = 1.0;

    // Component nodes for procedural animation
    this.nodes = {};

    this.buildMesh();
  }

  buildMesh() {
    // Root anchor (feet at y = 0)
    const root = new THREE.Group();
    this.group.add(root);
    this.nodes.root = root;

    // --- Materials ---
    this.materials = {
      skin: createToonMaterial(this.palette.skin),
      hair: createToonMaterial(this.palette.hair),
      jacket: createToonMaterial(this.palette.jacket),
      pants: createToonMaterial(this.palette.pants),
      shoes: createToonMaterial(this.palette.shoes),
      backpack: createToonMaterial(this.palette.backpack),
      white: createToonMaterial(0xffffff),
      black: createToonMaterial(0x1a1c23),
      blush: createToonMaterial(0xff8a8a, { transparent: true, opacity: 0.7 }),
      detail: createToonMaterial(0xe0e6ed),
      hat: createToonMaterial(this.palette.hatColor || 0xc25959)
    };

    // --- Torso / Pelvis ---
    const pelvis = new THREE.Group();
    pelvis.position.y = 0.85;
    root.add(pelvis);
    this.nodes.pelvis = pelvis;

    // Hips / Pants
    const hipsGeo = new THREE.CylinderGeometry(0.24, 0.22, 0.28, 12);
    const hipsMesh = new THREE.Mesh(hipsGeo, this.materials.pants);
    hipsMesh.castShadow = true;
    pelvis.add(hipsMesh);

    // Torso / Jacket
    const torso = new THREE.Group();
    torso.position.y = 0.16;
    pelvis.add(torso);
    this.nodes.torso = torso;

    const jacketGeo = new THREE.CylinderGeometry(0.28, 0.25, 0.52, 14);
    const jacketMesh = new THREE.Mesh(jacketGeo, this.materials.jacket);
    jacketMesh.position.y = 0.26;
    jacketMesh.castShadow = true;
    torso.add(jacketMesh);

    // Jacket Zipper line
    const zipperGeo = new THREE.PlaneGeometry(0.04, 0.48);
    const zipperMesh = new THREE.Mesh(zipperGeo, this.materials.detail);
    zipperMesh.position.set(0, 0.26, 0.285);
    torso.add(zipperMesh);

    // Collar
    const collarGeo = new THREE.TorusGeometry(0.22, 0.05, 8, 16);
    collarGeo.rotateX(Math.PI / 2);
    const collarMesh = new THREE.Mesh(collarGeo, this.materials.jacket);
    collarMesh.position.y = 0.52;
    torso.add(collarMesh);

    // --- Backpack ---
    const backpackGroup = new THREE.Group();
    backpackGroup.position.set(0, 0.28, -0.24);
    torso.add(backpackGroup);

    const bpMainGeo = new THREE.BoxGeometry(0.36, 0.44, 0.22);
    const bpMainMesh = new THREE.Mesh(bpMainGeo, this.materials.backpack);
    bpMainMesh.castShadow = true;
    backpackGroup.add(bpMainMesh);

    // Bedroll on top of backpack
    const rollGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.42, 10);
    rollGeo.rotateZ(Math.PI / 2);
    const rollMesh = new THREE.Mesh(rollGeo, createToonMaterial(0x5b9f7b));
    rollMesh.position.set(0, 0.26, 0);
    backpackGroup.add(rollMesh);

    // Backpack pocket
    const pocketGeo = new THREE.BoxGeometry(0.26, 0.2, 0.08);
    const pocketMesh = new THREE.Mesh(pocketGeo, this.materials.jacket);
    pocketMesh.position.set(0, -0.06, -0.13);
    backpackGroup.add(pocketMesh);

    // --- Head & Face ---
    const headGroup = new THREE.Group();
    headGroup.position.y = 0.62;
    torso.add(headGroup);
    this.nodes.head = headGroup;

    // Head base (slightly rounded box/sphere hybrid)
    const headGeo = new THREE.SphereGeometry(0.32, 16, 14);
    headGeo.scale(1.0, 1.08, 0.96);
    const headMesh = new THREE.Mesh(headGeo, this.materials.skin);
    headMesh.position.y = 0.32;
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.045, 8, 8);
    eyeGeo.scale(0.8, 1.4, 0.6);

    const leftEye = new THREE.Mesh(eyeGeo, this.materials.black);
    leftEye.position.set(0.12, 0.34, 0.31);
    headGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, this.materials.black);
    rightEye.position.set(-0.12, 0.34, 0.31);
    headGroup.add(rightEye);

    // Eye highlights (sparkles)
    const shineGeo = new THREE.SphereGeometry(0.016, 6, 6);
    const leftShine = new THREE.Mesh(shineGeo, this.materials.white);
    leftShine.position.set(0.13, 0.37, 0.33);
    headGroup.add(leftShine);

    const rightShine = new THREE.Mesh(shineGeo, this.materials.white);
    rightShine.position.set(-0.11, 0.37, 0.33);
    headGroup.add(rightShine);

    // Blushing cheeks
    const blushGeo = new THREE.CircleGeometry(0.06, 10);
    const leftBlush = new THREE.Mesh(blushGeo, this.materials.blush);
    leftBlush.position.set(0.16, 0.26, 0.32);
    leftBlush.rotation.y = 0.2;
    headGroup.add(leftBlush);

    const rightBlush = new THREE.Mesh(blushGeo, this.materials.blush);
    rightBlush.position.set(-0.16, 0.26, 0.32);
    rightBlush.rotation.y = -0.2;
    headGroup.add(rightBlush);

    // Hair / Bangs
    const hairGroup = new THREE.Group();
    headGroup.add(hairGroup);
    this.nodes.hair = hairGroup;

    const hairDomeGeo = new THREE.SphereGeometry(0.35, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.6);
    const hairDomeMesh = new THREE.Mesh(hairDomeGeo, this.materials.hair);
    hairDomeMesh.position.set(0, 0.38, -0.04);
    hairDomeMesh.scale.set(1.04, 1.06, 1.06);
    hairGroup.add(hairDomeMesh);

    // Hair bangs / tufts
    const tuftGeo = new THREE.ConeGeometry(0.11, 0.24, 6);
    tuftGeo.rotateZ(0.2);
    const tuft1 = new THREE.Mesh(tuftGeo, this.materials.hair);
    tuft1.position.set(0.1, 0.62, 0.24);
    tuft1.rotation.set(0.4, 0, -0.3);
    hairGroup.add(tuft1);

    const tuft2 = new THREE.Mesh(tuftGeo, this.materials.hair);
    tuft2.position.set(-0.12, 0.61, 0.23);
    tuft2.rotation.set(0.4, 0, 0.4);
    hairGroup.add(tuft2);

    // Hat Container
    const hatContainer = new THREE.Group();
    hatContainer.position.y = 0.64;
    headGroup.add(hatContainer);
    this.nodes.hat = hatContainer;
    this.applyHat(this.palette.hat);

    // --- Arms ---
    // Left Arm
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(0.33, 0.46, 0);
    torso.add(leftArmGroup);
    this.nodes.leftArm = leftArmGroup;

    const armGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.44, 8);
    armGeo.translate(0, -0.22, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, this.materials.jacket);
    leftArmMesh.castShadow = true;
    leftArmGroup.add(leftArmMesh);

    const handGeo = new THREE.SphereGeometry(0.075, 8, 8);
    const leftHandMesh = new THREE.Mesh(handGeo, this.materials.skin);
    leftHandMesh.position.y = -0.46;
    leftArmGroup.add(leftHandMesh);

    // Right Arm
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(-0.33, 0.46, 0);
    torso.add(rightArmGroup);
    this.nodes.rightArm = rightArmGroup;

    const rightArmMesh = new THREE.Mesh(armGeo, this.materials.jacket);
    rightArmMesh.castShadow = true;
    rightArmGroup.add(rightArmMesh);

    const rightHandMesh = new THREE.Mesh(handGeo, this.materials.skin);
    rightHandMesh.position.y = -0.46;
    rightArmGroup.add(rightHandMesh);

    // --- Legs ---
    // Left Leg
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(0.14, -0.06, 0);
    pelvis.add(leftLegGroup);
    this.nodes.leftLeg = leftLegGroup;

    const legGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.54, 8);
    legGeo.translate(0, -0.27, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, this.materials.pants);
    leftLegMesh.castShadow = true;
    leftLegGroup.add(leftLegMesh);

    const shoeGeo = new THREE.BoxGeometry(0.16, 0.12, 0.28);
    const leftShoe = new THREE.Mesh(shoeGeo, this.materials.shoes);
    leftShoe.position.set(0, -0.56, 0.05);
    leftShoe.castShadow = true;
    leftLegGroup.add(leftShoe);

    // Right Leg
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(-0.14, -0.06, 0);
    pelvis.add(rightLegGroup);
    this.nodes.rightLeg = rightLegGroup;

    const rightLegMesh = new THREE.Mesh(legGeo, this.materials.pants);
    rightLegMesh.castShadow = true;
    rightLegGroup.add(rightLegMesh);

    const rightShoe = new THREE.Mesh(shoeGeo, this.materials.shoes);
    rightShoe.position.set(0, -0.56, 0.05);
    rightShoe.castShadow = true;
    rightLegGroup.add(rightShoe);

    // Emote attachment point
    const emoteAnchor = new THREE.Group();
    emoteAnchor.position.y = 2.15;
    this.group.add(emoteAnchor);
    this.nodes.emoteAnchor = emoteAnchor;

    // Shadow blob
    const shadowGeo = new THREE.CircleGeometry(0.42, 16);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x0a0c0e,
      transparent: true,
      opacity: 0.35,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.y = 0.02;
    this.group.add(shadowMesh);
    this.nodes.shadow = shadowMesh;
  }

  applyHat(hatType) {
    this.palette.hat = hatType;
    const container = this.nodes.hat;
    while (container.children.length > 0) {
      container.remove(container.children[0]);
    }

    if (hatType === 'beret') {
      // Classic Paris French Beret
      const beretGeo = new THREE.CylinderGeometry(0.38, 0.28, 0.12, 16);
      const beretMesh = new THREE.Mesh(beretGeo, this.materials.hat);
      beretMesh.rotation.z = 0.22;
      beretMesh.position.set(0.04, 0.04, -0.02);
      container.add(beretMesh);

      // Stalk
      const stalkGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.08, 6);
      const stalkMesh = new THREE.Mesh(stalkGeo, this.materials.hat);
      stalkMesh.position.set(0.06, 0.14, -0.02);
      stalkMesh.rotation.z = 0.22;
      container.add(stalkMesh);
    } else if (hatType === 'visor') {
      // Tropical Rio Sun Visor
      const bandGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.08, 16, 1, true);
      const bandMesh = new THREE.Mesh(bandGeo, this.materials.hat);
      container.add(bandMesh);

      const brimGeo = new THREE.CylinderGeometry(0.5, 0.36, 0.03, 16, 1, false, -Math.PI * 0.4, Math.PI * 0.8);
      const brimMesh = new THREE.Mesh(brimGeo, createToonMaterial(0xffffff));
      brimMesh.position.set(0, -0.02, 0.12);
      brimMesh.rotation.x = 0.18;
      container.add(brimMesh);
    } else if (hatType === 'beanie') {
      // Cozy Beanie
      const beanieGeo = new THREE.SphereGeometry(0.36, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.7);
      const beanieMesh = new THREE.Mesh(beanieGeo, this.materials.hat);
      beanieMesh.position.set(0, -0.02, -0.02);
      container.add(beanieMesh);

      const pomGeo = new THREE.SphereGeometry(0.08, 8, 8);
      const pomMesh = new THREE.Mesh(pomGeo, createToonMaterial(0xffffff));
      pomMesh.position.set(0, 0.28, -0.04);
      container.add(pomMesh);
    }
  }

  setPalette(newPalette) {
    Object.assign(this.palette, newPalette);
    if (newPalette.skin) this.materials.skin.color.set(newPalette.skin);
    if (newPalette.hair) this.materials.hair.color.set(newPalette.hair);
    if (newPalette.jacket) this.materials.jacket.color.set(newPalette.jacket);
    if (newPalette.pants) this.materials.pants.color.set(newPalette.pants);
    if (newPalette.backpack) this.materials.backpack.color.set(newPalette.backpack);
    if (newPalette.hatColor) this.materials.hat.color.set(newPalette.hatColor);
    if (newPalette.hat !== undefined) this.applyHat(newPalette.hat);
  }

  setAnimation(animName) {
    if (this.currentAnim === animName) return;
    this.currentAnim = animName;
    this.animTime = 0;
  }

  update(dt, speed = 0) {
    this.animTime += dt;

    const { pelvis, torso, head, leftArm, rightArm, leftLeg, rightLeg } = this.nodes;

    if (this.currentAnim === 'jump') {
      // Jump pose
      pelvis.position.y = 0.95;
      torso.rotation.x = -0.15;
      leftLeg.rotation.x = -0.6;
      rightLeg.rotation.x = -0.4;
      leftArm.rotation.x = -1.2;
      rightArm.rotation.x = -1.2;
      head.rotation.x = -0.2;
    } else if (this.currentAnim === 'wave') {
      // Idle base with waving right arm
      pelvis.position.y = 0.85 + Math.sin(this.animTime * 2.5) * 0.02;
      leftLeg.rotation.x = 0;
      rightLeg.rotation.x = 0;
      leftArm.rotation.x = 0;
      leftArm.rotation.z = 0.15;

      // Right arm waving
      rightArm.rotation.x = 0;
      rightArm.rotation.z = -2.2 + Math.sin(this.animTime * 9) * 0.45;
      head.rotation.z = Math.sin(this.animTime * 4) * 0.08;
    } else if (this.currentAnim === 'sit') {
      // Sitting on bench
      pelvis.position.y = 0.58;
      torso.rotation.x = 0.05;
      leftLeg.rotation.x = -Math.PI / 2;
      rightLeg.rotation.x = -Math.PI / 2;
      leftArm.rotation.x = -0.2;
      rightArm.rotation.x = -0.2;
      head.rotation.x = 0;
    } else if (speed > 0.1) {
      // Walk or Run Cycle
      const isRunning = speed > 5.0;
      const freq = isRunning ? 11.5 : 7.2;
      const stride = isRunning ? 0.95 : 0.65;
      const t = this.animTime * freq;

      // Leg swing (alternating)
      const legSwing = Math.sin(t) * stride;
      leftLeg.rotation.x = legSwing;
      rightLeg.rotation.x = -legSwing;

      // Arm swing (opposite to legs)
      const armSwing = Math.sin(t) * (stride * 0.85);
      leftArm.rotation.x = -armSwing;
      rightArm.rotation.x = armSwing;
      leftArm.rotation.z = 0.1;
      rightArm.rotation.z = -0.1;

      // Torso bob & lean
      pelvis.position.y = 0.85 + Math.abs(Math.sin(t)) * (isRunning ? 0.09 : 0.045);
      torso.rotation.y = Math.sin(t) * 0.08;
      torso.rotation.x = isRunning ? 0.22 : 0.08;
      head.rotation.y = -Math.sin(t) * 0.05;
      head.rotation.x = isRunning ? -0.12 : -0.04;
    } else {
      // Cozy Idle Breathing
      const breath = Math.sin(this.animTime * 2.2);
      pelvis.position.y = 0.85 + breath * 0.015;
      torso.rotation.x = breath * 0.02;
      torso.rotation.y = Math.sin(this.animTime * 1.1) * 0.04;
      head.rotation.x = -breath * 0.03;
      head.rotation.z = Math.sin(this.animTime * 1.5) * 0.03;

      leftLeg.rotation.x = 0;
      rightLeg.rotation.x = 0;
      leftArm.rotation.x = breath * 0.05;
      rightArm.rotation.x = breath * 0.05;
      leftArm.rotation.z = 0.12;
      rightArm.rotation.z = -0.12;
    }
  }
}
