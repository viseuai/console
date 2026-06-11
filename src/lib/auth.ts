import Keycloak from "keycloak-js";

export const keycloak = new Keycloak({
  url: "https://auth.viseuai.org",
  realm: "viseu",
  clientId: "platform-web",
});

export async function initAuth(): Promise<void> {
  await keycloak.init({
    onLoad: "login-required",
    pkceMethod: "S256",
    checkLoginIframe: false,
  });
  // keep the token fresh for long sessions
  setInterval(() => keycloak.updateToken(30).catch(() => keycloak.login()), 20_000);
}

export function token(): string {
  return keycloak.token ?? "";
}

export function displayName(): string {
  const t = keycloak.tokenParsed as Record<string, unknown> | undefined;
  return (t?.preferred_username as string) ?? "membro";
}

export function roles(): string[] {
  const t = keycloak.tokenParsed as
    | { realm_access?: { roles?: string[] } }
    | undefined;
  return t?.realm_access?.roles ?? [];
}
