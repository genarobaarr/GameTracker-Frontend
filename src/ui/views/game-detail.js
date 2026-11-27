import { el, link, muted, title } from '../components.js';
import { gameCover } from './games.js';

const date = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeZone: 'UTC' });
const number = new Intl.NumberFormat('es-MX');
const names = values => values?.map(value => value.name).filter(Boolean).join(', ');

function formatDate(value) {
  const time = value ? Date.parse(value) : NaN;
  return Number.isFinite(time) ? date.format(time) : null;
}

function score(value, count) {
  if (value == null) return null;
  return number.format(Math.round(value)) + '/100' +
    (count == null ? '' : ' · ' + number.format(count) + (count === 1 ? ' voto' : ' votos'));
}

function igdbLink(value) {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && ['igdb.com', 'www.igdb.com'].includes(url.hostname)) {
      return el('a', { href: url.href, target: '_blank', rel: 'noopener noreferrer' }, 'Consultar ficha en IGDB');
    }
  } catch {
    return null;
  }
  return null;
}

export async function gameDetail({ get, query }) {
  const id = query.get('id');
  const origin = new URLSearchParams();
  const term = query.get('from');
  if (term) origin.set('q', term);
  const back = link(term ? 'Volver a los resultados' : 'Volver al catálogo', 'home' + (term ? '?' + origin : ''));
  if (!id || !/^[1-9][0-9]*$/.test(id) || !Number.isSafeInteger(Number(id))) {
    return [title('Juego no disponible'), muted('El identificador del juego no es válido.'), back];
  }
  const game = await get('games/' + id);
  const facts = [
    ['Fecha de lanzamiento', formatDate(game.firstReleaseDate)],
    ['Puntuación de usuarios', score(game.rating, game.ratingCount)],
    ['Puntuación general', score(game.totalRating, game.totalRatingCount)],
    ['Géneros', names(game.genres)],
    ['Plataformas', names(game.platforms)],
    ['Modos de juego', names(game.gameModes)],
    ['Perspectivas', names(game.playerPerspectives)],
    ['Estudios desarrolladores', names(game.developers)],
    ['Distribuidoras', names(game.publishers)],
    ['ID de IGDB', String(game.igdbId ?? id)],
    ['Última sincronización', formatDate(game.lastSyncedAt)]
  ];
  return el('article', { class: 'game-detail' },
    back,
    el('div', { class: 'detail-layout panel' },
      gameCover(game),
      el('div', { class: 'detail-info' }, title(game.name || 'Juego ' + id),
        el('dl', { class: 'game-facts' }, facts.filter(([, value]) => value).map(([label, value]) =>
          el('div', {}, el('dt', {}, label), el('dd', {}, value)))),
        igdbLink(game.url))),
    el('section', { class: 'panel detail-copy' }, el('h2', {}, 'Sinopsis'),
      game.summary ? el('p', {}, game.summary) : muted('Sin sinopsis disponible.'),
      game.storyline && el('h2', {}, 'Historia'), game.storyline && el('p', {}, game.storyline)));
}
