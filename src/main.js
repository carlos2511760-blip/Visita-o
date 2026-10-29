import * as THREE from '../vendor/three.module.js';
import { Soundtrack } from './audio/Soundtrack.js';
import { Avatar } from './entities/Avatar.js';
import { CharacterController } from './controls/CharacterController.js';
import { CameraController } from './controls/CameraController.js';
import { TouchControls } from './controls/TouchControls.js';
import { SimulatedMultiplayer } from './entities/SimulatedMultiplayer.js';
import { ParisWorld } from './worlds/ParisWorld.js';
import { RioWorld } from './worlds/RioWorld.js';
import { UIManager } from './ui/UIManager.js';

/**
 * Main Application & Game Loop
 */
class WandererGame {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    this.clock = new THREE.Clock();
    this.isRunning = false;

    // 1. Audio Engine
    this.sound = new Soundtrack();

    // 2. Three.js Core
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true // Required for photo mode snapshots
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);

    // 3. Scene Lights
    this.ambientLight = new THREE.AmbientLight(0xffeedd, 0.9);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffeedd, 1.4);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 200;
    const d = 35;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    // 4. Player Avatar & Controllers
    this.player = {
      avatar: new Avatar({
        name: 'Player',
        isPlayer: true,
        hat: 'beret',
        palette: {
          jacket: 0x66bde6, // Messenger Cyan
          backpack: 0xc25959
        }
      })
    };
    this.scene.add(this.player.avatar.group);

    this.cameraController = new CameraController(this.camera, this.canvas);
    this.characterController = new CharacterController(this.player.avatar, this.camera, this.sound);
    this.touchControls = new TouchControls(this.characterController, this.cameraController);

    // 5. Simulated Multiplayer
    this.multiplayer = new SimulatedMultiplayer(this.scene, this.sound);

    // 6. World Management
    this.worlds = {
      paris: new ParisWorld(),
      rio: new RioWorld()
    };
    this.currentWorld = null;

    // 7. UI Manager
    this.ui = new UIManager(this);

    // 8. Event Listeners
    window.addEventListener('resize', () => this.onResize());

    // Load initial world (Paris)
    this.switchWorld('paris', true);
  }

  start() {
    this.sound.init();
    this.isRunning = true;
    this.clock.start();
  }

  switchWorld(worldId, immediate = false) {
    if (this.currentWorld) {
      this.scene.remove(this.currentWorld.group);
    }

    const nextWorld = this.worlds[worldId] || this.worlds.paris;
    this.currentWorld = nextWorld;
    this.scene.add(this.currentWorld.group);

    // Update lighting
    this.ambientLight.color.set(this.currentWorld.lighting.ambientColor);
    this.ambientLight.intensity = this.currentWorld.lighting.ambientIntensity;

    this.sunLight.color.set(this.currentWorld.lighting.sunColor);
    this.sunLight.intensity = this.currentWorld.lighting.sunIntensity;
    this.sunLight.position.copy(this.currentWorld.lighting.sunPosition);

    // Set player spawn
    this.characterController.setPosition(
      this.currentWorld.spawnPosition,
      this.currentWorld.spawnRotationY
    );
    this.characterController.setColliders(this.currentWorld.colliders);

    // Camera initial orientation
    this.cameraController.setTarget(this.currentWorld.spawnPosition, true);
    this.cameraController.yaw = this.currentWorld.spawnRotationY;
    this.cameraController.pitch = 0.22;
    this.cameraController.setColliders(this.currentWorld.colliders);

    // Populate simulated peers
    this.multiplayer.spawnForWorld(worldId, this.currentWorld.waypoints);

    // Switch soundtrack mood
    this.sound.setWorld(worldId);

    // Update UI badge
    this.ui.setDestinationName(this.currentWorld.name);
  }

  triggerPlayerEmote(emoji) {
    this.multiplayer.onPlayerEmote(this.player.avatar.group.position, emoji);
  }

  checkProximityInteractions() {
    if (!this.currentWorld) return;
    const playerPos = this.player.avatar.group.position;
    let closestInteractable = null;
    let minDistance = 3.6;

    // Check NPCs
    for (const npc of this.currentWorld.npcs) {
      const dist = npc.group.position.distanceTo(playerPos);
      if (dist < minDistance) {
        minDistance = dist;
        closestInteractable = {
          type: 'npc',
          object: npc,
          prompt: `Conversar com ${npc.name}`
        };
      }
    }

    // Check POIs
    if (!closestInteractable) {
      for (const poi of this.currentWorld.pois) {
        const dist = poi.position.distanceTo(playerPos);
        if (dist < poi.radius) {
          closestInteractable = {
            type: 'poi',
            object: poi,
            prompt: `Descobrir: ${poi.title}`
          };
          break;
        }
      }
    }

    this.ui.currentNearbyInteractable = closestInteractable;

    if (closestInteractable) {
      this.ui.showInteractionPrompt(closestInteractable.prompt, 'E');
    } else {
      this.ui.hideInteractionPrompt();
    }
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const dt = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.getElapsedTime();

    if (this.currentWorld) {
      const playerPos = this.player.avatar.group.position;

      // 1. Update World (clouds, birds, leaves, etc.)
      this.currentWorld.update(dt, elapsedTime, playerPos);

      // 2. Update Player & Camera
      if (this.isRunning) {
        this.characterController.update(dt, this.currentWorld);
      }
      this.cameraController.setTarget(playerPos);
      this.cameraController.update(dt);

      // 3. Update Simulated Multiplayer
      this.multiplayer.update(dt, playerPos);

      // 4. Proximity interactions
      this.checkProximityInteractions();
    }

    // 5. Render Scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Start application when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  const game = new WandererGame();
  game.animate();
});
