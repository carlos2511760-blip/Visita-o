import * as THREE from '../../vendor/three.module.js';
import { Avatar } from './Avatar.js';

/**
 * Lightweight Simulated Multiplayer & Emote System
 * Populates worlds with friendly wanderers who walk around, stop at scenic viewpoints,
 * and interact using floating emoji bubbles.
 */

// Helper to create high-resolution emoji canvas texture
function createEmoteTexture(emoji) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Frosted white circle background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.beginPath();
  ctx.arc(64, 64, 56, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(102, 189, 230, 0.8)';
  ctx.stroke();

  // Emoji text
  ctx.font = '64px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 64, 68);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

export class EmoteBubble {
  constructor(emoji, position, scene) {
    this.scene = scene;
    this.age = 0;
    this.lifespan = 2.4; // seconds
    this.isDead = false;

    const texture = createEmoteTexture(emoji);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });

    this.sprite = new THREE.Sprite(material);
    this.sprite.scale.set(0.01, 0.01, 1);
    this.sprite.position.copy(position).add(new THREE.Vector3(0, 0.4, 0));
    this.basePos = this.sprite.position.clone();

    this.scene.add(this.sprite);
  }

  update(dt) {
    this.age += dt;
    const progress = this.age / this.lifespan;

    if (progress >= 1.0) {
      this.isDead = true;
      this.scene.remove(this.sprite);
      this.sprite.material.dispose();
      return;
    }

    // Gentle float upward with subtle horizontal sway
    this.sprite.position.y = this.basePos.y + progress * 0.8;
    this.sprite.position.x = this.basePos.x + Math.sin(this.age * 5.0) * 0.08;

    // Pop-in bounce then fade out
    let scale = 0.8;
    if (this.age < 0.25) {
      scale = (this.age / 0.25) * 0.85; // pop in
    } else if (progress > 0.7) {
      const fadeProgress = (progress - 0.7) / 0.3;
      scale = 0.8 * (1.0 - fadeProgress * 0.4);
      this.sprite.material.opacity = 1.0 - fadeProgress;
    }
    this.sprite.scale.set(scale, scale, 1);
  }
}

export class SimulatedMultiplayer {
  constructor(scene, soundEngine) {
    this.scene = scene;
    this.sound = soundEngine;
    this.peers = [];
    this.activeBubbles = [];
    this.wandererConfigs = [
      {
        name: 'Milo',
        palette: { jacket: 0x5b9f7b, pants: 0x1f2937, backpack: 0x66bde6, hat: 'beanie' }
      },
      {
        name: 'Sophie',
        palette: { jacket: 0xc25959, pants: 0x374151, backpack: 0xf59e0b, hat: 'beret' }
      },
      {
        name: 'Lucas',
        palette: { jacket: 0x739fb1, pants: 0x111827, backpack: 0x10b981, hat: 'visor' }
      },
      {
        name: 'Aoi',
        palette: { jacket: 0x9333ea, pants: 0x312e81, backpack: 0xf43f5e, hat: 'none' }
      }
    ];
  }

  spawnForWorld(worldId, waypoints) {
    // Clear previous peers
    this.clear();

    const count = Math.min(waypoints.length, this.wandererConfigs.length);

    for (let i = 0; i < count; i++) {
      const cfg = this.wandererConfigs[i];
      const avatar = new Avatar({
        name: cfg.name,
        palette: cfg.palette,
        hat: cfg.palette.hat
      });

      const peerGroup = new THREE.Group();
      peerGroup.add(avatar.group);

      const startIdx = i * Math.floor(waypoints.length / count);
      peerGroup.position.copy(waypoints[startIdx]);

      this.scene.add(peerGroup);

      this.peers.push({
        avatar,
        group: peerGroup,
        waypoints,
        currentWpIdx: startIdx,
        targetWp: waypoints[(startIdx + 1) % waypoints.length].clone(),
        state: 'walking', // 'walking' | 'resting' | 'admiring' | 'waving'
        stateTimer: Math.random() * 3 + 2,
        speed: 2.2 + Math.random() * 0.8,
        emoteCooldown: Math.random() * 10 + 5
      });
    }
  }

