## Why

The game should go online on a free host without buying a domain. Free hosts give each service its own address, so a
separate web host and game server would need two addresses and cross-site settings. If the game server also serves the
built web app, one free service hosts the whole game at one address, and the browser talks to the server it loaded
from.

## What Changes

- **One service:** when the server is told where the built web app lives, it serves its files and answers every page
  link with the app, so links like `/room/ABCD` open the game. Socket.io and the admin session route keep working on the
  same address.
- **Render setup:** a `render.yaml` blueprint for one free Render web service that installs, builds the web app and starts
  the server, and a short deploy guide.
- **Origin on Render:** with no `WEB_ORIGIN` set, the server trusts the address Render gives the service.

## Capabilities

### New Capabilities
- `hosting`: how the game is served from one address.

### Modified Capabilities

## Impact

- Server, `src/shared/infrastructure`: `serveWebApp.ts` (static files and page fallback) wired in `startServer.ts`;
  `ServerOptions.webRoot`.
- Server, `src/main.ts`: reads `WEB_ROOT` and falls back to `RENDER_EXTERNAL_URL` for the origin.
- Repository root: `render.yaml`, `docs/deploy-render.md`.
- Web: none. The socket already connects to the page's own address when `VITE_LUNA_SERVER_URL` is unset.

## Non-goals

- Keeping games across restarts, sleeps or several instances. Games stay in memory; the service runs as one instance.
- Compression and a CDN. Render's edge already compresses responses.
- A custom domain.
