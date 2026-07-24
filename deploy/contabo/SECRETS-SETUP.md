# WHK — GitHub Actions secrets & variables setup

Everything the Contabo deploy pipeline needs, where to get it, and where to put it.
Do this **once**, before the first deploy.

> **Never** paste these values into a commit, an issue, or a chat. `.env.production`
> is gitignored; the only copies live in the GitHub secret and on the box.

---

## Where things go

**Repo → Settings → Secrets and variables → Actions** — two tabs:

| Tab | Use for | Visible? |
|---|---|---|
| **Secrets** | keys, passwords, the whole env file | encrypted, masked in logs |
| **Variables** | public URLs | plain text, readable |

---

## Confirmed facts about the box

Verified directly on `94.72.102.13`, not assumed:

| Fact | Value |
|---|---|
| Edge proxy | `sms-caddy` (on both ShuleHQ networks) |
| Database container | `sms-postgres` — `postgres:18-alpine`, healthy |
| ShuleHQ networks | `shulehq_backend-net` (also holds `sms-backend`, `sms-redis`, `sms-nginx`), `shulehq_frontend-net` |
| WHK networks | `whk-edge-net`, `whk-db-net` — **dedicated**, see §3 |
| Deploy path | `/opt/woodenhouses`, owned by `deploy` |

---

## Step 0 — Create the `production` environment

**Settings → Environments → New environment → `production`**
(The workflow declares `environment: production`.)

Optional but recommended: add yourself as a **Required reviewer** so every deploy
pauses for one-click approval — cheap insurance on a box with paying clients.

---

## Step 1 — CI SSH key (a NEW key; never reuse the admin key)

```bash
ssh-keygen -t ed25519 -C "whk-ci-deploy" -f ~/.ssh/whk_ci_deploy -N ""
```

The VPS is hardened to **keys only** — `ssh-copy-id` will fail on a password prompt.
Install the public half using your existing admin key:

```bash
PUBKEY="$(cat ~/.ssh/whk_ci_deploy.pub)"
ssh -i ~/.ssh/shulehq_admin_key -o IdentitiesOnly=yes deploy@94.72.102.13 \
  "umask 077; mkdir -p ~/.ssh; \
   grep -qxF '$PUBKEY' ~/.ssh/authorized_keys 2>/dev/null || echo '$PUBKEY' >> ~/.ssh/authorized_keys; \
   echo INSTALLED"
```

> `IdentitiesOnly=yes` matters if you have many keys in `~/.ssh` — otherwise SSH
> offers them all and trips `MaxAuthTries`.

Verify, then prepare the deploy path:

```bash
ssh -i ~/.ssh/whk_ci_deploy -o IdentitiesOnly=yes deploy@94.72.102.13 \
  'echo "CONNECTED as $(whoami)"; id -nG | tr " " "\n" | grep -qx docker && echo "docker: OK"'

ssh -i ~/.ssh/whk_ci_deploy -o IdentitiesOnly=yes deploy@94.72.102.13 \
  'sudo mkdir -p /opt/woodenhouses && sudo chown deploy:deploy /opt/woodenhouses'
```

→ **Secret `CONTABO_SSH_KEY`** = the full output of `cat ~/.ssh/whk_ci_deploy`
(including the `BEGIN`/`END` lines)
→ **Secret `CONTABO_HOST`** = `94.72.102.13`
→ **Secret `CONTABO_USER`** = `deploy`

---

## Step 2 — Dedicated Docker networks (playbook §3 isolation)

`sms-postgres` lives on `shulehq_backend-net` **together with ShuleHQ's app
containers**. Joining that network would work but breaks the isolation rule
("never share a network with ShuleHQ's app containers"). Instead, give WHK two
dedicated networks so it can reach *only* Caddy and *only* Postgres:

```bash
ssh -i ~/.ssh/whk_ci_deploy -o IdentitiesOnly=yes deploy@94.72.102.13 '
docker network create whk-edge-net 2>/dev/null || echo "whk-edge-net exists"
docker network create whk-db-net   2>/dev/null || echo "whk-db-net exists"
docker network connect whk-edge-net sms-caddy    2>/dev/null || echo "caddy already attached"
docker network connect whk-db-net   sms-postgres 2>/dev/null || echo "postgres already attached"
docker network inspect -f "whk-edge-net: {{range .Containers}}{{.Name}} {{end}}" whk-edge-net
docker network inspect -f "whk-db-net:   {{range .Containers}}{{.Name}} {{end}}" whk-db-net
'
```

