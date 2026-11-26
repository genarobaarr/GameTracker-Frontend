const key = 'gametracker.session';

export const session = {
  user: null,
  get token() {
    return sessionStorage.getItem(key);
  },
  set({ token, user }) {
    sessionStorage.setItem(key, token);
    this.user = user;
  },
  clear() {
    sessionStorage.removeItem(key);
    this.user = null;
  }
};
