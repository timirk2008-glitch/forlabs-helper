/**
 * Forlabs Helper — Popup Script
 */

document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('theme-toggle');
  const moonIcon = document.getElementById('moon-icon');
  const sunIcon = document.getElementById('sun-icon');
  const themeIconWrap = document.getElementById('theme-icon-wrap');

  function updateUI(isDark) {
    themeToggle.checked = isDark;
    if (isDark) {
      moonIcon.classList.add('hidden');
      sunIcon.classList.remove('hidden');
      themeIconWrap.classList.add('active');
    } else {
      moonIcon.classList.remove('hidden');
      sunIcon.classList.add('hidden');
      themeIconWrap.classList.remove('active');
    }
  }

  // Load current theme state from storage
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get({ darkTheme: true }, (res) => {
      updateUI(res.darkTheme);
    });

    // Listen for storage changes from page button
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && 'darkTheme' in changes) {
        updateUI(changes.darkTheme.newValue);
      }
    });
  }

  // Handle user toggling switch
  themeToggle.addEventListener('change', () => {
    const isDark = themeToggle.checked;
    updateUI(isDark);

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ darkTheme: isDark });
    }
  });
});