`docker network connect` attaches a **running** container without restarting it —
ShuleHQ stays up.

> ⚠️ **Durability caveat.** This attachment is runtime-only. If ShuleHQ is later
> redeployed with `docker compose up -d`, Compose may **detach** `sms-caddy` /
> `sms-postgres` from the WHK networks, breaking WHK (not ShuleHQ). The permanent
> fix is to declare both networks as `external` in ShuleHQ's own compose file.
> Do this before you consider the setup stable.

---

## Step 3 — WHK's own database + role

```bash
ssh -i ~/.ssh/whk_ci_deploy -o IdentitiesOnly=yes deploy@94.72.102.13
docker exec -it sms-postgres psql -U postgres
```

```sql
CREATE ROLE woodenhouses LOGIN PASSWORD 'PUT_A_STRONG_UNIQUE_PASSWORD_HERE';
CREATE DATABASE woodenhouses OWNER woodenhouses;
REVOKE ALL ON DATABASE shulehq FROM woodenhouses;
```

**Prove the isolation actually holds** — this is the point of the exercise:

```sql
\c shulehq
SET ROLE woodenhouses;
SELECT * FROM core.tenants;   -- MUST be denied
RESET ROLE;
```

---

## Step 4 — Contabo Object Storage (media)

**Contabo Customer Panel → Object Storage**

1. Create a bucket, e.g. `woodenhouses-media`; note the endpoint (e.g. `https://eu2.contabostorage.com`).
2. Set the bucket **public-read** — the marketing site serves images directly.
3. Generate **S3 credentials** (access key + secret).

---

## Step 5 — Values you already have (Render is the source)

**Render Dashboard → WHK service → Environment.** Don't regenerate these:

| Copy from Render | Into |
|---|---|
| `Resend__ApiKey` (`re_…`) | env file |
| `Claude__ApiKey` (`sk-ant-…`) | env file |
| `Recaptcha__SecretKey` | env file |
| `Jwt__Key` | env file — **copy rather than regenerate**, so existing admin sessions survive the cutover |
| reCAPTCHA **site** key (`6L…`) | **Secret `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`** |

> The site key and secret key **must be a matching pair** from the same reCAPTCHA
> site, and the domain must be registered there. A mismatch is the exact bug that
> silently buried every contact-form lead.

---

## Step 6 — Generate the genuinely new values

```bash
openssl rand -base64 24   # → the Postgres role password (Step 3)
openssl rand -base64 24   # → Seed__AdminPassword
openssl rand -base64 64   # → Jwt__Key  (ONLY if not copying from Render)
```

---

## Step 7 — Secret `WHK_PRODUCTION_ENV`

Paste the **entire** env file (template: `.env.production.example`) as one
multi-line secret. Two things that bite:

- **`CLAUDE_MAX_CONCURRENCY` is a bare env var**, not `Section__Key`. Every other
  setting uses the `__` separator; this one does not. Get it wrong and the agent
  concurrency cap silently doesn't apply.
- **`Seed__AdminPassword` is mandatory** — the app *throws on startup* if it's missing.

---

## Step 8 — Variables (Variables tab, not Secrets)

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.woodenhouseskenya.com` |
| `NEXT_PUBLIC_SITE_URL` | `https://woodenhouseskenya.com` |
| `NEXT_PUBLIC_ADMIN_URL` | `https://admin.woodenhouseskenya.com` |
| `SHULEHQ_HEALTH_URL` | ShuleHQ's public URL (neighbour check) |

> `NEXT_PUBLIC_*` are **inlined at build time**. Changing one requires a
> **redeploy**, not just an env edit.

---

## Step 9 — Verify

1. **Actions → Deploy WHK → Contabo → Run workflow.** The `verify` job needs no
   secrets — green means the build pipeline is sound.
2. A wrong secret fails at the SSH step, which is a **safe** failure: it never
   reaches the box.
3. Spot check: `ssh -i ~/.ssh/whk_ci_deploy deploy@94.72.102.13 'docker ps'`.

---

## Checklist

- [ ] `production` environment created
- [ ] `CONTABO_SSH_KEY` / `CONTABO_HOST` / `CONTABO_USER`
- [ ] `whk-edge-net` + `whk-db-net` created and attached
- [ ] DB + role created, cross-DB access **denied** (verified)
- [ ] Object Storage bucket + keys
- [ ] `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
- [ ] `WHK_PRODUCTION_ENV`
- [ ] 4 Variables
- [ ] ShuleHQ compose updated with the external networks (durability)
