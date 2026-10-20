## Context

`startServer` creates one `node:http` server. Socket.io attaches to it and takes `/socket.io/` requests;
`registerAdminHttpRoutes` adds a `request` listener that answers only `ADMIN_SESSION.path`. Every other request is
left unanswered today. The web app builds to `apps/web/dist` with hashed files under `assets/` and an `index.html` that
uses the history router, and its socket connects to the page's own address when `VITE_LUNA_SERVER_URL` is unset. No
design/canvas screen changes.

## Goals / Non-Goals

**Goals:**
- One Node process serves pages, the socket and the admin route on one address.
- Deployable on Render's free web service from a blueprint, with no Dockerfile.

**Non-Goals:**
- New dependencies. `node:fs` and `node:path` are enough.
- Shared or persistent game state.

## Decisions

- **`serveWebApp(http, webRoot)`** in `src/shared/infrastructure/serveWebApp.ts`, registered last in `startServer` when
  `ServerOptions.webRoot` is set. It is a `request` listener that ignores `/socket.io/` and the reserved paths
  `startServer` hands it (the admin session route), and
  answers GET and HEAD only (405 otherwise). It decodes the path, resolves it inside `webRoot` and refuses anything that
  resolves outside (404). An existing file is streamed with a content type from a small extension map; a path with no
  extension gets `index.html`; anything else 404. Cache: `public, max-age=31536000, immutable` under `/assets/`,
  `no-cache` elsewhere. Alternative considered: `express` with `serve-static`. Rejected to keep the server free of an
  HTTP framework for a few dozen lines.
- **Configuration.** `main.ts` passes `webRoot` from `WEB_ROOT`, resolved against the working directory.
  `webOrigin` falls back from `WEB_ORIGIN` to `RENDER_EXTERNAL_URL` (Render's https address for the service), then to
  the Vite dev address. The admin session check and the socket CORS check keep using that one origin.
- **Render blueprint.** `render.yaml` declares one `web` service, `runtime: node`, `plan: free`, `NODE_VERSION=24`,
  `TRUST_PROXY=1`, `WEB_ROOT=../web/dist`, and `OPENROUTER_API_KEY` and `ADMIN_TOKEN` as `sync: false` secrets.
  Build: `npx --yes pnpm@11.1.2 install --frozen-lockfile && npx --yes pnpm@11.1.2 -C apps/web build`. Start:
  `cd apps/server && node_modules/.bin/tsx src/main.ts`, so the runtime does not need pnpm on its path.
  `healthCheckPath: /`.

## Risks / Trade-offs

- [Render's free service sleeps after about 15 minutes without traffic] → the first visit waits about a minute; open
  sockets keep it awake during a game. Games in progress end on every sleep, restart and redeploy.
- [The web build typechecks first] → a typecheck error anywhere in the web app blocks the deploy, which is the intent.
