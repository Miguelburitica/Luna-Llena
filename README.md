# Luna Llena

An online Werewolf party game for groups of friends: 6 to 15 players plus one human narrator. The narrator runs the
game from a desktop dashboard and players join from their phones or laptops. Everyone talks over an external voice
call. The game handles text chat, secret roles, night actions, voting, atmosphere (animation and sound) and
AI-drafted narration.

There is also an in-person mode. It runs entirely on the narrator's device, needs no room, code or network, and the
phone is passed around the table.

## Stack and layout

A pnpm monorepo in strict TypeScript on Node 24.

| Path | What it is |
|---|---|
| `apps/web` | Vue 3 SPA: Vite, Vue Router, Pinia, vue-i18n (en and es), socket.io-client |
| `apps/server` | Node + Socket.io server, run with `tsx`. It is authoritative and keeps game state in memory |
| `packages/contracts` | Shared kernel: ids, enums, DTOs, socket event maps and error codes |
| `packages/rules` | The game rules (`Match`, night, voting, dealing), imported by both the server and the web for in-person mode |
| `tools` | The custom ESLint rules and the no-comments check |

Every feature lives in `src/features/<feature>/` with `domain`, `application` and `infrastructure` folders. Tests use
Vitest everywhere.

## Run it locally

Requires Node 24 (see `.nvmrc`) and pnpm 11.

```bash
pnpm install
```

```bash
pnpm -C apps/server dev
```

```bash
pnpm -C apps/web dev
```

Open http://localhost:5173. Vite proxies `/socket.io` to the server on port 3001.

The server reads an optional `.env` at the repository root. Without `OPENROUTER_API_KEY`, bots use scripted lines.
Without `ADMIN_TOKEN`, the moderation screen at `/admin` is off.

## Check it

```bash
pnpm check
```

This runs lint, typecheck and tests across the workspace. Lint fails on any comment in code, templates or styles, and
on imports that cross layer boundaries.

## Deploy

The game deploys as one Render web service from the blueprint in `render.yaml`. See
[docs/deploy-render.md](docs/deploy-render.md) for the steps and caveats.

## How work is done

- `openspec/config.yaml` holds the product context, architecture, conventions and workflow. They are binding.
- `openspec/specs/` describes what the game does, one folder per capability.
- Every change goes through `openspec/changes/<name>` (proposal, specs, design, tasks) and is archived into
  `openspec/changes/archive` when done.
- `CLAUDE.md` summarizes the rules and points at the `room` feature as the gold example to copy.
- `design/canvas/*.dc.html` are the screens from Claude Design, with `design/ui-brief.md` as the brief. Views reuse
  their markup and the classes in `apps/web/src/shared/infrastructure/ui/styles/design-system.css`.

A change is done only when `pnpm check` passes and every spec scenario has a test.
