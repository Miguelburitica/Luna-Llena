## 1. Server infrastructure

- [x] 1.1 Add `serveWebApp` and `ServerOptions.webRoot`, registered in `startServer`; test in `serveWebApp.test.ts` "Opening the game", "Opening a room link", "Built files", "Missing file", "Escaping the folder", "Playing on the same address" and "No build given"
- [x] 1.2 Read `WEB_ROOT` and fall back to `RENDER_EXTERNAL_URL` for the origin in `main.ts`

## 2. Deploy

- [x] 2.1 Add `render.yaml` and `docs/deploy-render.md`

## 3. Verification

- [x] 3.1 Run `pnpm check` green
- [x] 3.2 Build the web app, start the server with `WEB_ROOT`, and play from the server's own address in the browser
