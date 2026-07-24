# Contabo deploy bundle — Wooden Houses Kenya

WHK co-hosts on the Contabo VPS alongside ShuleHQ, sharing only Postgres/Redis/Caddy
and fenced off everywhere else. See `docs/ops/SECOND_PLATFORM_PLAYBOOK.md` for the
full rationale and the migration runbook (Phase 3).

## Files
| File | What it is |
|---|---|
| `../../backend/Dockerfile` | .NET 8 API image (multi-stage, non-root, healthcheck on `/health`) |
| `../../frontend/Dockerfile` | Next.js **standalone** image. `NEXT_PUBLIC_*` are **build args** (inlined at build) |
| `docker-compose.prod.yml` | WHK stack — hard `cpus`/`mem_limit`, isolated networks, images loaded locally |
| `woodenhouses.caddy` | Caddy site block (import into the main Caddyfile). DNS-01 TLS, Cloudflare proxy ON |
| `.env.production.example` | Every required env var + the frontend build args. Copy → `.env.production` (gitignored) |

## Topology (isolation §3)
```
Cloudflare (proxy ON, WAF)
   └─ Caddy (edge)  ──edge net──▶ woodenhouses-frontend :3000
                    ──edge net──▶ woodenhouses-backend  :8080
                                        │
                    internal net  ◀─────┘ (backend↔frontend, private)
                                        │
                    postgres net  ──────┴──▶ sms-postgres  (shared instance,
                                              WHK's own `woodenhouses` DB + role)
```
- **No app ports are published** — everything enters via Caddy.
- **Hard caps:** backend 1.0 cpu / 768m, frontend 0.5 cpu / 512m (well under the box budget; §2).
- `EDGE_NETWORK` / `POSTGRES_NETWORK` in `.env.production` must match the box's real network names.

## Deploy (images are shipped, never pulled — §6.1)
```bash
# On the box, in /opt/woodenhouses, with .env.production in place and images loaded:
docker compose -p woodenhouses -f docker-compose.prod.yml up -d
docker compose -p woodenhouses -f docker-compose.prod.yml ps
```
Building, `docker save`/ship/`docker load`, migrations, DNS, secrets, and the gated
cutover are all in the Phase 3 runbook.
