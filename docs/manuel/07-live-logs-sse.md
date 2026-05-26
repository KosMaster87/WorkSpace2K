# Live-Logs via SSE — Architektur-Entscheidung

## Was ist SSE (Server-Sent Events)?

SSE ist ein HTTP-Standard bei dem der Server nach einem einzigen GET-Request
kontinuierlich Daten an den Client pusht — die Verbindung bleibt offen.

Das Protokoll ist schlicht:

```
Content-Type: text/event-stream

: connected        ← Kommentar (kein Event, hält Verbindung warm)

data: log line 1   ← Ein Event

data: log line 2   ← Nächstes Event

```

Jede `data:`-Zeile gefolgt von `\n\n` ist ein Event. Der Client empfängt diese
Zeilen und verarbeitet sie live. Für Docker-Logs: jede Zeile = ein Log-Eintrag.

---

## Warum NICHT EventSource?

Der Browser hat eine eingebaute API namens `EventSource` für SSE:

```typescript
const es = new EventSource('/api/docker/containers/abc/logs/stream');
es.onmessage = (e) => console.log(e.data);
```

**Das Problem:** `EventSource` unterstützt **keine Custom-Header**.
Es ist nicht möglich, einen `Authorization: Bearer <token>` Header mitzugeben.

Unser Backend verlangt JWT-Authentifizierung für alle `/api/docker/*` Endpunkte.
`EventSource` → immer `401 Unauthorized` → funktioniert nicht.

Workarounds die schlechter wären:

- **Token als Query-Parameter** (`?token=...`) — implementiert als Fallback, aber
  Token in der URL ist unsicherer (Server-Logs, Browser-History)
- **Cookie-Auth** — würde Cookie-basierte Session erfordern, nicht JWT

---

## Die Entscheidung: fetch() + ReadableStream

`fetch()` unterstützt beliebige Header. Wir wrappen den Response-Body als
Observable, das jede SSE-Zeile emittiert:

```typescript
// container.service.ts — vereinfacht
streamContainerLogs(id: string): Observable<string> {
  return new Observable<string>((observer) => {
    const token = localStorage.getItem('ws2k_token') ?? '';
    const abort = new AbortController();

    fetch(`/api/docker/containers/${id}/logs/stream`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: abort.signal,
    })
      .then(async (res) => {
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buf = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) { observer.complete(); break; }

          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';          // letzter unvollständiger Teil bleibt

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              observer.next(line.slice(6)); // "data: " (6 Zeichen) abschneiden
            }
          }
        }
      });

    return () => abort.abort(); // Teardown: fetch abbbrechen
  });
}
```

### Warum ein Observable?

Damit der Stream sauber in NgRx Effects und Angular-Komponenten integrierbar ist.
`takeUntilDestroyed(destroyRef)` bricht den Stream automatisch ab wenn die
Komponente zerstört wird — kein Memory-Leak.

---

## Backend: Docker-Multiplexing

Docker-Logs kommen nicht als plain Text. Docker verwendet ein
**Multiplexing-Protokoll** mit 8-Byte-Header pro Frame:

```
Byte 0:    Stream-Typ (1 = stdout, 2 = stderr)
Byte 1-3:  Reserved (0x000000)
Byte 4-7:  Frame-Größe (uint32, big-endian)
Byte 8+:   Eigentlicher Log-Inhalt
```

Der Backend-Controller entpackt dieses Format manuell bevor er SSE-Zeilen sendet:

```typescript
// docker.controller.ts — Demux
while (buf.length >= 8) {
  const frameSize = buf.readUInt32BE(4);
  if (buf.length < 8 + frameSize) break;

  const content = buf
    .subarray(8, 8 + frameSize)
    .toString('utf-8')
    .trimEnd();
  buf = buf.subarray(8 + frameSize);

  content
    .split('\n')
    .filter((l) => l.trim())
    .forEach((line) => {
      res.write(`data: ${line}\n\n`);
    });
}
```

Ohne dieses Demuxing würden Binär-Bytes (die 8-Byte-Header) in den Log-Zeilen landen.

---

## res.flushHeaders() statt res.writeHead()

```typescript
// ❌ Würde CORS-Header verlieren die cors() Middleware gesetzt hat
res.writeHead(200, { 'Content-Type': 'text/event-stream' });

// ✅ Behält alle bereits gesetzten Header (inkl. CORS)
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');
res.setHeader('X-Accel-Buffering', 'no'); // Nginx-Buffer deaktivieren
res.flushHeaders();
```

`flushHeaders()` sendet den HTTP-Status (200) und alle bisherigen Headers sofort
an den Client — notwendig damit der Browser weiß dass der Stream beginnt, ohne auf
den Body-Puffer zu warten.

---

## ts-node-dev auf Synology Drive (Learnings)

**Problem:** ts-node-dev nutzt `inotify` für File-Watching. Netzwerk-Dateisysteme
(Synology Drive, NFS, SMB) leiten `inotify`-Events oft nicht weiter.

**Symptom:** Controller-Datei wird gespeichert → ts-node-dev erkennt die Änderung
nicht → Server läuft mit veraltetem Code → Routing-Verhalten erscheint inkonsistent.

**Erkennung:** `ls -la <datei>` zeigt neueres Timestamp als `ps lstart <pid>` des
Server-Prozesses zeigt.

**Fix:** Server-Prozess manuell neustarten nach Dateiänderungen auf Synology Drive.
Oder: `npm run dev` immer in einem lokalen Terminal starten, nicht nur einmal — so
dass ts-node-dev aktiv auf Änderungen wartet.

---

## Zusammenfassung

|                        | EventSource      | fetch + ReadableStream |
| ---------------------- | ---------------- | ---------------------- |
| Custom-Header          | ❌ Nicht möglich | ✅ Beliebige Header    |
| Authorization          | ❌ 401 bei JWT   | ✅ Bearer Token        |
| Auto-Reconnect         | ✅ Eingebaut     | ❌ Manuell             |
| Observable-Integration | ❌ Aufwändiger   | ✅ Direkt wrappbar     |
| **Für dieses Projekt** | **❌ Falsch**    | **✅ Richtig**         |

Die `streamContainerLogs()`-Methode in `container.service.ts` ist die
einzige Stelle im Projekt die `fetch()` statt `HttpClient` nutzt — begründet
durch die fehlende Header-Unterstützung von `EventSource`.
