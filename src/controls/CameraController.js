import * as THREE from '../../vendor/three.module.js';

/**
 * Smooth 3rd-Person Follow & Orbit Camera Controller
 * Features smooth damping, mouse drag/orbit, zoom, and obstacle clipping prevention.
 */
export class CameraController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement || document.body;

    // Orbit coordinates
    this.target = new THREE.Vector3(0, 1.4, 0); // Follow point (avatar chest/head)
    this.distance = 5.6;
    this.targetDistance = 5.6;
    this.minDistance = 2.2;
    this.maxDistance = 14.0;

    this.yaw = 0;       // Horizontal orbit angle
    this.pitch = 0.28;  // Vertical tilt angle (radians)
    this.minPitch = -0.15;
    this.maxPitch = 1.25;

    // Damping speeds
    this.damping = 10.0;
    this.currentPosition = new THREE.Vector3();

    // Mouse drag state
    this.isDragging = false;
    this.prevMouseX = 0;
    this.prevMouseY = 0;

    this.colliders = [];
    this.raycaster = new THREE.Raycaster();

    this.setupListeners();
  }

  setupListeners() {
    // Mouse drag to orbit
    this.domElement.addEventListener('mousedown', (e) => {
      // Allow drag on canvas
      if (e.target.tagName === 'CANVAS') {
        this.isDragging = true;
        this.prevMouseX = e.clientX;
        this.prevMouseY = e.clientY;
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;

      const deltaX = e.clientX - this.prevMouseX;
      const deltaY = e.clientY - this.prevMouseY;

      this.prevMouseX = e.clientX;
      this.prevMouseY = e.clientY;

      const sensitivity = 0.0045;
      this.yaw -= deltaX * sensitivity;
      this.pitch += deltaY * sensitivity;

      this.pitch = THREE.MathUtils.clamp(this.pitch, this.minPitch, this.maxPitch);
    });

    // Mouse wheel zoom
    this.domElement.addEventListener('wheel', (e) => {
      if (e.target.tagName !== 'CANVAS') return;
      this.targetDistance += e.deltaY * 0.005;
      this.targetDistance = THREE.MathUtils.clamp(
        this.targetDistance,
        this.minDistance,
        this.maxDistance
      );
    }, { passive: true });
  }

  setColliders(colliders) {
    this.colliders = colliders || [];
  }

  setTarget(targetPos, immediate = false) {
    this.target.copy(targetPos).add(new THREE.Vector3(0, 1.4, 0));
    if (immediate) {
      this.update(1.0, true);
    }
  }

  rotateBy(deltaYaw, deltaPitch) {
    this.yaw += deltaYaw;
    this.pitch += deltaPitch;
    this.pitch = THREE.MathUtils.clamp(this.pitch, this.minPitch, this.maxPitch);
  }

  update(dt, immediate = false) {
    // Smooth zoom distance
    this.distance = THREE.MathUtils.lerp(
      this.distance,
      this.targetDistance,
      immediate ? 1.0 : dt * this.damping
    );

    // Calculate ideal camera position based on spherical coordinates
    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);
    const sinYaw = Math.sin(this.yaw);
    const cosYaw = Math.cos(this.yaw);

    const offset = new THREE.Vector3(
      this.distance * cosPitch * sinYaw,
      this.distance * sinPitch,
      this.distance * cosPitch * cosYaw
    );

    let desiredPos = this.target.clone().add(offset);

    // Obstacle Raycasting: prevent clipping through walls / plinths
    if (this.colliders.length > 0) {
      const rayOrigin = this.target.clone();
      const rayDir = desiredPos.clone().sub(rayOrigin);
      const rayLength = rayDir.length();
      rayDir.normalize();

      this.raycaster.set(rayOrigin, rayDir);
      this.raycaster.far = rayLength;

      const intersects = this.raycaster.intersectObjects(this.colliders, true);
      if (intersects.length > 0) {
        // Pull camera in front of the hit
        const hitDist = Math.max(1.8, intersects[0].distance - 0.4);
        desiredPos = rayOrigin.clone().addScaledVector(rayDir, hitDist);
      }
    }

    // Apply smooth position lerp
    if (immediate) {
      this.camera.position.copy(desiredPos);
    } else {
      this.camera.position.lerp(desiredPos, Math.min(1.0, dt * this.damping));
    }

    this.camera.lookAt(this.target);
  }
}
