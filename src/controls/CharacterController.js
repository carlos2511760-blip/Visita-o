import * as THREE from '../../vendor/three.module.js';

/**
 * Robust, Responsive 3rd-Person Character Controller
 * Handles WASD / touch movement, sprint, jump, gravity, obstacle collisions,
 * and footstep audio triggers.
 */
export class CharacterController {
  constructor(avatar, camera, soundEngine) {
    this.avatar = avatar;
    this.camera = camera;
    this.sound = soundEngine;

    // Kinematics & tuning
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.facingAngle = 0;

    this.walkSpeed = 4.2;   // m/s
    this.runSpeed = 8.0;    // m/s
    this.jumpForce = 7.2;   // m/s impulse
    this.gravity = 18.0;    // m/s²

    this.isGrounded = true;
    this.isRunning = false;
    this.currentGroundY = 0;

    // Input state
    this.input = {
      forward: 0,
      backward: 0,
      left: 0,
      right: 0,
      jump: false,
      sprint: false
    };

    // Footstep timer
    this.stepTimer = 0;

    // Collision detection radius
    this.playerRadius = 0.45;
    this.colliders = [];

    this.setupKeyboard();
  }

  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.input.forward = 1;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.input.backward = 1;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.input.left = 1;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.input.right = 1;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.input.sprint = true;
          break;
        case 'Space':
          if (this.isGrounded) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
            this.avatar.setAnimation('jump');
            if (this.sound) this.sound.playJump();
          }
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.input.forward = 0;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.input.backward = 0;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.input.left = 0;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.input.right = 0;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.input.sprint = false;
          break;
      }
    });
  }

  setColliders(colliders) {
    this.colliders = colliders || [];
  }

  setPosition(pos, rotationY = 0) {
    this.position.copy(pos);
    this.facingAngle = rotationY;
    this.avatar.group.position.copy(pos);
    this.avatar.group.rotation.y = rotationY;
    this.velocity.set(0, 0, 0);
  }

  update(dt, currentWorld) {
    // 1. Calculate input movement relative to camera orientation
    const moveZ = this.input.forward - this.input.backward;
    const moveX = this.input.right - this.input.left;

    const hasInput = (moveX !== 0 || moveZ !== 0);

    // Camera forward and right vectors projected onto XZ plane
    const camEuler = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
    const camAngle = camEuler.y;

    const forwardVec = new THREE.Vector3(-Math.sin(camAngle), 0, -Math.cos(camAngle));
    const rightVec = new THREE.Vector3(Math.cos(camAngle), 0, -Math.sin(camAngle));

    const moveDir = new THREE.Vector3();
    if (hasInput) {
      moveDir.addScaledVector(forwardVec, moveZ);
      moveDir.addScaledVector(rightVec, moveX);
      moveDir.normalize();

      // Desired facing direction
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      // Smooth angle interpolation
      let angleDiff = targetAngle - this.facingAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      this.facingAngle += angleDiff * Math.min(1.0, dt * 14.0);
    }

    // 2. Speed determination
    this.isRunning = this.input.sprint;
    const targetSpeed = hasInput ? (this.isRunning ? this.runSpeed : this.walkSpeed) : 0;

    // Smooth horizontal velocity
    this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, moveDir.x * targetSpeed, dt * 12.0);
    this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, moveDir.z * targetSpeed, dt * 12.0);

    // 3. Vertical physics (gravity)
    if (!this.isGrounded) {
      this.velocity.y -= this.gravity * dt;
    }

    // Proposed new position
    const nextPos = this.position.clone().addScaledVector(this.velocity, dt);

    // 4. Obstacle collision detection (horizontal push-back)
    const playerBox = new THREE.Box3();
    const boxSize = new THREE.Vector3(this.playerRadius * 1.5, 1.6, this.playerRadius * 1.5);

    this.colliders.forEach(col => {
      if (!col.geometry) return;
      col.updateWorldMatrix(true, false);
      const colBox = new THREE.Box3().setFromObject(col);

      playerBox.setFromCenterAndSize(
        nextPos.clone().add(new THREE.Vector3(0, 0.8, 0)),
        boxSize
      );

      if (playerBox.intersectsBox(colBox)) {
        // Simple pushback along normal
        const diff = nextPos.clone().sub(colBox.getCenter(new THREE.Vector3()));
        diff.y = 0;
        if (diff.lengthSq() > 0.001) {
          diff.normalize();
          nextPos.addScaledVector(diff, 0.06);
        }
      }
    });

    // 5. Ground alignment & height
    const groundHeight = currentWorld ? currentWorld.getTerrainHeight(nextPos.x, nextPos.z) : 0;
    this.currentGroundY = groundHeight;

    if (nextPos.y <= this.currentGroundY) {
      nextPos.y = this.currentGroundY;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    // Apply resolved position
    this.position.copy(nextPos);
    this.avatar.group.position.copy(this.position);
    this.avatar.group.rotation.y = this.facingAngle;

    // 6. Update avatar procedural animation
    const currentHorizSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);

    if (!this.isGrounded) {
      this.avatar.setAnimation('jump');
    } else if (currentHorizSpeed > 0.2) {
      this.avatar.setAnimation(this.isRunning ? 'run' : 'walk');

      // Footstep sound triggering
      this.stepTimer += dt * (this.isRunning ? 11.5 : 7.2);
      if (this.stepTimer >= Math.PI) {
        this.stepTimer = 0;
        if (this.sound) {
          const surface = (currentWorld && currentWorld.id === 'paris') ? 'grass' : 'stone';
          this.sound.playFootstep(surface);
        }
      }
    } else {
      this.avatar.setAnimation('idle');
      this.stepTimer = 0;
    }

    this.avatar.update(dt, currentHorizSpeed);
  }
}
