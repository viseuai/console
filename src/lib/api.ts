import { token } from "./auth";

export const API = "https://api.viseuai.org";

export interface ApiKey {
  id: number;
  name: string;
  created_at: string;
  last_used_at?: string;
  revoked_at?: string;
}

export interface NodeStatus {
  node: string;
  models: string[];
  last_seen: string;
  online: boolean;
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error?.message ?? `O serviço respondeu com o estado ${res.status}.`);
  }
  return body as T;
}

export const listKeys = () =>
  call<{ data: ApiKey[] }>("/v1/keys").then((b) => b.data ?? []);

export const createKey = (name: string, type: "api" | "node") =>
  call<{ id: number; name: string; key: string }>("/v1/keys", {
    method: "POST",
    body: JSON.stringify({ name, type }),
  });

export const revokeKey = (id: number) =>
  call<void>(`/v1/keys/${id}`, { method: "DELETE" });

export const listNodes = () =>
  call<{ data: NodeStatus[] }>("/v1/nodes").then((b) => b.data ?? []);

// ---- administração (requer papel direcao) ----

export interface Member {
  id: string;
  username: string;
  email: string;
  roles: string[] | null;
}

export const adminListMembers = () =>
  call<{ data: Member[] }>("/v1/admin/members").then((b) => b.data ?? []);

export const adminGrant = (userId: string, role: string) =>
  call<void>(`/v1/admin/members/${userId}/roles`, {
    method: "POST",
    body: JSON.stringify({ role }),
  });

export const adminMintMeshKey = () =>
  call<{ key: string; expires_in_hours: number }>("/v1/admin/mesh-keys", {
    method: "POST",
    body: JSON.stringify({}),
  });

export const adminListNodes = () =>
  call<{ data: NodeStatus[] }>("/v1/admin/nodes").then((b) => b.data ?? []);
