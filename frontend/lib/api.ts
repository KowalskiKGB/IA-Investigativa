"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const apiBase = () => API;

function token(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export const getToken = token;

export class ApiError extends Error {
  status: number;
  body: string;
  isNetwork: boolean;
  constructor(message: string, status: number, body = "", isNetwork = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.isNetwork = isNetwork;
  }
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

  let res: Response;
  try {
    res = await fetch(`${API}${path}`, { ...init, headers });
  } catch (e: any) {
    throw new ApiError(e?.message || "Falha de rede", 0, "", true);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(body || `HTTP ${res.status}`, res.status, body, false);
  }
  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

export const setToken = (t: string) => localStorage.setItem("token", t);
export const clearToken = () => localStorage.removeItem("token");
export const hasToken = () => !!token();
