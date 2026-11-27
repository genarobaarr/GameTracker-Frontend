import { items } from '../../domain/api.js';
import { session } from '../../domain/session.js';
import { action, el, link, muted, title } from '../components.js';

function card(game) {
  const url = game.cover?.url;
  const image = url?.startsWith('https://images.igdb.com/') ?
    el('img', { src: url, alt: '', loading: 'lazy', onerror: event => event.currentTarget.remove() }) : null;
  const rating = game.totalRating ?? game.rating;
  return el('article', { class: 'game-card' },
    el('div', { class: 'cover' }, el('span', { 'aria-hidden': 'true' }, 'GT'), image),
    el('h3', {}, game.name || 'Juego ' + game.igdbId),
    rating != null && el('span', { class: 'rating', 'aria-label': Math.round(rating) + ' de 100' }, Math.round(rating) + '/100'));
}

function shelf(heading, games) {
  const track = el('div', { class: 'shelf-track', tabindex: 0, 'aria-label': heading }, games.map(card));
  const scroll = direction => track.scrollBy({ left: direction * track.clientWidth * 0.85, behavior: 'smooth' });
  const previous = action('‹', () => scroll(-1), 'shelf-arrow');
  const next = action('›', () => scroll(1), 'shelf-arrow');
  previous.setAttribute('aria-label', 'Anterior en ' + heading);
  next.setAttribute('aria-label', 'Siguiente en ' + heading);
  return el('section', { class: 'shelf' }, el('h2', {}, heading),
    games.length ? el('div', { class: 'shelf-controls' }, previous, track, next) : muted('No se encontraron juegos.'));
}

export async function home({ get, query }) {
  const q = query.get('q')?.trim();
  const heading = el('div', { class: 'hero' }, title('GameTracker'),
    !session.user.emailVerified && link('Verificar correo electrónico', 'verify'));
  if (q) {
    const games = items(await get('games/search', { q, limit: 24 }));
    return [heading, link('Volver al catálogo', 'home'), shelf('Resultados para «' + q + '»', games)];
  }
  const popular = items(await get('games/popular', { limit: 24 }));
  const rated = popular.filter(game => (game.totalRating ?? game.rating) != null)
    .sort((a, b) => (b.totalRating ?? b.rating) - (a.totalRating ?? a.rating));
  const recent = popular.filter(game => game.firstReleaseDate && new Date(game.firstReleaseDate) <= new Date())
    .sort((a, b) => new Date(b.firstReleaseDate) - new Date(a.firstReleaseDate));
  return [heading, shelf('Juegos destacados', popular), shelf('Mejor puntuados entre los destacados', rated),
    shelf('Lanzamientos recientes entre los destacados', recent)];
}
