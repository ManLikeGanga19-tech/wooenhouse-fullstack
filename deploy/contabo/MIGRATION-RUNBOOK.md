# WHK — Render → Contabo migration runbook (Phase 3)

The step-by-step cutover, with a **staging dress rehearsal first**. Nothing here
touches the live Render site until the rehearsal has proven the whole path.

**Golden rule (playbook §0):** never harm ShuleHQ. Every deploy runs the neighbour
health check before *and* after; if ShuleHQ looks unhealthy *before*, stop.

---

## Prerequisites (do these once — see SECRETS-SETUP.md)

- [ ] GitHub secrets + variables set; `production` environment created
- [ ] `whk-edge-net` + `whk-db-net` created and attached to `sms-caddy` / `sms-postgres`
- [ ] **Both** the WHK Caddy config *and* the Cloudflare API token exist on the box
      (see §A below) — Caddy needs `CF_API_TOKEN_WOODENHOUSES` to issue TLS
- [ ] Contabo Object Storage bucket + keys in the env secret; the public-read
      `curl` test passed (SECRETS-SETUP §4-5)

### §A — Cloudflare token + Caddy import (one-time)
1. Cloudflare → **My Profile → API Tokens → Create Token** → *Edit zone DNS*
   template, scoped to the `woodenhouseskenya.com` zone (Zone:Read + DNS:Edit).
2. On the box, add it to Caddy's environment (same mechanism ShuleHQ uses for its
   token — typically an `Environment=` line in the Caddy systemd unit or the
   caddy container's env), as `CF_API_TOKEN_WOODENHOUSES`.
3. Ship the Caddy site files and import them from the main Caddyfile:
   ```
   import /etc/caddy/sites/woodenhouses.caddy            # prod (add at cutover)
   import /etc/caddy/sites/woodenhouses-staging.caddy    # staging (rehearsal only)
   ```
   Reload: `docker exec sms-caddy caddy reload --config /etc/caddy/Caddyfile` (or
   the host `caddy reload`), and confirm ShuleHQ's sites still serve afterwards.

---

## Part 1 — DNS (actual topology, confirmed from the Cloudflare import)

The domain was moved onto Cloudflare during Phase 3. Current live topology
(NOT all-Render as first assumed):

| Host | Today | Proxy |
|---|---|---|
| `woodenhouseskenya.com` (apex) | a2hosting `209.142.65.51` | proxied |
| `www` | Vercel (CNAME) | proxied |
| `admin` | Vercel (CNAME) | proxied |
| API | Render (frontend calls the `.onrender.com` URL directly — no `api` DNS record yet) | — |
| `mail`, `webmail`, `ftp`, `webdisk`, `cpanel`, `whm`, `cp*` | a2hosting | **DNS only** |
| MX / SPF / DKIM / DMARC | a2hosting + Amazon SES + Resend | DNS only |

**Rule that must hold at every step:** only the three *web* hosts are proxied
(apex, www, admin). Email/FTP/cPanel stay **DNS only** — proxying them breaks
mail (Cloudflare only proxies HTTP 80/443). Email + cPanel stay on a2hosting
**untouched** through the entire migration.

**Cutover DNS changes** (in Cloudflare, at §3.3 — nothing before then):
- `www` : CNAME→Vercel  →  **A → `94.72.102.13`** (proxied)
- `admin` : CNAME→Vercel  →  **A → `94.72.102.13`** (proxied)
- `woodenhouseskenya.com` (apex) : A→a2hosting → **A → `94.72.102.13`** (proxied)
  — *only if the bare apex serves the marketing site; if it just redirects to
  www or is cPanel-only, leave it and rely on www.*
- **Add `api` : A → `94.72.102.13`** (proxied) — new hostname for the backend
- Everything email/cPanel: **no change**

Caddy issues TLS via Cloudflare DNS-01, so proxied (orange) is fine — the origin
cert validates behind the proxy. After the zone is Active, set **SSL/TLS → Full
(strict)** (both current origins have valid certs).

