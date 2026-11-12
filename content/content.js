/**
 * Forlabs Helper — Modular Content Script Engine
 * Supports independently toggleable features with zero cross-interference.
 */

(function () {
  'use strict';

  // =========================================================================
  // Zero-Transition State Switch Engine
  // Completely suppresses CSS transitions and animations during any interface state change.
  // =========================================================================
  function runWithoutTransitions(action) {
    const disableStyle = document.createElement('style');
    disableStyle.setAttribute('data-forlabs-instant-switch', 'true');
    disableStyle.textContent = `
      *, *::before, *::after {
        -webkit-transition: none !important;
        -moz-transition: none !important;
        -o-transition: none !important;
        -ms-transition: none !important;
        transition: none !important;
        -webkit-animation: none !important;
        -moz-animation: none !important;
        -o-animation: none !important;
        -ms-animation: none !important;
        animation: none !important;
      }
    `;
    const target = document.head || document.documentElement;
    if (target) {
      target.appendChild(disableStyle);
    }

    try {
      action();
    } finally {
      // Force immediate synchronous layout and computed style recalculation
      if (document.body) {
        void document.body.offsetHeight;
      } else if (document.documentElement) {
        void document.documentElement.offsetHeight;
      }

      // Keep transitions suppressed across render frames to let layout fully settle
      setTimeout(() => {
        try {
          if (disableStyle.parentNode) {
            disableStyle.parentNode.removeChild(disableStyle);
          }
        } catch (e) {}
      }, 80);
    }
  }

  // =========================================================================
  // Module 1: Dark Theme Engine
  // =========================================================================
  const DarkThemeModule = {
    id: 'darkTheme',
    STORAGE_KEY: 'forlabs_dark_theme',
    CLASS_NAME: 'forlabs-dark-theme',
    BUTTON_ID: 'forlabs-theme-toggle-btn',
    isEnabled: true,

    init() {
      // 1. Synchronous anti-FOUC check via localStorage
      try {
        const cached = localStorage.getItem(this.STORAGE_KEY);
        this.isEnabled = cached !== 'false';
      } catch (e) {
        this.isEnabled = true;
      }

      this.applyClass(this.isEnabled);
      this.initButtonObserver();
    },

    applyClass(enable) {
      if (enable) {
        document.documentElement.classList.add(this.CLASS_NAME);
      } else {
        document.documentElement.classList.remove(this.CLASS_NAME);
      }
    },

    setState(enable, saveToStorage = true) {
      this.isEnabled = Boolean(enable);

      runWithoutTransitions(() => {
        this.applyClass(this.isEnabled);
      });

      try {
        localStorage.setItem(this.STORAGE_KEY, this.isEnabled ? 'true' : 'false');
      } catch (e) {
        // Handled silently
      }

      if (saveToStorage && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [this.id]: this.isEnabled });
      }

      this.updateButtonUI();
    },

    toggle() {
      this.setState(!this.isEnabled, true);
    },

    initButtonObserver() {
      const tryInject = () => {
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

      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggle();
      });

      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          this.toggle();
        }
      });

      // Insert strictly to the left of the Profile link
      const profileLink = controlBar.querySelector('a[href*="profile"]');
      if (profileLink) {
        controlBar.insertBefore(button, profileLink);
      } else if (controlBar.firstElementChild) {
        controlBar.insertBefore(button, controlBar.firstElementChild);
      } else {
        controlBar.appendChild(button);
      }

      this.updateButtonUI(button);
    },

    updateButtonUI(btnElement) {
      const button = btnElement || document.getElementById(this.BUTTON_ID);
      if (!button) return;

      const title = this.isEnabled ? 'Тёмная тема (включена)' : 'Светлая тема (включена)';
      const iconClass = this.isEnabled ? 'fa-sun-o' : 'fa-moon-o';

      button.title = title;
      button.setAttribute('aria-label', title);

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

  // =========================================================================
  // Module 2: UI Fixes & Glitch Repairs (ui-select, alignments, etc.)
  // =========================================================================
  const UiFixesModule = {
    id: 'uiFixes',
    STORAGE_KEY: 'forlabs_ui_fixes',
    CLASS_NAME: 'forlabs-ui-fixes',
    isEnabled: true,

    init() {
      try {
        const cached = localStorage.getItem(this.STORAGE_KEY);
        this.isEnabled = cached !== 'false';
      } catch (e) {
        this.isEnabled = true;
      }

      this.applyClass(this.isEnabled);
    },

    applyClass(enable) {
      if (enable) {
        document.documentElement.classList.add(this.CLASS_NAME);
      } else {
        document.documentElement.classList.remove(this.CLASS_NAME);
      }
    },

    setState(enable, saveToStorage = true) {
      this.isEnabled = Boolean(enable);

      runWithoutTransitions(() => {
        this.applyClass(this.isEnabled);
      });

      try {
        localStorage.setItem(this.STORAGE_KEY, this.isEnabled ? 'true' : 'false');
      } catch (e) {
        // Handled silently
      }

      if (saveToStorage && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [this.id]: this.isEnabled });
      }
    }
  };

  // =========================================================================
  // Module 3: Navigation & Hamburger Menu Customization
  // Supports: 'original' (default) | 'compact' (hover) | 'header' (top bar)
  // =========================================================================
  const MenuCustomizationModule = {
    id: 'menuStyle',
    STORAGE_KEY: 'forlabs_menu_style',
    currentStyle: 'original',
    navContainerId: 'forlabs-header-nav',
    observer: null,

    init() {
      // 1. Synchronous anti-FOUC check via localStorage
      try {
        const cached = localStorage.getItem(this.STORAGE_KEY);
        if (cached && ['original', 'compact', 'header'].includes(cached)) {
          this.currentStyle = cached;
        } else {
          this.currentStyle = 'original';
        }
      } catch (e) {
        this.currentStyle = 'original';
      }

      this.applyClass(this.currentStyle);
      this.initHeaderNavSync();
      this.initClickOutsideListener();
    },

    applyClass(style) {
      document.documentElement.classList.remove(
        'forlabs-menu-original',
        'forlabs-menu-compact',
        'forlabs-menu-header'
      );
      if (style === 'compact') {
        document.documentElement.classList.add('forlabs-menu-compact');
      } else if (style === 'header') {
        document.documentElement.classList.add('forlabs-menu-header');
      } else {
        document.documentElement.classList.add('forlabs-menu-original');
      }
    },

    setStyle(style, saveToStorage = true) {
      if (!['original', 'compact', 'header'].includes(style)) return;
      this.currentStyle = style;

      runWithoutTransitions(() => {
        this.applyClass(this.currentStyle);
        this.updateHeaderNav();
      });

      try {
        localStorage.setItem(this.STORAGE_KEY, this.currentStyle);
      } catch (e) {
        // Handled silently
      }

      if (saveToStorage && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [this.id]: this.currentStyle });
      }
    },

    initHeaderNavSync() {
      const checkAndSync = () => {
        this.updateHeaderNav();
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAndSync);
      } else {
        checkAndSync();
      }

      window.addEventListener('resize', () => {
        if (this.currentStyle === 'header') {
          this.positionHeaderSections();
        }
      });

      // Observe DOM for Angular rendering of menu items or route changes
      if (!this.observer) {
        this.observer = new MutationObserver(() => {
          if (this.currentStyle === 'header') {
            this.updateHeaderNav();
          }
        });

        this.observer.observe(document.documentElement, {
          childList: true,
          subtree: true
        });
      }
    },

    initClickOutsideListener() {
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.forlabs-section-item')) {
          document.querySelectorAll('.forlabs-section-item.open').forEach(el => {
            el.classList.remove('open');
          });
        }
      });
    },

    updateHeaderNav() {
      // Clean up legacy container if present
      const oldNav = document.getElementById('forlabs-header-nav');
      if (oldNav) oldNav.remove();

      const existingSections = document.getElementById('forlabs-header-sections');
      const existingDivider = document.getElementById('forlabs-header-divider');

      if (this.currentStyle !== 'header') {
        if (existingSections) existingSections.remove();
        if (existingDivider) existingDivider.remove();
        return;
      }

      const controlBar = document.querySelector('.lm-container-header .lm-control-bar');
      if (!controlBar) return;

      const menuList = document.querySelector('.lm-menu-list');
      if (!menuList) return;

      const menuItems = menuList.querySelectorAll('.lm-menu-list-item');
      if (!menuItems || menuItems.length === 0) return;

      // Extract menu data from LMS Angular elements
      const itemsData = [];
      menuItems.forEach((itemEl, idx) => {
        const link = itemEl.querySelector(':scope > a');
        if (!link) return;

        const iconEl = link.querySelector('.lm-menu-list-item-icon');
        const iconHtml = iconEl ? iconEl.innerHTML.trim() : '';
        const label = link.getAttribute('title') || link.innerText.trim();
        const badgeEl = link.querySelector('.badge');
        const badgeText = badgeEl ? badgeEl.innerText.trim() : '';
        const isActive = itemEl.classList.contains('active');
        const href = link.getAttribute('href') || link.getAttribute('ng-href') || '#';

        // Check for subitems
        const subList = itemEl.querySelector('.lm-menu-sub-list');
        const subitemsData = [];
        if (subList) {
          const subItemEls = subList.querySelectorAll('.lm-menu-sub-list-item');
          subItemEls.forEach((subEl, subIdx) => {
            const subLink = subEl.querySelector('a');
            if (!subLink) return;
            const subIconEl = subLink.querySelector('.lm-menu-list-item-icon');
            const subIconHtml = subIconEl ? subIconEl.innerHTML.trim() : '';
            const subLabel = subLink.getAttribute('title') || subLink.innerText.trim();
            const subHref = subLink.getAttribute('href') || subLink.getAttribute('ng-href') || '#';
            const isSubActive = subEl.classList.contains('active');
            subitemsData.push({
              index: subIdx,
              subEl,
              subLink,
              label: subLabel,
              href: subHref,
              iconHtml: subIconHtml,
              isActive: isSubActive
            });
          });
        }

        itemsData.push({
          index: idx,
          itemEl,
          link,
          label,
          href,
          iconHtml,
          badgeText,
          isActive,
          hasSubmenu: subitemsData.length > 0,
          submenu: subitemsData
        });
      });

      // Avoid redundant DOM replacement if item count & active states match
      const currentSignature = itemsData.map(d => `${d.label}:${d.isActive}:${d.submenu.map(s => s.isActive).join(',')}`).join('|');
      if (existingSections && existingSections.dataset.signature === currentSignature) {
        this.positionHeaderSections();
        return;
      }

      // Create or update sections group
      let sectionsGroup = existingSections;
      if (!sectionsGroup) {
        sectionsGroup = document.createElement('div');
        sectionsGroup.id = 'forlabs-header-sections';
        sectionsGroup.className = 'forlabs-header-sections-group';
      }
      sectionsGroup.dataset.signature = currentSignature;

      if (existingDivider) {
        existingDivider.remove();
      }

      // Build HTML: section buttons look identical to .lm-control-bar-item
      sectionsGroup.innerHTML = itemsData.map(item => `
        <div class="forlabs-section-item ${item.isActive ? 'active' : ''} ${item.hasSubmenu ? 'with-dropdown' : ''}" data-index="${item.index}">
          <span class="lm-control-bar-item forlabs-section-btn ${item.isActive ? 'active' : ''}" role="button" tabindex="0" title="${this.escapeHtml(item.label)}" aria-label="${this.escapeHtml(item.label)}">
            ${item.iconHtml}
            ${item.badgeText ? `<span class="forlabs-section-badge">${this.escapeHtml(item.badgeText)}</span>` : ''}
            ${item.hasSubmenu ? `<span class="forlabs-dropdown-caret fa fa-caret-down"></span>` : ''}
          </span>
          ${item.hasSubmenu ? `
            <div class="forlabs-header-dropdown">
              ${item.submenu.map(sub => `
                <a href="${this.escapeHtml(sub.href)}" class="forlabs-header-dropdown-item ${sub.isActive ? 'active' : ''}" data-subindex="${sub.index}" title="${this.escapeHtml(sub.label)}">
                  ${sub.iconHtml ? `<span class="forlabs-header-dropdown-icon">${sub.iconHtml}</span>` : ''}
                  <span>${this.escapeHtml(sub.label)}</span>
                </a>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `).join('');

      // Insert sectionsGroup directly into .lm-container-header
      const containerHeader = controlBar.closest('.lm-container-header') || controlBar.parentElement;
      if (containerHeader && sectionsGroup.parentElement !== containerHeader) {
        containerHeader.appendChild(sectionsGroup);
      }

      // Attach click events to drive native Angular navigation
      sectionsGroup.querySelectorAll('.forlabs-section-item').forEach(wrapper => {
        const idx = parseInt(wrapper.getAttribute('data-index'), 10);
        const data = itemsData[idx];
        if (!data) return;

        const btn = wrapper.querySelector('.forlabs-section-btn');
        if (data.hasSubmenu) {
          // If has submenu, toggle dropdown on button click
          btn?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const wasOpen = wrapper.classList.contains('open');
            document.querySelectorAll('.forlabs-section-item.open').forEach(el => el.classList.remove('open'));
            if (!wasOpen) {
              wrapper.classList.add('open');
            }
          });

          // Submenu items click
          wrapper.querySelectorAll('.forlabs-header-dropdown-item').forEach(subLinkEl => {
            const subIdx = parseInt(subLinkEl.getAttribute('data-subindex'), 10);
            const subData = data.submenu[subIdx];
            subLinkEl.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              wrapper.classList.remove('open');
              if (subData && subData.subLink) {
                subData.subLink.click();
              }
            });
          });
        } else {
          btn?.addEventListener('click', (e) => {
            e.preventDefault();
            if (data.link) {
              data.link.click();
            }
          });
        }
      });

      this.positionHeaderSections();
    },

    positionHeaderSections() {
      if (this.currentStyle !== 'header') return;

      const sectionsGroup = document.getElementById('forlabs-header-sections');
      if (!sectionsGroup) return;

      const containerHeader = document.querySelector('.lm-container-header');
      if (!containerHeader) return;

      const headerRect = containerHeader.getBoundingClientRect();
      if (!headerRect.width) return;

      // 1. Left boundary: right edge of the search bar input/control
      const searchControl = containerHeader.querySelector('.lm-search-control') ||
                            containerHeader.querySelector('.lm-global-search') ||
                            document.querySelector('#global-search-input-control');

      let leftBoundary = 0;
      if (searchControl) {
        const searchRect = searchControl.getBoundingClientRect();
        leftBoundary = searchRect.right - headerRect.left;
      } else {
        leftBoundary = 375;
      }

      // 2. Right boundary: left edge of the right controls group (theme toggle, profile, logout)
      const controlBar = containerHeader.querySelector('.lm-control-bar');
      let rightBoundary = headerRect.width;
      if (controlBar) {
        const controlRect = controlBar.getBoundingClientRect();
        rightBoundary = controlRect.left - headerRect.left;
      }

      // 3. Center sectionsGroup in the space between leftBoundary and rightBoundary
      const availableSpace = rightBoundary - leftBoundary;
      const sectionsWidth = sectionsGroup.offsetWidth || (sectionsGroup.children.length * 50) || 300;

      if (availableSpace > sectionsWidth) {
        const targetLeft = Math.round(leftBoundary + (availableSpace - sectionsWidth) / 2);
        sectionsGroup.style.left = `${targetLeft}px`;
      } else {
        sectionsGroup.style.left = `${Math.max(10, Math.round(leftBoundary + 10))}px`;
      }
    },

    escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  };

  // =========================================================================
  // Module 4: Custom Scrollbar Engine
  // =========================================================================
  const CustomScrollbarModule = {
    id: 'customScrollbar',
    STORAGE_KEY: 'forlabs_custom_scrollbar',
    CLASS_NAME: 'forlabs-custom-scrollbar',
    isEnabled: true,

    init() {
      try {
        const cached = localStorage.getItem(this.STORAGE_KEY);
        this.isEnabled = cached !== 'false';
      } catch (e) {
        this.isEnabled = true;
      }
      this.applyClass(this.isEnabled);
    },

    applyClass(enable) {
      if (enable) {
        document.documentElement.classList.add(this.CLASS_NAME);
      } else {
        document.documentElement.classList.remove(this.CLASS_NAME);
      }
    },

    setState(enable, saveToStorage = true) {
      this.isEnabled = Boolean(enable);

      runWithoutTransitions(() => {
        this.applyClass(this.isEnabled);
      });

      try {
        localStorage.setItem(this.STORAGE_KEY, this.isEnabled ? 'true' : 'false');
      } catch (e) {
        // Handled silently
      }

      if (saveToStorage && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [this.id]: this.isEnabled });
      }
    },

    toggle() {
      this.setState(!this.isEnabled, true);
    }
  };

  // =========================================================================
  // Module 5: Rounded Interface Engine (Скругленный интерфейс)
  // =========================================================================
  const RoundedInterfaceModule = {
    id: 'roundedInterface',
    STORAGE_KEY: 'forlabs_rounded_interface',
    CLASS_NAME: 'forlabs-rounded-interface',
    isEnabled: false,

    init() {
      try {
        const cached = localStorage.getItem(this.STORAGE_KEY);
        this.isEnabled = cached === 'true';
      } catch (e) {
        this.isEnabled = false;
      }
      this.ensureStylesInjected();
      this.applyClass(this.isEnabled);
    },

    ensureStylesInjected() {
      if (document.getElementById('forlabs-rounded-interface-link')) return;
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
          const link = document.createElement('link');
          link.id = 'forlabs-rounded-interface-link';
          link.rel = 'stylesheet';
          link.href = chrome.runtime.getURL('content/rounded-interface.css');
          (document.head || document.documentElement).appendChild(link);
        }
      } catch (e) {
        // Handled silently
      }
    },

    applyClass(enable) {
      if (enable) {
        document.documentElement.classList.add(this.CLASS_NAME);
      } else {
        document.documentElement.classList.remove(this.CLASS_NAME);
      }
    },

    setState(enable, saveToStorage = true) {
      this.isEnabled = Boolean(enable);

      runWithoutTransitions(() => {
        this.applyClass(this.isEnabled);
      });

      try {
        localStorage.setItem(this.STORAGE_KEY, this.isEnabled ? 'true' : 'false');
      } catch (e) {
        // Handled silently
      }

      if (saveToStorage && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [this.id]: this.isEnabled });
      }
    },

    toggle() {
      this.setState(!this.isEnabled, true);
    }
  };

  // =========================================================================
  // Module 6: Glassmorphism Engine
  // =========================================================================
  const GlassmorphismModule = {
    id: 'glassmorphism',
    STORAGE_KEY: 'forlabs_glassmorphism',
    CLASS_NAME: 'forlabs-glassmorphism',
    isEnabled: false,

    init() {
      try {
        const cached = localStorage.getItem(this.STORAGE_KEY);
        this.isEnabled = cached === 'true';
      } catch (e) {
        this.isEnabled = false;
      }
      this.ensureStylesInjected();
      this.applyClass(this.isEnabled);
    },

    ensureStylesInjected() {
      if (document.getElementById('forlabs-glassmorphism-link')) return;
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
          const link = document.createElement('link');
          link.id = 'forlabs-glassmorphism-link';
          link.rel = 'stylesheet';
          link.href = chrome.runtime.getURL('content/glassmorphism.css');
          (document.head || document.documentElement).appendChild(link);
        }
      } catch (e) {
        // Handled silently
      }
    },

    applyClass(enable) {
      if (enable) {
        document.documentElement.classList.add(this.CLASS_NAME);
      } else {
        document.documentElement.classList.remove(this.CLASS_NAME);
      }
    },

    setState(enable, saveToStorage = true) {
      this.isEnabled = Boolean(enable);

      runWithoutTransitions(() => {
        this.applyClass(this.isEnabled);
      });

      try {
        localStorage.setItem(this.STORAGE_KEY, this.isEnabled ? 'true' : 'false');
      } catch (e) {
        // Handled silently
      }

      if (saveToStorage && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [this.id]: this.isEnabled });
      }
    },

    toggle() {
      this.setState(!this.isEnabled, true);
    }
  };

  // =========================================================================
  // Module 7: Color Themes Engine
  // Supports: 'default' | 'purple' | 'vkusno'
  // =========================================================================
  const ColorThemesModule = {
    id: 'colorTheme',
    STORAGE_KEY: 'forlabs_color_theme',
    currentTheme: 'default',
    supportedThemes: ['default', 'purple', 'vkusno'],

    init() {
      try {
        const cached = localStorage.getItem(this.STORAGE_KEY);
        if (cached && this.supportedThemes.includes(cached)) {
          this.currentTheme = cached;
        } else {
          this.currentTheme = 'default';
        }
      } catch (e) {
        this.currentTheme = 'default';
      }

      this.ensureStylesInjected();
      this.setupLandingAssets();
      this.applyClass(this.currentTheme);
    },

    setupLandingAssets() {
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
          const bgUrl = chrome.runtime.getURL('content/IWent.png');
          document.documentElement.style.setProperty('--fl-vkusno-landing-bg', `url("${bgUrl}")`);
        }
      } catch (e) {
        // Handled silently
      }

      const markLanding = () => {
        if (
          location.pathname === '/' ||
          location.pathname === '' ||
          location.pathname === '/index.php' ||
          location.pathname === '/index.html' ||
          document.querySelector('.bg-pale') ||
          document.querySelector('.big-logo')
        ) {
          document.documentElement.classList.add('forlabs-landing-page');
          if (document.body) {
            document.body.classList.add('forlabs-landing-body');
          }
        }
      };

      markLanding();
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', markLanding, { once: true });
      }
    },

    ensureStylesInjected() {
      if (document.getElementById('forlabs-color-themes-link')) return;
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
          const link = document.createElement('link');
          link.id = 'forlabs-color-themes-link';
          link.rel = 'stylesheet';
          link.href = chrome.runtime.getURL('content/color-themes.css');
          (document.head || document.documentElement).appendChild(link);
        }
      } catch (e) {
        // Handled silently
      }
    },

    applyClass(theme) {
      for (const t of this.supportedThemes) {
        document.documentElement.classList.remove(`forlabs-theme-${t}`);
      }
      document.documentElement.classList.add(`forlabs-theme-${theme}`);
    },

    setTheme(theme, saveToStorage = true) {
      if (!this.supportedThemes.includes(theme)) return;
      this.currentTheme = theme;

      runWithoutTransitions(() => {
        this.applyClass(this.currentTheme);
      });

      try {
        localStorage.setItem(this.STORAGE_KEY, this.currentTheme);
      } catch (e) {
        // Handled silently
      }

      if (saveToStorage && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [this.id]: this.currentTheme });
      }
    }
  };

  // =========================================================================
  // Central Module Coordinator
  // =========================================================================
  const ModuleManager = {
    modules: {
      darkTheme: DarkThemeModule,
      uiFixes: UiFixesModule,
      menuStyle: MenuCustomizationModule,
      customScrollbar: CustomScrollbarModule,
      roundedInterface: RoundedInterfaceModule,
      glassmorphism: GlassmorphismModule,
      colorTheme: ColorThemesModule
    },

    init() {
      // 1. Initialize all modules synchronously
      for (const key of Object.keys(this.modules)) {
        try {
          this.modules[key].init();
        } catch (err) {
          console.error(`[Forlabs Helper] Failed to init module "${key}":`, err);
        }
      }

      // 2. Sync with chrome.storage.local
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const defaults = {
          darkTheme: this.modules.darkTheme.isEnabled,
          uiFixes: this.modules.uiFixes.isEnabled,
          menuStyle: this.modules.menuStyle.currentStyle,
          customScrollbar: this.modules.customScrollbar.isEnabled,
          roundedInterface: this.modules.roundedInterface.isEnabled,
          glassmorphism: this.modules.glassmorphism.isEnabled,
          colorTheme: this.modules.colorTheme.currentTheme
        };

        chrome.storage.local.get(defaults, (res) => {
          runWithoutTransitions(() => {
            for (const [key, val] of Object.entries(res)) {
              if (this.modules[key]) {
                if (key === 'menuStyle' && typeof val === 'string' && val !== this.modules.menuStyle.currentStyle) {
                  try {
                    this.modules.menuStyle.setStyle(val, false);
                  } catch (err) {
                    console.error(`[Forlabs Helper] Error syncing module "${key}":`, err);
                  }
                } else if (key === 'colorTheme' && typeof val === 'string' && val !== this.modules.colorTheme.currentTheme) {
                  try {
                    this.modules.colorTheme.setTheme(val, false);
                  } catch (err) {
                    console.error(`[Forlabs Helper] Error syncing module "${key}":`, err);
                  }
                } else if (typeof val === 'boolean' && val !== this.modules[key].isEnabled) {
                  try {
                    this.modules[key].setState(val, false);
                  } catch (err) {
                    console.error(`[Forlabs Helper] Error syncing module "${key}":`, err);
                  }
                }
              }
            }
          });
        });

        // 3. Listen for live state updates from popup
        chrome.storage.onChanged.addListener((changes, area) => {
          if (area !== 'local') return;
          runWithoutTransitions(() => {
            for (const [key, change] of Object.entries(changes)) {
              if (this.modules[key]) {
                if (key === 'menuStyle' && typeof change.newValue === 'string') {
                  try {
                    this.modules.menuStyle.setStyle(change.newValue, false);
                  } catch (err) {
                    console.error(`[Forlabs Helper] Error updating module "${key}":`, err);
                  }
                } else if (key === 'colorTheme' && typeof change.newValue === 'string') {
                  try {
                    this.modules.colorTheme.setTheme(change.newValue, false);
                  } catch (err) {
                    console.error(`[Forlabs Helper] Error updating module "${key}":`, err);
                  }
                } else if (typeof change.newValue === 'boolean') {
                  try {
                    this.modules[key].setState(change.newValue, false);
                  } catch (err) {
                    console.error(`[Forlabs Helper] Error updating module "${key}":`, err);
                  }
                }
              }
            }
          });
        });
      }
    }
  };

  ModuleManager.init();
})();
