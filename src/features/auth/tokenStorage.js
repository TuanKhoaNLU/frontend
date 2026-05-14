const ACCESS_TOKEN_KEY = "quiz_web_access_token";
const AUTH_TOKEN_EVENT = "auth-token-changed";

function parseJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload && typeof payload === "object" ? payload : null;
  } catch {
    return null;
  }
}

function isTokenExpired(payload) {
  if (!payload || typeof payload.exp !== "number") return false;
  const nowSec = Math.floor(Date.now() / 1000);
  return payload.exp <= nowSec;
}

export function getAccessToken() {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) return null;

  const payload = parseJwtPayload(token);
  if (!payload || isTokenExpired(payload)) {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    return null;
  }
  return token;
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

/** JWT `sub` = username (Spring Security subject). */
export function getJwtUsername() {
  const token = getAccessToken();
  if (!token) return null;
  const payload = parseJwtPayload(token);
  if (!payload || typeof payload.sub !== "string") return null;
  return payload.sub;
}
