export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? '' : value);
  }
  node.append(...children.flat(Infinity).filter(child => child != null && child !== false));
  return node;
}

export const link = (label, path, className) => el('a', { href: '#/' + path, class: className }, label);
export const muted = text => el('p', { class: 'muted' }, text);
export const title = text => el('h1', {}, text);
export const panel = (...children) => el('section', { class: 'panel' }, children);
export const action = (label, onclick, className = 'secondary') =>
  el('button', { type: 'button', class: className, onclick }, label);

export function field(label, name, attrs = {}) {
  return el('label', { class: 'field' }, label, el('input', { name, ...attrs }));
}

export function form(label, submit, ...fields) {
  const message = el('p', { class: 'message', role: 'status', 'aria-live': 'polite' });
  const button = el('button', { type: 'submit' }, label);
  return el('form', { onsubmit: async event => {
    event.preventDefault();
    if (button.disabled) return;
    button.disabled = true;
    button.textContent = 'Procesando…';
    message.textContent = '';
    try {
      const feedback = await submit(Object.fromEntries(new FormData(event.currentTarget)));
      if (feedback) {
        message.className = 'message success';
        message.textContent = feedback;
      }
    } catch (error) {
      message.className = 'message error';
      message.textContent = error.message;
    } finally {
      button.disabled = false;
      button.textContent = label;
    }
  } }, fields, button, message);
}
