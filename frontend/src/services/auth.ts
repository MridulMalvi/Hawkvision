/**
 * Authentication API calls — login, register, and current user fetch.
 */
import { api } from "./api";
import type { User } from "../types";

export function login(email: string, password: string) {
  return api<{ access_token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(email: string, fullName: string, password: string) {
  return api<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, full_name: fullName, password }),
  });
}

export function me() {
  return api<User>("/auth/me");
}
