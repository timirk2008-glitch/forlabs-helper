/**
 * Forlabs Helper — Content Script
 * Minimal, native integration for bki.forlabs.ru
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. Theme Manager (Dark / Light Theme Engine)
  // =========================================================================
  const ThemeManager = {
    STORAGE_KEY: 'forlabs_dark_theme',
    CLASS_NAME: 'forlabs-dark-theme',
    BUTTON_ID: 'forlabs-theme-toggle-btn',
    isDark: true,

    init() {
      // 1. Synchronous anti-FOUC check via localStorage (defensive try/catch)
      try {
        const cached = localStorage.getItem(this.STORAGE_KEY);
        this.isDark = cached !== 'false';
      } catch (e) {
        this.isDark = true;
      }

      if (this.isDark) {
        document.documentElement.classList.add(this.CLASS_NAME);
      } else {
        document.documentElement.classList.remove(this.CLASS_NAME);
      }

      // 2. Sync with chrome.storage.local
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get({ darkTheme: this.isDark }, (res) => {
          // Avoid redundant DOM reflow on init if already in sync
          if (typeof res.darkTheme === 'boolean' && res.darkTheme !== this.isDark) {
            this.setTheme(res.darkTheme, false);
          }
        });

        chrome.storage.onChanged.addListener((changes, area) => {
          if (area === 'local' && 'darkTheme' in changes) {
            this.setTheme(changes.darkTheme.newValue, false);
          }
        });
      }

      // 3. Inject Toggle Button into .lm-control-bar
      this.initButtonObserver();
    },

    setTheme(enableDark, saveToStorage = true) {
      this.isDark = Boolean(enableDark);

      // Disable transitions temporarily during theme switch for a sharp, instant transition
      const disableStyle = document.createElement('style');
      disableStyle.textContent = `
        *, *::before, *::after {
          transition: none !important;
        }
      `;
      (document.head || document.documentElement).appendChild(disableStyle);

      if (this.isDark) {
        document.documentElement.classList.add(this.CLASS_NAME);
      } else {
        document.documentElement.classList.remove(this.CLASS_NAME);
      }

      // Force synchronous style recalculation
      if (document.body) {
        void document.body.offsetHeight;
      }

      // Re-enable normal transitions after reflow and paint
      setTimeout(() => {
        if (disableStyle.parentNode) {
          disableStyle.parentNode.removeChild(disableStyle);
        }
      }, 50);

      try {
        localStorage.setItem(this.STORAGE_KEY, this.isDark ? 'true' : 'false');
      } catch (e) {
        // Handled silently if storage is restricted
      }

      if (saveToStorage && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ darkTheme: this.isDark });
      }

      this.updateButtonUI();
    },

    toggleTheme() {
      this.setTheme(!this.isDark, true);
    },

    // =======================================================================
    // 2. Control Bar Button Injection (Native .lm-control-bar-item)
    // =======================================================================
    initButtonObserver() {
      const tryInject = () => {
        // Fast O(1) DOM check: exit immediately if button is already present
        if (document.getElementById(this.BUTTON_ID)) {
          return;
        }
        const controlBar = document.querySelector('.lm-control-bar');
        if (controlBar) {
          this.injectButton(controlBar);
        }
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryInject);
      } else {
        tryInject();
      }

      // Watch for SPA route changes and re-renders
      const observer = new MutationObserver(() => {
        tryInject();
      });

      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    },

    injectButton(controlBar) {
      if (document.getElementById(this.BUTTON_ID)) {
        return;
      }

      const button = document.createElement('span');
      button.id = this.BUTTON_ID;
      button.className = 'lm-control-bar-item forlabs-theme-toggle-btn';
      button.setAttribute('role', 'button');
      button.setAttribute('tabindex', '0');

      // Click handler
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleTheme();
      });

      // Keyboard navigation (Enter / Space) - WAI-ARIA authoring practice
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          this.toggleTheme();
        }
      });

      // Insert strictly to the left of the Profile link
      if (controlBar.firstElementChild) {
        controlBar.insertBefore(button, controlBar.firstElementChild);
      } else {
        controlBar.appendChild(button);
      }

      this.updateButtonUI(button);
    },

    updateButtonUI(btnElement) {
      const button = btnElement || document.getElementById(this.BUTTON_ID);
      if (!button) return;

      const title = this.isDark ? 'Тёмная тема (включена)' : 'Светлая тема (включена)';
      const iconClass = this.isDark ? 'fa-sun-o' : 'fa-moon-o';

      button.title = title;
      button.setAttribute('aria-label', title);

      // Safe DOM update without innerHTML parsing
      let icon = button.querySelector('span.fa');
      if (!icon) {
        icon = document.createElement('span');
        icon.className = `fa ${iconClass}`;
        button.appendChild(icon);
      } else {
        icon.className = `fa ${iconClass}`;
      }
    }
  };

  ThemeManager.init();
})();
