#!/usr/bin/env bash
# Replace the local jlowe_dev database (docker-compose.yml) with a copy of
# production, then apply any migrations production hasn't had yet.
#
#   PROD_DATABASE_URL='postgres://…' npm run db:copy-prod
#
# Production is only read: pg_dump works from a read-only snapshot. The dump
# holds visitor data (chat logs, contact messages), so it lives in a private
# temp dir that is deleted on exit. Needs pg_dump/pg_restore 17+ (production
# runs PostgreSQL 17).
set -euo pipefail

: "${PROD_DATABASE_URL:?set PROD_DATABASE_URL to the production connection string for this command only}"

LOCAL_SERVER="postgresql://postgres:postgres@127.0.0.1:54329"
LOCAL_DB_URL="$LOCAL_SERVER/jlowe_dev"

case "$PROD_DATABASE_URL" in
  *127.0.0.1*|*localhost*) echo "PROD_DATABASE_URL points at this machine; refusing." >&2; exit 1 ;;
esac

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
chmod 700 "$tmp"

echo "Dumping production (read-only)…"
pg_dump --format=custom --no-owner --no-privileges --file="$tmp/prod.dump" "$PROD_DATABASE_URL"

# The public schema already exists locally, and prisma_postgres is Prisma
# Postgres's own extension, which plain Postgres doesn't have.
pg_restore -l "$tmp/prod.dump" |
  grep -vE 'SCHEMA - public |COMMENT - SCHEMA public |prisma_postgres' > "$tmp/restore.list"

echo "Recreating jlowe_dev…"
psql "$LOCAL_SERVER/postgres" -X -q -v ON_ERROR_STOP=1 \
  -c "drop database if exists jlowe_dev with (force)" \
  -c "create database jlowe_dev"
pg_restore --no-owner --no-privileges --single-transaction --exit-on-error \
  -L "$tmp/restore.list" -d "$LOCAL_DB_URL" "$tmp/prod.dump"

DATABASE_URL="$LOCAL_DB_URL" npx prisma migrate deploy
echo "jlowe_dev now holds a copy of production."
