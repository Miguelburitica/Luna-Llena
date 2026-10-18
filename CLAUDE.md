# Luna Llena

An online Werewolf party game: a Vue 3 SPA (`apps/web`), a Node + Socket.io server (`apps/server`), and a shared kernel (`packages/contracts`).

## Read first
- `openspec/config.yaml`: product context, architecture, conventions and workflow. These are binding.
- `openspec/specs/`: what the game does. Every change goes through `openspec/changes/<name>` (proposal, specs, design, tasks) and gets archived when done.
- `design/canvas/*.dc.html`: the screens from Claude Design. Reuse their markup and the classes from `apps/web/src/shared/infrastructure/ui/styles/design-system.css`.

## Gold example
The `room` feature is the reference for everything new. Copy its shape:
- Server: `apps/server/src/features/room/{domain,application,infrastructure}`
  - Aggregate methods return `Result`.
  - One use case class per command.
  - `changeRoomAs` and `saveAndPublish` remove the repeated load, mutate, save and publish steps.
  - Socket handlers wrap requests with `answer`.
- Web: `apps/web/src/features/room/{domain,application,infrastructure}`
  - Pure view rules in `domain`.
  - Ports plus a Pinia setup store with injected adapters in `application`.
  - Gateways, views, components and i18n in `infrastructure`.
- Tests:
  - `*.fixtures.ts` hold test doubles and builders.
  - Server use cases run against `createRoomKit`.
  - Web views mount through `mountRoomView`.

## Rules
- No comments anywhere: code, templates or styles. `pnpm lint` fails on them.
- Layer boundaries are lint errors:
  - `domain` imports no `application`, no `infrastructure` and no framework.
  - `application` imports no `infrastructure`.
- Shared vocabulary (ids, limits, defaults, error codes) belongs in `packages/contracts`. Never restate it in an app.
- A change is done only when `pnpm check` passes and every spec scenario has a test.

## Commands
- `pnpm check`: lint, typecheck and tests across the workspace.
- `pnpm -C apps/server dev` and `pnpm -C apps/web dev`: run the game at http://localhost:5173. Vite proxies `/socket.io` to port 3001.
