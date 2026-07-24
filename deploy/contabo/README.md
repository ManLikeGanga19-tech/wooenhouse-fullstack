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

---

## CI/CD — `.github/workflows/deploy-contabo.yml`

Single deploy path (playbook §6.5). Flow: **build in CI → `docker save` → ship →
`docker load` → `compose up` → health gate**. Images are never pulled on the box (§6.1).

**Triggers:** push to `main` touching `backend/**`, `frontend/**`, `deploy/contabo/**`,
or manual `workflow_dispatch`.

### Safety built in
| Guard | What it does |
|---|---|
| `verify` job | Backend build + full test suite, `npm audit --audit-level=high`, frontend build. Nothing ships unless green. |
| ShuleHQ check **before** | Refuses to deploy if the neighbour is already unhealthy — otherwise you can't tell if *you* broke it (§3). |
| Health gate | Waits for both containers' Docker healthchecks; **auto-rolls back** to the previous tag on failure. |
| External verification | Curls the public site + `/health` from GitHub Actions, i.e. from outside the box (§6.9). |
| ShuleHQ check **after** | Runs even if the deploy failed (`always()`) to catch shared-resource impact (§3). |
| `concurrency` | Only one deploy touches the host at a time. |

### Required GitHub **secrets**
| Secret | Purpose |
|---|---|
| `CONTABO_SSH_KEY` | Private key for the CI deploy user (its own key — not the admin key). |
| `CONTABO_HOST` | VPS host/IP. |
| `CONTABO_USER` | Deploy user (`deploy`). |
| `WHK_PRODUCTION_ENV` | Full contents of `.env.production` (see `.env.production.example`). Written to the box at deploy time, never committed. |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Build-time (inlined — §6.10). |

### Required GitHub **variables**
| Variable | Example |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.woodenhouseskenya.com` |
| `NEXT_PUBLIC_SITE_URL` | `https://woodenhouseskenya.com` |
| `NEXT_PUBLIC_ADMIN_URL` | `https://admin.woodenhouseskenya.com` |
| `SHULEHQ_HEALTH_URL` | ShuleHQ URL for the neighbour check. |

> `NEXT_PUBLIC_*` are **inlined at build time**, so changing one requires a rebuild
> (a redeploy), not just an env edit (§6.10).

### Rollback
`deploy.sh` records the live tag in `.last_deployed_tag` on the box. If the health
gate fails it automatically re-deploys the previous tag. To roll back manually:

```bash
cd /opt/woodenhouses && ./deploy.sh <previous-tag>
```
