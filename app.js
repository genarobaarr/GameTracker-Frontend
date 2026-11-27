import { api } from './src/domain/api.js';
import { session } from './src/domain/session.js';
import { startRouter } from './src/navigation/router.js';
import { action, el, panel, title } from './src/ui/components.js';

import { initializeTheme } from './src/ui/theme.js';

initializeTheme();

const header = document.getElementById('header');
const content = document.getElementById('content');

document.querySelector('.skip').addEventListener('click', event => {
  event.preventDefault();
  content.focus();
});

async function initialize() {
  if (session.token) {
    content.replaceChildren(el('p', { role: 'status' }, 'Validando sesión…'));
    try {
      session.user = (await api('auth/me')).user;
    } catch (error) {
      if (![401, 403, 404].includes(error.status)) {
        content.replaceChildren(panel(title('GameTracker'), el('p', { role: 'alert' }, error.message),
          el('div', { class: 'actions' }, action('Reintentar', initialize), action('Cerrar sesión', () => {
            session.clear();
            location.hash = '#/login';
            startRouter(header, content);
          }))));
        return;
      }
      session.clear();
    }
  }
  startRouter(header, content);
}

initialize();
