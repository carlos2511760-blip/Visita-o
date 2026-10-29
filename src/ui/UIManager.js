/**
 * UI & HUD Manager
 * Directly implements the Messenger Design System aesthetics:
 * glassmorphic surfaces, capsule action buttons, typewriter dialogues,
 * reaction emote bar, photo mode with instant snapshot download,
 * and avatar customization.
 */
export class UIManager {
  constructor(game) {
    this.game = game;
    this.sound = game.sound;

    this.activeDialogue = null;
    this.typewriterTimer = null;
    this.currentNearbyInteractable = null;

    this.bindDOM();
    this.bindEvents();
  }

  bindDOM() {
    this.dom = {
      titleScreen: document.getElementById('title-screen'),
      btnStart: document.getElementById('btn-start-game'),

      hud: document.getElementById('hud'),
      destinationBadge: document.getElementById('hud-destination-name'),
      btnChangeDest: document.getElementById('btn-change-destination'),
      btnMute: document.getElementById('btn-mute'),
      btnPhoto: document.getElementById('btn-photo-mode'),
      btnCustomize: document.getElementById('btn-customize-avatar'),
      btnJournal: document.getElementById('btn-journal'),

      interactionPrompt: document.getElementById('interaction-prompt'),
      promptKey: document.getElementById('prompt-key'),
      promptText: document.getElementById('prompt-text'),

      dialogueBox: document.getElementById('dialogue-box'),
      dialogueSpeaker: document.getElementById('dialogue-speaker'),
      dialogueText: document.getElementById('dialogue-text'),
      dialogueClose: document.getElementById('dialogue-close'),

      emoteBar: document.getElementById('emote-bar'),

      photoOverlay: document.getElementById('photo-overlay'),
      photoLocationText: document.getElementById('photo-location-text'),
      photoDateText: document.getElementById('photo-date-text'),
      btnTakePhoto: document.getElementById('btn-take-photo'),
      btnExitPhoto: document.getElementById('btn-exit-photo'),
      photoFlash: document.getElementById('photo-flash'),

      destModal: document.getElementById('modal-destinations'),
      destClose: document.getElementById('modal-dest-close'),
      destCards: document.querySelectorAll('.dest-card'),

      customModal: document.getElementById('modal-customizer'),
      customClose: document.getElementById('modal-custom-close'),
      colorPickers: document.querySelectorAll('.palette-color-btn'),
      hatPickers: document.querySelectorAll('.hat-select-btn'),

      journalModal: document.getElementById('modal-journal'),
      journalClose: document.getElementById('modal-journal-close'),
      journalList: document.getElementById('journal-list')
    };
  }