  triggerEmote(targetPosition, emoji) {
    const bubble = new EmoteBubble(emoji, targetPosition, this.scene);
    this.activeBubbles.push(bubble);
    if (this.sound) this.sound.playEmotePop();
  }

  onPlayerEmote(playerPos, emoji) {
    // Pop emote over player head
    this.triggerEmote(playerPos.clone().add(new THREE.Vector3(0, 2.1, 0)), emoji);

    // Nearby peers notice and react!
    this.peers.forEach(peer => {
      const dist = peer.group.position.distanceTo(playerPos);
      if (dist < 8.0) {
        setTimeout(() => {
          // Face the player
          peer.group.lookAt(playerPos.x, peer.group.position.y, playerPos.z);
          peer.avatar.setAnimation('wave');

          // Friendly response emote
          const responses = ['👋', '✨', '❤️', emoji];
          const chosen = responses[Math.floor(Math.random() * responses.length)];
          this.triggerEmote(
            peer.group.position.clone().add(new THREE.Vector3(0, 2.1, 0)),
            chosen
          );

          setTimeout(() => {
            peer.avatar.setAnimation('idle');
          }, 2400);
        }, 450 + Math.random() * 600);
      }
    });
  }

  update(dt, playerPos) {
    // Update active bubbles
    for (let i = this.activeBubbles.length - 1; i >= 0; i--) {
      const b = this.activeBubbles[i];
      b.update(dt);
      if (b.isDead) {
        this.activeBubbles.splice(i, 1);
      }
    }

    // Update peer behaviors
    this.peers.forEach(peer => {
      peer.stateTimer -= dt;
      peer.emoteCooldown -= dt;

      // Random friendly emote while wandering
      if (peer.emoteCooldown <= 0) {
        peer.emoteCooldown = Math.random() * 18 + 12;
        const randomEmotes = ['✨', '👀', '🌸', '📸', '☕'];
        const em = randomEmotes[Math.floor(Math.random() * randomEmotes.length)];
        this.triggerEmote(
          peer.group.position.clone().add(new THREE.Vector3(0, 2.1, 0)),
          em
        );
      }

      if (peer.state === 'walking') {
        const toTarget = peer.targetWp.clone().sub(peer.group.position);
        toTarget.y = 0;
        const dist = toTarget.length();

        if (dist < 0.6) {
          // Reached waypoint: rest or admire
          peer.state = Math.random() > 0.5 ? 'resting' : 'admiring';
          peer.stateTimer = 4.0 + Math.random() * 4.0;
          peer.avatar.setAnimation('idle');
        } else {
          // Move towards target
          toTarget.normalize();
          peer.group.position.addScaledVector(toTarget, peer.speed * dt);

          // Smooth rotation towards travel vector
          const targetAngle = Math.atan2(toTarget.x, toTarget.z);
          peer.group.rotation.y = THREE.MathUtils.lerp(
            peer.group.rotation.y,
            targetAngle,
            0.1
          );

          peer.avatar.setAnimation('walk');
          peer.avatar.update(dt, peer.speed);
        }
      } else {
        // Resting or admiring
        peer.avatar.setAnimation('idle');
        peer.avatar.update(dt, 0);

        if (peer.stateTimer <= 0) {
          // Pick next waypoint
          peer.currentWpIdx = (peer.currentWpIdx + 1) % peer.waypoints.length;
          peer.targetWp = peer.waypoints[peer.currentWpIdx].clone();
          peer.state = 'walking';
        }
      }
    });
  }

  clear() {
    this.peers.forEach(peer => {
      this.scene.remove(peer.group);
    });
    this.peers = [];

    this.activeBubbles.forEach(b => {
      this.scene.remove(b.sprite);
    });
    this.activeBubbles = [];
  }
}