> Lower the TTL on the web records to **60s the day before cutover** so the flip
> propagates fast and rollback (point back to Vercel/a2hosting) is near-instant.

> Because Cloudflare is now authoritative, any record a2hosting served that the
> import missed would break — compare against a2hosting cPanel → Zone Editor once.

---

## Part 2 — Dress rehearsal (staging, zero prod risk)

Proves the **entire** path — image build, shipping, shared-Postgres connectivity,
Caddy TLS, app boot, EF migrations, and a full feature pass **on migrated real
data** — on a throwaway subdomain. The live Render site is never touched.

### 2.1 DNS
Add (Cloudflare, proxied):
```
staging.woodenhouseskenya.com      → 94.72.102.13
api.staging.woodenhouseskenya.com  → 94.72.102.13
```

### 2.2 Staging database (copy of prod data)
On the box:
```bash
docker exec -it sms-postgres psql -U postgres -c \
  "CREATE DATABASE woodenhouses_staging OWNER woodenhouses;"
```
Dump **from the VPS** (its pg18 client can dump Render's older server; a local
pg16 client cannot — playbook §6.4). Get Render's *external* connection string
from the Render dashboard:
```bash
# on the VPS:
docker exec sms-postgres pg_dump \
  --no-owner --no-privileges \
  "postgresql://woodenhouses_db_user:PASSWORD@RENDER_EXTERNAL_HOST/woodenhouses_db?sslmode=require" \
  > /tmp/whk_render.sql

# restore into the staging DB:
docker exec -i sms-postgres psql -U postgres -d woodenhouses_staging < /tmp/whk_render.sql
docker exec sms-postgres psql -U postgres -d woodenhouses_staging -c \
  "GRANT ALL ON ALL TABLES IN SCHEMA public TO woodenhouses; \
   GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO woodenhouses;"
```

### 2.3 Staging env
Copy `.env.production.example` → assemble a staging env with these overrides,
then ship it to the box as `/opt/woodenhouses-staging/.env.production`:
```
STACK_NAME=woodenhouses-staging
BACKEND_NAME=woodenhouses-staging-backend
FRONTEND_NAME=woodenhouses-staging-frontend
ConnectionStrings__DefaultConnection=Host=sms-postgres;...;Database=woodenhouses_staging;...
Cors__AllowedOrigins=https://staging.woodenhouseskenya.com
Frontend__Url=https://staging.woodenhouseskenya.com
Frontend__AdminUrl=https://staging.woodenhouseskenya.com
```
Everything else (keys, S3, etc.) is the same as prod. Frontend build args must
use the staging URLs, so build staging images with
`NEXT_PUBLIC_*=https://staging...` / `https://api.staging...`.

### 2.4 Bring it up
Ship the images + `docker-compose.prod.yml` + `deploy.sh` to
`/opt/woodenhouses-staging/`, then:
```bash
cd /opt/woodenhouses-staging && ./deploy.sh <tag>
```
`deploy.sh` reads `STACK_NAME` / `*_NAME` from the env, so it health-gates the
staging containers with no edits.

### 2.5 Verify on staging — the feature pass
- [ ] `https://staging.woodenhouseskenya.com` loads (valid TLS)
- [ ] `https://api.staging.woodenhouseskenya.com/health` → 200
- [ ] Admin login works (`Seed__AdminPassword`) at the admin host
- [ ] **Real data present** — contacts/quotes/projects from Render are visible
- [ ] Contact form submit → lands in the admin inbox (not spam) and the estimator shows prices
- [ ] **Image upload** → lands in the Contabo bucket, renders back via the public URL
- [ ] Agents draft a reply into the approval queue (no `ObjectDisposedException` in logs)
- [ ] `docker stats` — staging containers sit well under their caps
- [ ] **ShuleHQ still healthy** the whole time

### 2.6 Tear down staging
```bash
docker compose -p woodenhouses-staging -f /opt/woodenhouses-staging/docker-compose.prod.yml down
docker exec sms-postgres psql -U postgres -c "DROP DATABASE woodenhouses_staging;"
# remove the staging Caddy import + reload; delete the staging DNS records
```

