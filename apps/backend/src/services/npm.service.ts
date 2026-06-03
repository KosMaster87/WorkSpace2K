/**
 * @fileoverview NPM Service — Nginx Proxy Manager API Client
 * @description Kapselt alle HTTP-Aufrufe an die NPM API (v2, Port 81).
 *   Erstellt automatisch Proxy Hosts wenn ein Stack gestartet wird.
 *
 *   Graceful Degradation: wenn NPM_URL, NPM_EMAIL oder NPM_PASSWORD nicht gesetzt
 *   sind, werden alle Operationen still übersprungen — WorkSpace2K funktioniert
 *   ohne NPM-Integration vollständig weiter.
 *
 *   Token-Caching: JWT von NPM wird gecacht. Bei Ablauf (60 s Puffer vor Ablauf)
 *   wird automatisch ein neuer Token geholt. Bei 401-Antwort: ein automatischer
 *   Re-Login (einmaliger Retry).
 *
 *   Idempotenz: existierende Proxy Hosts (gleiche Domain) werden übersprungen.
 *   Mehrere Proxy Hosts pro Stack werden unterstützt (z.B. Matrix: Synapse + Element).
 * @module NpmService
 */

import { ComposeStack } from '@workspace2k/shared';

/**
 * Gecachter NPM Bearer-Token (undefined = noch nicht eingeloggt / abgelaufen).
 * @private
 */
let cachedToken: string | undefined;

/**
 * Ablaufzeit des gecachten Tokens (Unix-Timestamp in ms).
 * @private
 */
let tokenExpiresAt: number = 0;

/**
 * Puffer vor Token-Ablauf: 60 Sekunden vor Ablaufzeit neu einloggen.
 * @private
 */
const TOKEN_EXPIRY_BUFFER_MS = 60_000;

/**
 * Prüft ob alle erforderlichen NPM-Umgebungsvariablen gesetzt sind.
 * @description Ohne diese Variablen ist NPM-Integration deaktiviert —
 *   kein Fehler, kein Lärm.
 * @returns {boolean} true wenn NPM_URL, NPM_EMAIL und NPM_PASSWORD gesetzt sind.
 * @private
 */
function isNpmConfigured(): boolean {
  return Boolean(process.env['NPM_URL'] && process.env['NPM_EMAIL'] && process.env['NPM_PASSWORD']);
}

/**
 * Holt einen Bearer-Token von der NPM API und cached ihn.
 * @description POST /api/tokens mit Identity und Secret aus Umgebungsvariablen.
 *   Gecachter Token wird wiederverwendet solange er noch mehr als
 *   TOKEN_EXPIRY_BUFFER_MS gültig ist.
 * @async
 * @function loginNpm
 * @returns {Promise<string>} Bearer-Token.
 * @throws {Error} Wenn Login fehlschlägt (falsches Passwort, NPM nicht erreichbar).
 * @private
 */
async function loginNpm(): Promise<string> {
  const now = Date.now();
  if (cachedToken && tokenExpiresAt > now + TOKEN_EXPIRY_BUFFER_MS) {
    return cachedToken;
  }

  const url = `${process.env['NPM_URL']}/api/tokens`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identity: process.env['NPM_EMAIL'],
      secret: process.env['NPM_PASSWORD'],
    }),
  });

  if (!res.ok) {
    throw new Error(`NPM Login fehlgeschlagen: HTTP ${res.status}`);
  }

  const data = (await res.json()) as { token: string; expires: string };
  cachedToken = data.token;
  tokenExpiresAt = new Date(data.expires).getTime();
  return cachedToken;
}

/**
 * Sucht das Wildcard-Zertifikat für eine Basis-Domain.
 * @description GET /api/nginx/certificates — filtert nach "*.domain.com".
 *   Gibt null zurück wenn kein Wildcard-Zertifikat gefunden — Proxy Host
 *   wird dann ohne SSL-Zertifikat erstellt (kein SSL-Forced).
 * @async
 * @function findWildcardCert
 * @param {string} token - NPM Bearer-Token.
 * @param {string} domain - Basis-Domain (z.B. 'yourdomain.com').
 * @returns {Promise<number | null>} Zertifikat-ID oder null.
 * @private
 */
async function findWildcardCert(token: string, domain: string): Promise<number | null> {
  const url = `${process.env['NPM_URL']}/api/nginx/certificates`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as Array<{ id: number; domain_names: string[] }>;
  const wildcard = `*.${domain}`;
  const cert = data.find((c) => c.domain_names.includes(wildcard));
  return cert?.id ?? null;
}

/**
 * Gibt alle existierenden Proxy Hosts aus NPM zurück.
 * @description GET /api/nginx/proxy-hosts — für Idempotenz-Prüfung.
 *   Vor dem Erstellen eines neuen Hosts wird geprüft ob die Domain bereits existiert.
 * @async
 * @function getExistingProxyHosts
 * @param {string} token - NPM Bearer-Token.
 * @returns {Promise<Array<{ id: number; domain_names: string[] }>>}
 * @private
 */
async function getExistingProxyHosts(
  token: string,
): Promise<Array<{ id: number; domain_names: string[] }>> {
  const url = `${process.env['NPM_URL']}/api/nginx/proxy-hosts`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return [];
  return res.json() as Promise<Array<{ id: number; domain_names: string[] }>>;
}

