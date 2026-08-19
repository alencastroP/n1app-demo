// src/services/auth.js
export function isTokenValid() {
  try {
    const t = localStorage.getItem('token');
    if (!t) return false;
    const payload = JSON.parse(atob(t.split('.')[1]));
    return payload?.exp * 1000 > Date.now();
  } catch { return false; }
}
