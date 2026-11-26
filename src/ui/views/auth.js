import { api } from '../../domain/api.js';
import { session } from '../../domain/session.js';
import { action, el, field, form, link, muted, title } from '../components.js';

function password(label = 'Contraseña', name = 'password', autocomplete = 'new-password') {
  const input = el('input', { name, type: 'password', minlength: 8, maxlength: 30, autocomplete, required: true, id: name });
  const toggle = action('Mostrar', () => {
    const visible = input.type === 'password';
    input.type = visible ? 'text' : 'password';
    toggle.textContent = visible ? 'Ocultar' : 'Mostrar';
    toggle.setAttribute('aria-label', (visible ? 'Ocultar ' : 'Mostrar ') + label.toLowerCase());
  });
  toggle.setAttribute('aria-label', 'Mostrar ' + label.toLowerCase());
  toggle.setAttribute('aria-controls', name);
  return el('div', { class: 'field' }, el('label', { for: name }, label), el('div', { class: 'password-input' }, input, toggle));
}

const email = () => field('Correo electrónico', 'email', { type: 'email', autocomplete: 'email', maxlength: 254, required: true });
const code = () => field('Código de seis dígitos', 'code', { autocomplete: 'one-time-code', inputmode: 'numeric',
  pattern: '[0-9]{6}', maxlength: 6, required: true });
const card = (heading, ...content) => el('section', { class: 'auth panel' }, title('GameTracker'), el('h2', {}, heading), content);

export function login(context) {
  return card('Iniciar sesión', form('Entrar', async values => {
    session.set(await api('auth/login', { method: 'POST', body: values, auth: false }));
    context.go('home');
  }, email(), password('Contraseña', 'password', 'current-password')),
  el('div', { class: 'auth-links' }, link('¿Olvidaste tu contraseña?', 'forgot'), link('Crear una cuenta', 'register')));
}

export function register() {
  const feedback = el('div', { hidden: true });
  const signup = form('Registrarme', async ({ confirmation, ...values }) => {
    if (values.password !== confirmation) throw new Error('Las contraseñas deben coincidir.');
    const result = await api('auth/register', { method: 'POST', body: values, auth: false });
    signup.hidden = true;
    feedback.hidden = false;
    feedback.replaceChildren(el('p', { role: 'status' }, result.verification?.message || 'Cuenta creada.'),
      link('Iniciar sesión con mi cuenta', 'login'));
    feedback.querySelector('a').focus();
  }, field('Nombre de usuario', 'username', { autocomplete: 'username', minlength: 3, maxlength: 25, required: true }),
  field('Nombre', 'name', { autocomplete: 'name', required: true }), email(), password(),
  password('Confirmar contraseña', 'confirmation'));
  return card('Crear cuenta', signup, feedback, link('Volver al acceso', 'login'));
}

export function forgot() {
  return card('Recuperar contraseña', form('Enviar código', async values =>
    (await api('auth/forgot-password', { method: 'POST', body: values, auth: false })).message, email()),
  el('div', { class: 'auth-links' }, link('Ya tengo un código', 'reset'), link('Iniciar sesión', 'login')));
}

export function reset() {
  return card('Restablecer contraseña', form('Guardar contraseña', async ({ confirmation, ...values }) => {
    if (values.password !== confirmation) throw new Error('Las contraseñas deben coincidir.');
    return (await api('auth/reset-password', { method: 'POST', body: values, auth: false })).message;
  }, code(), password('Nueva contraseña'), password('Confirmar contraseña', 'confirmation')), link('Iniciar sesión', 'login'));
}

export function verify(context) {
  if (session.user.emailVerified) return card('Verificar correo', muted('Tu correo ya está verificado.'), link('Ir al inicio', 'home'));
  return card('Verificar correo', muted('Ingresa el código enviado a ' + session.user.email + '.'),
    form('Verificar', async values => {
      await api('auth/email-verification/verify', { method: 'POST', body: values });
      session.user = (await api('auth/me')).user;
      context.go('home');
    }, code()), form('Reenviar código', async () => (await api('auth/email-verification/resend', { method: 'POST' })).message),
    link('Ir al inicio', 'home'));
}
