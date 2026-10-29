import * as THREE from '../../vendor/three.module.js';
import { Avatar } from './Avatar.js';
import { createToonMaterial } from '../shaders/ToonShaders.js';

/**
 * Interactive In-Game NPCs
 * Features unique accessories, head-tracking, and dialogue trees.
 */
export class NPC {
  constructor(options = {}) {
    this.id = options.id || 'npc';
    this.name = options.name || 'Local Guide';
    this.role = options.role || 'Habitante Local';
    this.avatar = new Avatar({
      name: this.name,
      palette: options.palette || {},
      hat: options.hat || 'none'
    });

    this.group = new THREE.Group();
    this.group.add(this.avatar.group);

    if (options.position) {
      this.group.position.copy(options.position);
    }
    if (options.rotationY !== undefined) {
      this.group.rotation.y = options.rotationY;
    }

    this.dialogue = options.dialogue || [
      'Olá! Que dia lindo para caminhar sem pressa por aqui.'
    ];
    this.currentDialogueIndex = 0;

    // Special accessories
    this.type = options.type || 'generic'; // 'artist' | 'cafe' | 'guide' | 'coconut'
    this.addProps();

    // Floating interaction prompt
    this.promptDistance = 3.2;
    this.isNearPlayer = false;
  }

  addProps() {
    if (this.type === 'artist') {
      // Easel & Painting canvas in front of NPC
      const easelGroup = new THREE.Group();
      easelGroup.position.set(0, 0, 1.1);

      // Wooden tripod legs
      const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.7, 6);
      const woodMat = createToonMaterial(0x8a5a36);

      const legL = new THREE.Mesh(legGeo, woodMat);
      legL.position.set(-0.35, 0.8, 0.1);
      legL.rotation.z = 0.22;
      easelGroup.add(legL);

      const legR = new THREE.Mesh(legGeo, woodMat);
      legR.position.set(0.35, 0.8, 0.1);
      legR.rotation.z = -0.22;
      easelGroup.add(legR);

      const legB = new THREE.Mesh(legGeo, woodMat);
      legB.position.set(0, 0.8, -0.35);
      legB.rotation.x = -0.28;
      easelGroup.add(legB);

      // Canvas
      const canvasGeo = new THREE.BoxGeometry(0.7, 0.5, 0.04);
      const canvasMat = createToonMaterial(0xf4ede2);
      const canvasMesh = new THREE.Mesh(canvasGeo, canvasMat);
      canvasMesh.position.set(0, 1.0, 0.05);
      easelGroup.add(canvasMesh);

      // Painting art on canvas (mini Eiffel painting)
      const artGeo = new THREE.PlaneGeometry(0.6, 0.42);
      const artMat = createToonMaterial(0x66bde6); // blue sky background
      const artMesh = new THREE.Mesh(artGeo, artMat);
      artMesh.position.set(0, 1.0, 0.075);
      easelGroup.add(artMesh);

      this.group.add(easelGroup);

      // Artist palette in left hand
      const paletteGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.02, 12);
      const palMesh = new THREE.Mesh(paletteGeo, woodMat);
      palMesh.position.set(0, -0.44, 0.12);
      palMesh.rotation.x = Math.PI / 2;
      this.avatar.nodes.leftArm.add(palMesh);

    } else if (this.type === 'coconut') {
      // Green coconut cart
      const cartGroup = new THREE.Group();
      cartGroup.position.set(0.85, 0, 0.4);

      const cartBodyGeo = new THREE.BoxGeometry(0.8, 0.7, 0.6);
      const cartMat = createToonMaterial(0x5b9f7b);
      const cartMesh = new THREE.Mesh(cartBodyGeo, cartMat);
      cartMesh.position.y = 0.55;
      cartGroup.add(cartMesh);

      // Big green coconuts
      const cocoGeo = new THREE.SphereGeometry(0.12, 10, 8);
      cocoGeo.scale(1, 1.2, 1);
      const cocoMat = createToonMaterial(0x3e8e41);

      for (let i = 0; i < 4; i++) {
        const coco = new THREE.Mesh(cocoGeo, cocoMat);
        coco.position.set((i % 2) * 0.26 - 0.13, 0.96, Math.floor(i / 2) * 0.24 - 0.12);
        cartGroup.add(coco);
      }

      this.group.add(cartGroup);
    }
  }

  getNextDialogue() {
    const text = this.dialogue[this.currentDialogueIndex];
    this.currentDialogueIndex = (this.currentDialogueIndex + 1) % this.dialogue.length;
    return text;
  }

  update(dt, playerPosition) {
    this.avatar.update(dt, 0);

    if (playerPosition) {
      const dist = this.group.position.distanceTo(playerPosition);
      this.isNearPlayer = dist < this.promptDistance;

      // Subtle head turning towards player when nearby
      if (this.isNearPlayer) {
        const localPlayerPos = this.group.worldToLocal(playerPosition.clone());
        const targetAngleY = Math.atan2(localPlayerPos.x, localPlayerPos.z);
        const clampedAngle = THREE.MathUtils.clamp(targetAngleY, -0.8, 0.8);
        this.avatar.nodes.head.rotation.y = THREE.MathUtils.lerp(
          this.avatar.nodes.head.rotation.y,
          clampedAngle,
          0.08
        );
      } else {
        this.avatar.nodes.head.rotation.y = THREE.MathUtils.lerp(
          this.avatar.nodes.head.rotation.y,
          0,
          0.05
        );
      }
    }
  }
}
