import { action } from './components.js';

const key = 'gametracker.theme';
const root = document.documentElement;

function applyTheme(theme) {
  root.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]').content = theme === 'light' ? '#f7f7fa' : '#161618';
}

export function initializeTheme() {
  try {
    applyTheme(localStorage.getItem(key) === 'light' ? 'light' : 'dark');
  } catch {
    applyTheme('dark');
  }
}

export function themeToggle() {
  const label = () => root.dataset.theme === 'light' ? 'Tema oscuro' : 'Tema claro';
  const button = action(label(), () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
    button.textContent = label();
    try {
      localStorage.setItem(key, next);
    } catch {
      // The theme still works for the current page when storage is unavailable.
    }
  });
  return button;
}
