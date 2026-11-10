/**
 * Forlabs Helper — Popup Script
 * Generic, modular settings coordinator
 */

document.addEventListener('DOMContentLoaded', () => {
  // Theme module UI elements
  const themeToggle = document.getElementById('theme-toggle');
  const moonIcon = document.getElementById('moon-icon');
  const sunIcon = document.getElementById('sun-icon');
  const themeIconWrap = document.getElementById('theme-icon-wrap');

  // UI Fixes module UI elements
  const uiFixesToggle = document.getElementById('uifixes-toggle');
  const uiFixesIconWrap = document.getElementById('uifixes-icon-wrap');

  // Custom Scrollbar module UI elements
  const scrollbarToggle = document.getElementById('scrollbar-toggle');
  const scrollbarIconWrap = document.getElementById('scrollbar-icon-wrap');

  // Rounded Interface module UI elements
  const roundedToggle = document.getElementById('rounded-toggle');
  const roundedIconWrap = document.getElementById('rounded-icon-wrap');

  // Glassmorphism module UI elements
  const glassmorphismToggle = document.getElementById('glassmorphism-toggle');
  const glassmorphismIconWrap = document.getElementById('glassmorphism-icon-wrap');

  // Navigation Style module UI elements
  const menuStyleSelect = document.getElementById('menu-style-select');
  const menuIconOriginal = document.getElementById('menu-icon-original');
  const menuIconCompact = document.getElementById('menu-icon-compact');
  const menuIconHeader = document.getElementById('menu-icon-header');

  function updateThemeUI(isDark) {
    if (!themeToggle) return;
    themeToggle.checked = Boolean(isDark);
    if (isDark) {
      moonIcon?.classList.add('hidden');
      sunIcon?.classList.remove('hidden');
      themeIconWrap?.classList.add('active');
    } else {
      moonIcon?.classList.remove('hidden');
      sunIcon?.classList.add('hidden');
      themeIconWrap?.classList.remove('active');
    }
  }

  function updateUiFixesUI(isEnabled) {
    if (!uiFixesToggle) return;
    uiFixesToggle.checked = Boolean(isEnabled);
    if (isEnabled) {
      uiFixesIconWrap?.classList.remove('disabled');
    } else {
      uiFixesIconWrap?.classList.add('disabled');
    }
  }

  function updateScrollbarUI(isEnabled) {
    if (!scrollbarToggle) return;
    scrollbarToggle.checked = Boolean(isEnabled);
    if (isEnabled) {
      scrollbarIconWrap?.classList.remove('disabled');
    } else {
      scrollbarIconWrap?.classList.add('disabled');
    }
  }

  function updateRoundedUI(isEnabled) {
    if (!roundedToggle) return;
    roundedToggle.checked = Boolean(isEnabled);
    if (isEnabled) {
      roundedIconWrap?.classList.remove('disabled');
    } else {
      roundedIconWrap?.classList.add('disabled');
    }
  }

  function updateGlassmorphismUI(isEnabled) {
    if (!glassmorphismToggle) return;
    glassmorphismToggle.checked = Boolean(isEnabled);
    if (isEnabled) {
      glassmorphismIconWrap?.classList.remove('disabled');
    } else {
      glassmorphismIconWrap?.classList.add('disabled');
    }
  }

  function updateMenuStyleUI(style) {
    const targetStyle = ['original', 'compact', 'header'].includes(style) ? style : 'original';
    if (menuStyleSelect) {
      menuStyleSelect.value = targetStyle;
    }
    menuIconOriginal?.classList.toggle('hidden', targetStyle !== 'original');
    menuIconCompact?.classList.toggle('hidden', targetStyle !== 'compact');
    menuIconHeader?.classList.toggle('hidden', targetStyle !== 'header');
  }

  // Load current states from storage
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get({ darkTheme: true, uiFixes: true, customScrollbar: true, roundedInterface: false, glassmorphism: false, menuStyle: 'original' }, (res) => {
      updateThemeUI(res.darkTheme);
      updateUiFixesUI(res.uiFixes);
      updateScrollbarUI(res.customScrollbar);
      updateRoundedUI(res.roundedInterface);
      updateGlassmorphismUI(res.glassmorphism);
      updateMenuStyleUI(res.menuStyle);
    });

    // Listen for storage changes across tabs or scripts
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      if ('darkTheme' in changes) {
        updateThemeUI(changes.darkTheme.newValue);
      }
      if ('uiFixes' in changes) {
        updateUiFixesUI(changes.uiFixes.newValue);
      }
      if ('customScrollbar' in changes) {
        updateScrollbarUI(changes.customScrollbar.newValue);
      }
      if ('roundedInterface' in changes) {
        updateRoundedUI(changes.roundedInterface.newValue);
      }
      if ('glassmorphism' in changes) {
        updateGlassmorphismUI(changes.glassmorphism.newValue);
      }
      if ('menuStyle' in changes) {
        updateMenuStyleUI(changes.menuStyle.newValue);
      }
    });
  }

  // Handle user toggling switches
  themeToggle?.addEventListener('change', () => {
    const isDark = themeToggle.checked;
    updateThemeUI(isDark);
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ darkTheme: isDark });
    }
  });

  uiFixesToggle?.addEventListener('change', () => {
    const isEnabled = uiFixesToggle.checked;
    updateUiFixesUI(isEnabled);
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ uiFixes: isEnabled });
    }
  });

  scrollbarToggle?.addEventListener('change', () => {
    const isEnabled = scrollbarToggle.checked;
    updateScrollbarUI(isEnabled);
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ customScrollbar: isEnabled });
    }
  });

  roundedToggle?.addEventListener('change', () => {
    const isEnabled = roundedToggle.checked;
    updateRoundedUI(isEnabled);
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ roundedInterface: isEnabled });
    }
  });

  glassmorphismToggle?.addEventListener('change', () => {
    const isEnabled = glassmorphismToggle.checked;
    updateGlassmorphismUI(isEnabled);
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ glassmorphism: isEnabled });
    }
  });

  // Handle menu style selection via dropdown
  menuStyleSelect?.addEventListener('change', () => {
    const selectedStyle = menuStyleSelect.value;
    updateMenuStyleUI(selectedStyle);
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ menuStyle: selectedStyle });
    }
  });
});
