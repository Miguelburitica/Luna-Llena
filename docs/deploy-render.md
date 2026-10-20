# Deploying Luna Llena on Render

The whole game runs as one free Render web service: the Node server serves the built web app, the socket and the admin
route from one address, `https://<service-name>.onrender.com`.

## First deploy

1. Push the repository to GitHub.
2. In Render, choose **New → Blueprint**, pick the repository, and accept `render.yaml`.
3. Fill the two secrets when Render asks, or leave them empty:
   - `OPENROUTER_API_KEY`: bots chat through OpenRouter. Without it they use scripted lines.
   - `ADMIN_TOKEN`: turns on the moderation screen at `/admin`.
4. Wait for the build, then open the service address. Share it with your friends.

Every push to the default branch deploys again.

## What the blueprint sets

| Setting | Value |
|---|---|
| Build | installs with pnpm and builds `apps/web` (the build typechecks first, so a type error stops the deploy) |
| Start | runs `apps/server/src/main.ts` with `tsx` |
| `WEB_ROOT` | `../web/dist`, the built web app, relative to `apps/server` |
| `TRUST_PROXY` | `1`, so player addresses come from Render's proxy |
| `NODE_VERSION` | `24` |

The server trusts its own Render address (`RENDER_EXTERNAL_URL`) for the socket and the admin route. Set `WEB_ORIGIN`
only if you put the game behind another address.

## Things to know

- **Sleep.** A free service sleeps after about 15 minutes without visitors. The first visit after that waits about a
  minute while it wakes up. Open it a minute before game night.
- **Games live in memory.** A sleep, a restart or a deploy ends every game in progress. Deploy between game nights.
- **One instance.** Keep the service at one instance; players in the same room must reach the same process.

## Trying it locally as one service

```bash
pnpm -C apps/web build
```

```bash
WEB_ROOT=../web/dist WEB_ORIGIN=http://localhost:3001 pnpm -C apps/server start
```

Then open http://localhost:3001.
