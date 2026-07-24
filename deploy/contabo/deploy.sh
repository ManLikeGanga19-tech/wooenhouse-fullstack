#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# WHK on-box deploy — runs on the Contabo VPS as the `deploy` user.
#
# Playbook rules enforced here:
#   §6.1  images are LOADED from shipped tars, never pulled (box has no registry creds)
#   §6.5  one deploy path only — this script is the single entry point
#   §6.6  migrations run from the image on startup (never `docker cp`-ed in)
#   §2    hard cpus/mem_limit come from the compose file, not from here
#
# Health-gated with automatic rollback to the previous image tag.
# Usage:  ./deploy.sh <IMAGE_TAG>
# ─────────────────────────────────────────────────────────────────────────────
set -Eeuo pipefail

TAG="${1:?usage: deploy.sh <IMAGE_TAG>}"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Load stack config from the env file so this script drives prod AND staging
# with no edits (staging sets STACK_NAME / BACKEND_NAME / FRONTEND_NAME).
set -a; [[ -f "${APP_DIR}/.env.production" ]] && . "${APP_DIR}/.env.production"; set +a

PROJECT="${STACK_NAME:-woodenhouses}"
COMPOSE="docker compose -p ${PROJECT} --env-file ${APP_DIR}/.env.production -f ${APP_DIR}/docker-compose.prod.yml"
LAST_TAG_FILE="${APP_DIR}/.last_deployed_tag"
CONTAINERS=("${BACKEND_NAME:-woodenhouses-backend}" "${FRONTEND_NAME:-woodenhouses-frontend}")
HEALTH_TIMEOUT=180   # seconds to reach healthy before we roll back

log() { printf '\n\033[1m▶ %s\033[0m\n' "$*"; }
die() { printf '\n\033[31m✖ %s\033[0m\n' "$*" >&2; exit 1; }

cd "$APP_DIR"

# ── 1. Preconditions ─────────────────────────────────────────────────────────
[[ -f .env.production ]] || die ".env.production missing — CI must ship it before deploy."
[[ -f docker-compose.prod.yml ]] || die "docker-compose.prod.yml missing."

# ── 2. Load the shipped images (never pull — §6.1) ───────────────────────────
log "Loading images (tag: ${TAG})"
for tar in images/*.tar.gz; do
  [[ -e "$tar" ]] || die "No image tarballs found in ${APP_DIR}/images/"
  gunzip -c "$tar" | docker load
done

# ── 3. Remember what's currently running, so we can roll back ────────────────
PREV_TAG="$(cat "$LAST_TAG_FILE" 2>/dev/null || echo "")"
log "Previous tag: ${PREV_TAG:-<none>}"

# ── 4. Bring up the new tag ──────────────────────────────────────────────────
log "Starting containers"
IMAGE_TAG="$TAG" $COMPOSE up -d --remove-orphans

# ── 5. Health gate — wait for Docker's own healthchecks ──────────────────────
wait_healthy() {
  local deadline=$(( SECONDS + HEALTH_TIMEOUT ))
  while (( SECONDS < deadline )); do
    local all_ok=1
    for c in "${CONTAINERS[@]}"; do
      local status
      status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}nohealth{{end}}' "$c" 2>/dev/null || echo missing)"
      [[ "$status" == "healthy" ]] || all_ok=0
    done
    (( all_ok )) && return 0
    sleep 5
  done
  return 1
}

log "Waiting for containers to report healthy (max ${HEALTH_TIMEOUT}s)"
if wait_healthy; then
  echo "$TAG" > "$LAST_TAG_FILE"
  log "Healthy ✓  deployed ${TAG}"
else
  printf '\n\033[31m✖ Health gate FAILED — container states:\033[0m\n' >&2
  for c in "${CONTAINERS[@]}"; do
    echo "--- $c ---" >&2
    docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}nohealth{{end}}' "$c" 2>/dev/null >&2 || true
    docker logs --tail 40 "$c" 2>&1 | sed 's/^/    /' >&2 || true
  done

  if [[ -n "$PREV_TAG" ]]; then
    log "ROLLING BACK to ${PREV_TAG}"
    IMAGE_TAG="$PREV_TAG" $COMPOSE up -d --remove-orphans
    wait_healthy && echo "rollback healthy" >&2 || echo "rollback ALSO unhealthy — manual intervention needed" >&2
  else
    echo "No previous tag recorded — cannot auto-roll back." >&2
  fi
  die "Deploy failed and was rolled back."
fi

# ── 6. Tidy up (keep the box lean; never touch other apps' images) ───────────
log "Pruning dangling images"
docker image prune -f >/dev/null 2>&1 || true
rm -rf "${APP_DIR}/images"

log "Done."
