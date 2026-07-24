#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Neighbour safety check (playbook §3): ShuleHQ is live production with paying
# clients. We verify it BEFORE and AFTER every WHK deploy so any shared-resource
# impact (OOM, CPU starvation, Caddy misconfig) is caught immediately.
#
# Run from GitHub Actions — i.e. OUTSIDE the box it watches (§6.9).
# A Cloudflare challenge is NOT an outage: 403 + cf-mitigated counts as healthy.
#
# Usage: check-neighbour.sh <URL> <before|after>
# ─────────────────────────────────────────────────────────────────────────────
set -Eeuo pipefail

URL="${1:?usage: check-neighbour.sh <URL> <before|after>}"
PHASE="${2:-check}"
ATTEMPTS=5

for i in $(seq 1 "$ATTEMPTS"); do
  headers="$(curl -sS -D - -o /dev/null --max-time 15 "$URL" 2>/dev/null || true)"
  code="$(printf '%s' "$headers" | awk 'NR==1{print $2}')"

  # Healthy: any 2xx/3xx …
  if [[ "$code" =~ ^(2|3)[0-9][0-9]$ ]]; then
    echo "✓ ShuleHQ healthy ($PHASE): HTTP $code"
    exit 0
  fi

  # … or a Cloudflare mitigation, which means the edge is up and protecting it.
  if [[ "$code" == "403" ]] && printf '%s' "$headers" | grep -qi 'cf-mitigated'; then
    echo "✓ ShuleHQ healthy ($PHASE): HTTP 403 + cf-mitigated (Cloudflare challenge, not an outage)"
    exit 0
  fi

  echo "  attempt $i/$ATTEMPTS → HTTP ${code:-000}"
  sleep 5
done

echo "✖ ShuleHQ appears UNHEALTHY ($PHASE) after $ATTEMPTS attempts — last HTTP ${code:-000}" >&2
if [[ "$PHASE" == "before" ]]; then
  echo "   Refusing to deploy: fix the neighbour first, or you won't be able to tell" >&2
  echo "   whether this deploy caused the problem." >&2
else
  echo "   WHK deploy may have impacted the shared box — investigate immediately." >&2
fi
exit 1