/**
 * Erstellt einen einzelnen Proxy Host in NPM.
 * @description POST /api/nginx/proxy-hosts.
 *   Bei 401-Antwort: Token-Cache wird geleert und ein Retry wird durchgeführt.
 *   Force SSL ist deaktiviert (Cloudflare Tunnel → Redirect-Loop vermeiden).
 *   HSTS ist deaktiviert (NPM-Einschränkung: setzt Force SSL voraus).
 * @async
 * @function createProxyHost
 * @param {string} token - NPM Bearer-Token.
 * @param {string} fqdn - Vollqualifizierter Domainname (z.B. 'gitea.yourdomain.com').
 * @param {string} forwardHost - Container-Name als Forward-Ziel.
 * @param {number} forwardPort - Interner Port des Containers.
 * @param {boolean} websockets - WebSocket-Unterstützung aktivieren.
 * @param {number | null} certId - Zertifikat-ID oder null für kein SSL.
 * @returns {Promise<void>}
 * @throws {Error} Wenn der NPM API-Aufruf fehlschlägt.
 * @private
 */
async function createProxyHost(
  token: string,
  fqdn: string,
  forwardHost: string,
  forwardPort: number,
  websockets: boolean,
  certId: number | null,
): Promise<void> {
  const url = `${process.env['NPM_URL']}/api/nginx/proxy-hosts`;
  // NPM API v2 erwartet Zahlen (0/1) statt Booleans und benötigt mehrere Pflichtfelder.
  const body = {
    domain_names: [fqdn],
    forward_scheme: 'http',
    forward_host: forwardHost,
    forward_port: forwardPort,
    // Pflichtfelder — NPM lehnt 400 ab wenn diese fehlen
    access_list_id: '0',
    advanced_config: '',
    locations: [],
    caching_enabled: 0,
    // Force SSL deaktiviert — Cloudflare Tunnel leitet HTTP intern weiter,
    // Force SSL würde einen Redirect-Loop erzeugen.
    ssl_forced: 0,
    certificate_id: certId ?? 0,
    meta: { letsencrypt_agree: false, dns_challenge: false },
    // NPM v2: Booleans als 0/1 — true/false wird teils als ungültig abgewiesen
    block_exploits: 1,
    allow_websocket_upgrade: websockets ? 1 : 0,
    http2_support: 1,
    // HSTS deaktiviert — NPM-Einschränkung: HSTS erfordert Force SSL.
    // Cloudflare erzwingt HTTPS bereits auf Browser-Ebene.
    hsts_enabled: 0,
    hsts_subdomains: 0,
  };

  const doRequest = async (authToken: string): Promise<Response> =>
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify(body),
    });

  let res = await doRequest(token);

  if (res.status === 401) {
    // Token abgelaufen — Cache leeren und einmaliger Retry
    cachedToken = undefined;
    tokenExpiresAt = 0;
    const freshToken = await loginNpm();
    res = await doRequest(freshToken);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(
      `NPM Proxy Host erstellen fehlgeschlagen: HTTP ${res.status} für ${fqdn}${detail ? ` — ${detail}` : ''}`,
    );
  }

  console.log(`[npm] Proxy Host erstellt: ${fqdn} → ${forwardHost}:${forwardPort}`);
}

/**
 * Erstellt NPM Proxy Hosts für alle Einträge in stack.proxy — idempotent.
 * @description Wird nach dem Starten eines Stacks aufgerufen (fire-and-forget).
 *
 *   Idempotenz: existierende Hosts (gleiche domain_names) werden übersprungen.
 *
 *   Graceful Degradation:
 *   - NPM nicht konfiguriert (fehlende Env-Vars) → still überspringen
 *   - Stack hat kein proxy-Array → still überspringen
 *   - NPM nicht erreichbar → Fehler loggen, nicht weiterwerfen
 *   - BASE_DOMAIN nicht gesetzt → warnen und überspringen
 *
 *   Token-Retry: einmaliger Re-Login bei 401-Antworten (in createProxyHost).
 * @async
 * @function ensureProxyHosts
 * @param {ComposeStack} stack - Der gestartete Stack mit optionaler proxy-Konfiguration.
 * @returns {Promise<void>}
 */
export async function ensureProxyHosts(stack: ComposeStack): Promise<void> {
  if (!isNpmConfigured()) return;
  if (!stack.proxy || stack.proxy.length === 0) return;

  const baseDomain = process.env['BASE_DOMAIN'];
  if (!baseDomain) {
    console.warn('[npm] BASE_DOMAIN nicht gesetzt — NPM-Provisioning übersprungen');
    return;
  }

  try {
    const token = await loginNpm();
    const certId = await findWildcardCert(token, baseDomain);
    const existing = await getExistingProxyHosts(token);
    const existingDomains = new Set(existing.flatMap((h) => h.domain_names));

    for (const entry of stack.proxy) {
      const fqdn = `${entry.subdomain}.${baseDomain}`;
      if (existingDomains.has(fqdn)) {
        console.log(`[npm] Proxy Host existiert bereits: ${fqdn} — übersprungen`);
        continue;
      }
      await createProxyHost(token, fqdn, entry.container, entry.port, entry.websockets, certId);
    }
  } catch (err) {
    // NPM-Fehler dürfen den Stack-Start nicht blockieren — nur loggen
    console.error('[npm] Fehler beim NPM-Provisioning:', err instanceof Error ? err.message : err);
  }
}
