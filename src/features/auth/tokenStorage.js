const ACCESS_TOKEN_KEY = "quiz_web_access_token";
const AUTH_TOKEN_EVENT = "auth-token-changed";

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  window.dispatchEvent(new Event(AUTH_TOKEN_EVENT));
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.dispatchEvent(new Event(AUTH_TOKEN_EVENT));
}

export function onAccessTokenChanged(callback) {
  window.addEventListener(AUTH_TOKEN_EVENT, callback);
  return () => window.removeEventListener(AUTH_TOKEN_EVENT, callback);
}
