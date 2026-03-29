# CubicJ Cafe

AI Image-to-Video generation web frontend powered by ComfyUI.

## Features

- **Image-to-Video** — Upload an image with a prompt, get a generated video
- **Multi-Model** — WAN 2.2 (LoRA support, end image, variable duration) / LTX 2.3 (audio support)
- **LoRA Presets** — Create and manage style presets with drag-and-drop ordering
- **Queue System** — Serializable queue with real-time status tracking
- **Discord Integration** — OAuth2 auth + bot delivery of completed videos
- **Admin Dashboard** — Live log viewer (SSE), queue control, ComfyUI monitoring, DB tools
- **Multi-Server** — Auto-selects between local and cloud (RunPod) ComfyUI instances

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TailwindCSS 4, Shadcn/ui |
| Backend | Next.js API Routes, Prisma 6, SQLite |
| Auth | Custom Discord OAuth2 (HttpOnly cookie sessions) |
| Validation | Zod v4 schemas across all route handlers |
| AI Backend | ComfyUI API (JSON workflow graphs) |
| Bot | Discord.js (in-process) |
| Testing | Vitest, SQLite test DB, route handler direct invocation |
| Logging | Custom unified logger (server + client → files + SSE) |
| Deployment | systemd + Nginx + SSL (Next.js standalone) |

## Project Structure

```
src/
├── app/
│   ├── api/          # 33 API route handlers
│   │   ├── i2v/      # Video generation endpoint
│   │   ├── queue/    # Queue management + monitoring
│   │   ├── admin/    # Protected admin routes
│   │   └── auth/     # Discord OAuth2 flow
│   ├── i2v/          # Generation page
│   └── admin/        # Admin dashboard
├── lib/
│   ├── comfyui/      # Workflow builders, queue/job monitors, server management
│   │   └── workflows/  # Per-model builders (WAN, LTX) + registry
│   ├── database/     # Prisma service layer
│   ├── auth/         # Session management, withAuth/withAdmin HOF
│   ├── validations/  # Zod schemas + parse helpers
│   └── logger.ts     # Client-safe unified logger
├── components/       # Shadcn/ui base + domain components
├── contexts/         # React Context (session, form state)
└── hooks/            # Custom React hooks
tests/
├── integration/api/  # Route handler tests (real DB sessions)
└── unit/             # Module tests
```

## Development

```bash
npm install
npm run prisma:migrate    # Set up database
npm run dev               # Dev server
npm test                  # 324 tests
npm run type-check        # tsc --noEmit
npm run lint              # ESLint
```

## Deployment

Runs as a systemd service with Next.js standalone output. Environment variables live in `.env` (not version controlled — see `.env.example` for the template).

Production uses `.env.production` loaded via systemd `EnvironmentFile`.

```bash
npm run build
# Deploy .next/standalone + .next/static + public to target
# systemd EnvironmentFile loads .env.production
# ExecStart: node .next/standalone/server.js
```

## Architecture Notes

- ComfyUI workflows are JSON node graphs — each model has a completely different structure, dispatched via `workflow-router.ts`
- Queue uses Serializable isolation for atomic position assignment
- Logger is split: `logger.ts` stays client-safe (no `fs`), file I/O in `logger-file.ts` connected via `instrumentation.ts`
- Discord bot runs in-process (not a separate service)
- All state singletons use `globalThis` to survive Next.js dev hot reload

## License

[MIT](LICENSE)
