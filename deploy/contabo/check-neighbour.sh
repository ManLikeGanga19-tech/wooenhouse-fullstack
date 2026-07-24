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

  # This is a LIVENESS tripwire, not a functional test. ShuleHQ is "up" if the
  # server RESPONDED with any non-5xx status — including the expected 401 from an
  # auth-protected deep-health endpoint (proves the backend + shared Postgres are
  # reachable). Only a 5xx or no-response means a WHK deploy may have harmed the
  # shared box (OOM, CPU starvation, DB/Caddy impact → 5xx / connection failure).
  if [[ "$code" =~ ^[1-4][0-9][0-9]$ ]]; then
    note=""
    printf '%s' "$headers" | grep -qi 'cf-mitigated' && note=" (Cloudflare challenge)"
    echo "✓ ShuleHQ healthy ($PHASE): HTTP $code — server responded${note}"
    exit 0
  fi

  echo "  attempt $i/$ATTEMPTS → HTTP ${code:-000} (no response / 5xx)"
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