**Do not proceed to cutover until every box in 2.5 is ticked.**

---

## Part 3 — Production cutover (gated)

Only after a green rehearsal.

### 3.1 Freeze + final data sync
1. **Quiet window.** Pick low-traffic hours.
2. On Render, put the app in maintenance / stop writes if possible (or accept a
   small delta and re-sync — contacts are append-mostly).
3. **Fresh dump → restore into the real `woodenhouses` DB** (same commands as 2.2,
   target `woodenhouses`). This is the authoritative data.

### 3.2 Deploy prod
- Ensure prod DNS records exist per Part 1 (for scenario A they still point at
  Render at this moment — that's fine; Caddy gets its cert via DNS-01 regardless).
- Merge to `main` (or run the workflow) → CI builds, ships, `deploy.sh` loads →
  `compose up` → **health gate**. The neighbour check guards ShuleHQ before/after.
- Confirm the containers are healthy and `api.woodenhouseskenya.com/health` (from
  the box, via the container) returns 200 **before** any traffic is sent.

### 3.3 Flip traffic
- **Scenario A:** change `@`/`www`/`api`/`admin` in Cloudflare from Render's target
  to `94.72.102.13`. With 60s TTL it propagates in ~1-2 min.
- **Scenario B:** add those A records → `94.72.102.13`.

### 3.4 Verify from the public internet (§6.9 — outside the box)
- [ ] site, admin, `api/health` all 200 over HTTPS
- [ ] a real contact submission arrives in the dashboard
- [ ] an image upload works end-to-end
- [ ] ShuleHQ unaffected (`docker stats`, ShuleHQ health)

### 3.5 Rollback (if anything fails)
- **Fast:** point the Cloudflare records back at Render — the old site is still
  running there. This is why we **don't decommission Render yet** and keep TTL low.
- **App-level:** `./deploy.sh <previous-tag>` re-deploys the last good image
  (auto-triggered by the health gate on a failed deploy anyway).

---

## Part 4 — Burn-in + decommission

### 4.1 Backups BEFORE retiring Render (playbook §6.11 / §7)
- [ ] Extend the box's nightly backup to dump `woodenhouses` too, to the offsite target.
- [ ] Let it run **unattended at least once** and **verify the dump restores**.
- [ ] Only then consider Render's data expendable.

### 4.2 48-hour burn-in
- [ ] External watchdog (GitHub Actions) pings site + `/health` on a schedule; pages on failure
- [ ] Watch `docker stats` and cgroup throttling (`/sys/fs/cgroup/.../cpu.stat` `nr_throttled`)
      under real traffic — right-size caps from evidence, not guesses (§2)
- [ ] Confirm the scheduled agents (followup, accounts) run without starving the box
- [ ] Confirm emails send (Resend) and images load (Contabo) under real use

### 4.3 Decommission Render
- [ ] Only after 4.1 + 4.2 are green: suspend, then delete the Render service + its DB.
- [ ] **Rotate every secret** that passed through the migration (Claude, Resend,
      reCAPTCHA, DB password, admin password, mailbox passwords) — they were handled
      during setup and should not be the long-term production secrets.

### 4.4 Optional — migrate old media off Cloudinary
Existing images still load from Cloudinary (its `remotePattern` is retained). To
fully drop the last third party: copy the Cloudinary assets into the Contabo
bucket, rewrite their URLs in the DB (`projects.images`, `blog.coverImage`, etc.),
then remove the `res.cloudinary.com` pattern from `next.config.js`. Not required
for cutover — do it as a follow-up.

---

## Definition of done (playbook §8)
- [ ] WHK live on Contabo, TLS valid, all three hosts serving
- [ ] Real data migrated and verified
- [ ] ShuleHQ unaffected throughout (before/after checks green on every deploy)
- [ ] Backups running unattended + restore-verified
- [ ] Render decommissioned, secrets rotated
- [ ] Caps sized from real traffic, not guesses