  bindEvents() {
    // Start Game Button
    if (this.dom.btnStart) {
      this.dom.btnStart.addEventListener('click', () => {
        this.game.start();
        this.dom.titleScreen.style.opacity = '0';
        setTimeout(() => {
          this.dom.titleScreen.style.display = 'none';
          this.dom.hud.style.display = 'block';
        }, 500);
      });
    }

    // Audio Mute Toggle
    if (this.dom.btnMute) {
      this.dom.btnMute.addEventListener('click', () => {
        const isMuted = this.sound.toggleMute();
        this.dom.btnMute.textContent = isMuted ? '🔇 Mudo' : '🔊 Som';
        this.dom.btnMute.classList.toggle('muted', isMuted);
      });
    }

    // Destination Switcher Modal
    if (this.dom.btnChangeDest) {
      this.dom.btnChangeDest.addEventListener('click', () => {
        this.openModal(this.dom.destModal);
      });
    }
    if (this.dom.destClose) {
      this.dom.destClose.addEventListener('click', () => {
        this.closeModal(this.dom.destModal);
      });
    }
    this.dom.destCards.forEach(card => {
      card.addEventListener('click', () => {
        const destId = card.getAttribute('data-dest');
        this.closeModal(this.dom.destModal);
        this.game.switchWorld(destId);
      });
    });

    // Emote Buttons
    if (this.dom.emoteBar) {
      this.dom.emoteBar.addEventListener('click', (e) => {
        const btn = e.target.closest('.emote-btn');
        if (!btn) return;
        const emoji = btn.getAttribute('data-emoji');
        this.game.triggerPlayerEmote(emoji);
      });
    }

    // Photo Mode
    if (this.dom.btnPhoto) {
      this.dom.btnPhoto.addEventListener('click', () => {
        this.enterPhotoMode();
      });
    }
    if (this.dom.btnExitPhoto) {
      this.dom.btnExitPhoto.addEventListener('click', () => {
        this.exitPhotoMode();
      });
    }
    if (this.dom.btnTakePhoto) {
      this.dom.btnTakePhoto.addEventListener('click', () => {
        this.capturePhoto();
      });
    }

    // Avatar Customizer Modal
    if (this.dom.btnCustomize) {
      this.dom.btnCustomize.addEventListener('click', () => {
        this.openModal(this.dom.customModal);
      });
    }
    if (this.dom.customClose) {
      this.dom.customClose.addEventListener('click', () => {
        this.closeModal(this.dom.customModal);
      });
    }

    this.dom.colorPickers.forEach(btn => {
      btn.addEventListener('click', () => {
        const part = btn.getAttribute('data-part');
        const color = parseInt(btn.getAttribute('data-color'), 16);
        this.game.player.avatar.setPalette({ [part]: color });

        // Highlight selected
        document.querySelectorAll(`.palette-color-btn[data-part="${part}"]`).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (this.sound) this.sound.playDialogueBlip(1.2);
      });
    });

    this.dom.hatPickers.forEach(btn => {
      btn.addEventListener('click', () => {
        const hat = btn.getAttribute('data-hat');
        this.game.player.avatar.applyHat(hat);

        this.dom.hatPickers.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (this.sound) this.sound.playDialogueBlip(1.2);
      });
    });

    // Journal Modal
    if (this.dom.btnJournal) {
      this.dom.btnJournal.addEventListener('click', () => {
        this.renderJournal();
        this.openModal(this.dom.journalModal);
      });
    }
    if (this.dom.journalClose) {
      this.dom.journalClose.addEventListener('click', () => {
        this.closeModal(this.dom.journalModal);
      });
    }

    // Dialogue interaction click or key
    if (this.dom.dialogueBox) {
      this.dom.dialogueBox.addEventListener('click', () => {
        this.advanceOrCloseDialogue();
      });
    }
    if (this.dom.dialogueClose) {
      this.dom.dialogueClose.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeDialogue();
      });
    }

    // Interaction key (E)
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyE') {
        this.triggerInteraction();
      }
    });

    window.addEventListener('wanderer:interact', () => {
      this.triggerInteraction();
    });
  }

  setDestinationName(name) {
    if (this.dom.destinationBadge) {
      this.dom.destinationBadge.textContent = name;
    }
  }

  showInteractionPrompt(text, key = 'E') {
    if (!this.dom.interactionPrompt) return;
    this.dom.promptKey.textContent = key;
    this.dom.promptText.textContent = text;
    this.dom.interactionPrompt.style.display = 'flex';
  }

  hideInteractionPrompt() {
    if (this.dom.interactionPrompt) {
      this.dom.interactionPrompt.style.display = 'none';
    }
  }

  triggerInteraction() {
    if (this.activeDialogue) {
      this.advanceOrCloseDialogue();
      return;
    }

    if (this.currentNearbyInteractable) {
      const { type, object } = this.currentNearbyInteractable;
      if (type === 'npc') {
        const text = object.getNextDialogue();
        this.showDialogue(object.name, text);
      } else if (type === 'poi') {
        object.visited = true;
        this.showDialogue(object.title, object.desc);
      }
    }
  }

  showDialogue(speaker, fullText) {
    if (!this.dom.dialogueBox) return;

    this.activeDialogue = { speaker, fullText };
    this.dom.dialogueSpeaker.textContent = speaker;
    this.dom.dialogueText.textContent = '';
    this.dom.dialogueBox.style.display = 'flex';

    if (this.typewriterTimer) clearInterval(this.typewriterTimer);

    let charIdx = 0;
    this.typewriterTimer = setInterval(() => {
      if (charIdx < fullText.length) {
        this.dom.dialogueText.textContent += fullText[charIdx];
        if (charIdx % 3 === 0 && this.sound) {
          this.sound.playDialogueBlip(1.0);
        }
        charIdx++;
      } else {
        clearInterval(this.typewriterTimer);
        this.typewriterTimer = null;
      }
    }, 22);
  }

  advanceOrCloseDialogue() {
    if (this.typewriterTimer) {
      // Complete text instantly
      clearInterval(this.typewriterTimer);
      this.typewriterTimer = null;
      this.dom.dialogueText.textContent = this.activeDialogue.fullText;
    } else {
      this.closeDialogue();
    }
  }

  closeDialogue() {
    if (this.dom.dialogueBox) {
      this.dom.dialogueBox.style.display = 'none';
    }
    this.activeDialogue = null;
  }

  // --- Photo Mode ---

  enterPhotoMode() {
    this.dom.hud.style.display = 'none';
    this.dom.photoOverlay.style.display = 'flex';

    this.dom.photoLocationText.textContent = this.game.currentWorld.name;
    const now = new Date();
    this.dom.photoDateText.textContent = now.toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  exitPhotoMode() {
    this.dom.photoOverlay.style.display = 'none';
    this.dom.hud.style.display = 'block';
  }

  capturePhoto() {
    if (this.sound) this.sound.playPhotoShutter();

    // Trigger flash animation
    this.dom.photoFlash.style.opacity = '0.9';
    setTimeout(() => {
      this.dom.photoFlash.style.opacity = '0';
    }, 250);

    // Hide viewfinder frame momentarily for clean capture
    this.dom.photoOverlay.querySelector('.photo-viewfinder').style.display = 'none';

    // Render frame to ensure clean snapshot
    this.game.renderer.render(this.game.scene, this.game.camera);

    setTimeout(() => {
      try {
        const dataUrl = this.game.renderer.domElement.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `wanderer-${this.game.currentWorld.id}-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.warn('Screenshot capture fallback:', err);
      }
      this.dom.photoOverlay.querySelector('.photo-viewfinder').style.display = 'block';
    }, 50);
  }

  // --- Travel Journal Modal ---

  renderJournal() {
    if (!this.dom.journalList || !this.game.currentWorld) return;
    this.dom.journalList.innerHTML = '';

    this.game.currentWorld.pois.forEach(poi => {
      const item = document.createElement('div');
      item.className = `journal-item ${poi.visited ? 'visited' : ''}`;
      item.innerHTML = `
        <div class="journal-item-status">${poi.visited ? '✓ Descoberto' : '○ Não Visitado'}</div>
        <div class="journal-item-title">${poi.title}</div>
        <div class="journal-item-desc">${poi.visited ? poi.desc : 'Explore o local para desbloquear este relato.'}</div>
      `;
      this.dom.journalList.appendChild(item);
    });
  }

  openModal(modal) {
    if (modal) {
      modal.style.display = 'flex';
      setTimeout(() => modal.classList.add('show'), 10);
    }
  }

  closeModal(modal) {
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => modal.style.display = 'none', 200);
    }
  }
}
