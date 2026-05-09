"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function token(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export async function api<T = any>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const t = token();
  if (t) headers.set("Authorization", `Bearer ${t}`);

  const res = await fetch(`${API}${path}`, { ...init, headers });
  if (!res.ok) {
    const erro = await res.text();
    throw new Error(erro || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

export const setToken = (t: string) => localStorage.setItem("token", t);
export const clearToken = () => localStorage.removeItem("token");
export const hasToken = () => !!token();
