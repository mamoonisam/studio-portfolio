#!/usr/bin/env bash
# LOCAL TESTING ONLY: runs the migrations twice (to prove they are re-runnable)
# and then the security tests, on a throwaway PostgreSQL server.
# Requires PostgreSQL 15+ binaries (initdb, pg_ctl, psql) on this machine.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
PGBIN="${PGBIN:-$(dirname "$(command -v pg_ctl || ls /usr/lib/postgresql/*/bin/pg_ctl | tail -1)")}"
DATA="$(mktemp -d)"
PORT="${PGPORT_TEST:-55432}"
RUN_AS=""
if [ "$(id -u)" = "0" ]; then
  id pgtest >/dev/null 2>&1 || useradd -M pgtest
  chown -R pgtest "$DATA"
  RUN_AS="runuser -u pgtest --"
fi

cleanup() { $RUN_AS "$PGBIN/pg_ctl" -D "$DATA" stop -m fast >/dev/null 2>&1 || true; rm -rf "$DATA"; }
trap cleanup EXIT

$RUN_AS "$PGBIN/initdb" -D "$DATA" -U postgres -A trust >/dev/null
$RUN_AS "$PGBIN/pg_ctl" -D "$DATA" -o "-p $PORT -k /tmp" -l "$DATA/log" start >/dev/null
sleep 1

export PGOPTIONS="-c client_min_messages=warning"
PSQL=("$PGBIN/psql" -h /tmp -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q)

"${PSQL[@]}" -f "$HERE/local-stub.sql"
for pass in 1 2; do
  for f in "$ROOT"/supabase/migrations/*.sql; do
    "${PSQL[@]}" -f "$f"
  done
  echo "migrations applied (pass $pass)"
done
"${PSQL[@]}" -f "$ROOT/supabase/seed.sql" >/dev/null && echo "seed applied"
"${PSQL[@]}" -f "$HERE/rls-test.sql" 2>&1 >/dev/null | sed -e "s/^psql:[^ ]* NOTICE:  //" -e "s/^psql:[^ ]* //"
echo "ALL TESTS PASSED"
