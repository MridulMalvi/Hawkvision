import type { User } from "../types";

const TOKEN_KEY = "hawkvision_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export type AuthState = {
  user?: User;
};

