/**
 * Mobile Touch & Virtual Joystick Controller
 * Provides smooth analog movement on the left screen half,
 * camera orbit swipe on the right screen half, and dedicated action buttons.
 */
export class TouchControls {
  constructor(characterController, cameraController) {
    this.charCtrl = characterController;
    this.camCtrl = cameraController;

    this.joystickTouchId = null;
    this.cameraTouchId = null;

    this.joystickCenter = { x: 0, y: 0 };
    this.joystickRadius = 50; // max travel radius in pixels

    this.prevCamTouch = { x: 0, y: 0 };

    this.domElements = {
      container: document.getElementById('touch-controls'),
      base: document.getElementById('joystick-base'),
      knob: document.getElementById('joystick-knob'),
      btnJump: document.getElementById('btn-touch-jump'),
      btnSprint: document.getElementById('btn-touch-sprint'),
      btnInteract: document.getElementById('btn-touch-interact')
    };

    this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    if (this.isTouchDevice && this.domElements.container) {
      this.domElements.container.style.display = 'block';
      this.setupTouchListeners();
    }
  }

  setupTouchListeners() {
    window.addEventListener('touchstart', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        // Left half of screen: virtual joystick
        if (touch.clientX < window.innerWidth * 0.5 && this.joystickTouchId === null) {
          // If not touching an action button
          if (touch.target.closest('.touch-action-btn')) continue;

          this.joystickTouchId = touch.identifier;
          this.joystickCenter = { x: touch.clientX, y: touch.clientY };

          if (this.domElements.base && this.domElements.knob) {
            this.domElements.base.style.display = 'block';
            this.domElements.base.style.left = `${touch.clientX}px`;
            this.domElements.base.style.top = `${touch.clientY}px`;
            this.domElements.knob.style.transform = `translate(-50%, -50%)`;
          }
        }
        // Right half of screen: camera orbit swipe
        else if (touch.clientX >= window.innerWidth * 0.5 && this.cameraTouchId === null) {
          if (touch.target.closest('.touch-action-btn')) continue;

          this.cameraTouchId = touch.identifier;
          this.prevCamTouch = { x: touch.clientX, y: touch.clientY };
        }
      }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        // Update Joystick
        if (touch.identifier === this.joystickTouchId) {
          e.preventDefault();
          const dx = touch.clientX - this.joystickCenter.x;
          const dy = touch.clientY - this.joystickCenter.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const angle = Math.atan2(dy, dx);
          const clampedDist = Math.min(dist, this.joystickRadius);

          const knobX = Math.cos(angle) * clampedDist;
          const knobY = Math.sin(angle) * clampedDist;

          if (this.domElements.knob) {
            this.domElements.knob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
          }

          // Map to character controller inputs
          const normX = knobX / this.joystickRadius;
          const normY = knobY / this.joystickRadius;

          this.charCtrl.input.right = Math.max(0, normX);
          this.charCtrl.input.left = Math.max(0, -normX);
          this.charCtrl.input.backward = Math.max(0, normY);
          this.charCtrl.input.forward = Math.max(0, -normY);
        }

        // Update Camera Swipe
        if (touch.identifier === this.cameraTouchId) {
          e.preventDefault();
          const deltaX = touch.clientX - this.prevCamTouch.x;
          const deltaY = touch.clientY - this.prevCamTouch.y;

          this.prevCamTouch = { x: touch.clientX, y: touch.clientY };

          this.camCtrl.rotateBy(-deltaX * 0.006, deltaY * 0.006);
        }
      }
    }, { passive: false });

    const handleTouchEnd = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        if (touch.identifier === this.joystickTouchId) {
          this.joystickTouchId = null;
          this.charCtrl.input.forward = 0;
          this.charCtrl.input.backward = 0;
          this.charCtrl.input.left = 0;
          this.charCtrl.input.right = 0;

          if (this.domElements.base) {
            this.domElements.base.style.display = 'none';
          }
        }

        if (touch.identifier === this.cameraTouchId) {
          this.cameraTouchId = null;
        }
      }
    };

    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    // Setup action buttons
    if (this.domElements.btnJump) {
      this.domElements.btnJump.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        if (this.charCtrl.isGrounded) {
          this.charCtrl.velocity.y = this.charCtrl.jumpForce;
          this.charCtrl.isGrounded = false;
          this.charCtrl.avatar.setAnimation('jump');
          if (this.charCtrl.sound) this.charCtrl.sound.playJump();
        }
      });
    }

    if (this.domElements.btnSprint) {
      this.domElements.btnSprint.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        this.charCtrl.input.sprint = !this.charCtrl.input.sprint;
        this.domElements.btnSprint.classList.toggle('active', this.charCtrl.input.sprint);
      });
    }

    if (this.domElements.btnInteract) {
      this.domElements.btnInteract.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('wanderer:interact'));
      });
    }
  }
}
