import { api, segment } from '../domain/api.js';
import { session } from '../domain/session.js';
import { action, el, link, muted, panel, title } from '../ui/components.js';
import { forgot, login, register, reset, verify } from '../ui/views/auth.js';
import { home } from '../ui/views/games.js';

const routes = new Map([
  ['login', ['Iniciar sesión', login, false]],
  ['register', ['Crear cuenta', register, false]],
  ['forgot', ['Recuperar contraseña', forgot, false]],
  ['reset', ['Restablecer contraseña', reset, false]],
  ['verify', ['Verificar correo', verify, true]],
  ['home', ['Inicio', home, true]]
]);

export function startRouter(header, content) {
  let controller;
  const go = path => {
    const hash = '#/' + path;
    if (location.hash === hash) render();
    else location.hash = hash;
  };

  function navigation(key, query) {
    const user = session.user;
    const search = user && el('form', { class: 'search', role: 'search', onsubmit: event => {
      event.preventDefault();
      const q = new FormData(event.currentTarget).get('q').trim();
      go(q ? 'home?q=' + segment(q) : 'home');
    } }, el('input', { name: 'q', type: 'search', value: key === 'home' ? query.get('q') || '' : '',
      placeholder: 'Buscar un juego', 'aria-label': 'Buscar un juego', maxlength: 100 }),
    el('button', { class: 'secondary', type: 'submit' }, 'Buscar'));
    header.replaceChildren(el('div', { class: 'topbar' },
      link([el('span', { class: 'brand-icon', 'aria-hidden': 'true' }, 'G'), 'GameTracker'], user ? 'home' : 'login', 'brand'),
      search, user && el('div', { class: 'account-menu' },
        el('span', { class: 'username' }, '@' + user.username),
        action('Cerrar sesión', () => {
          session.clear();
          go('login');
        }))));
  }

  async function render() {
    controller?.abort();
    controller = new AbortController();
    const { signal } = controller;
    const [path, search] = location.hash.slice(2).split('?');
    const key = path || (session.user ? 'home' : 'login');
    const route = routes.get(key);
    const query = new URLSearchParams(search);
    if (route?.[2] && !session.user) return go('login');
    if (route && !route[2] && session.user) return go('home');
    navigation(key, query);
    document.title = route ? route[0] + ' | GameTracker' : 'Página desconocida | GameTracker';
    content.className = route && key !== 'home' ? 'auth-layout' : 'main-layout';
    if (!route) {
      content.replaceChildren(title('Página desconocida'), link('Volver', session.user ? 'home' : 'login'));
      return;
    }
    content.replaceChildren(el('p', { role: 'status', class: 'muted' }, 'Cargando…'));
    try {
      const nodes = await route[1]({ query, go, get: (path, params) => api(path, { signal, query: params }) });
      if (signal.aborted) return;
      content.replaceChildren(...[nodes].flat(Infinity).filter(Boolean));
    } catch (error) {
      if (signal.aborted) return;
      content.replaceChildren(panel(title(route[0]), muted(error.message),
        action('Reintentar', render), query.has('q') && link('Volver al catálogo', 'home')));
    }
    content.focus({ preventScroll: true });
  }

  window.addEventListener('hashchange', render);
  render();
}
