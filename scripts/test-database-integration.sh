#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONTAINER_NAME="claudygod-postgres-integration"
POSTGRES_PASSWORD="claudygod-integration-password"

cleanup() {
  docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

if docker ps -a --format '{{.Names}}' | grep -Fxq "$CONTAINER_NAME"; then
  echo "Refusing to replace existing container: $CONTAINER_NAME" >&2
  exit 1
fi

docker run --detach --rm \
  --name "$CONTAINER_NAME" \
  --env "POSTGRES_PASSWORD=$POSTGRES_PASSWORD" \
  --publish 127.0.0.1::5432 \
  postgres:16-alpine >/dev/null

for _attempt in $(seq 1 30); do
  if docker exec "$CONTAINER_NAME" pg_isready -U postgres >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
docker exec "$CONTAINER_NAME" pg_isready -U postgres >/dev/null

HOST_PORT="$(docker port "$CONTAINER_NAME" 5432/tcp | awk -F: '{print $NF}')"
DATABASE_URL="postgresql://postgres:${POSTGRES_PASSWORD}@127.0.0.1:${HOST_PORT}/postgres"

npm --prefix "$ROOT_DIR/services/api" run build >/dev/null

run_migrations() {
  NODE_ENV=test \
  DATABASE_URL="$DATABASE_URL" \
  DATABASE_SSL=false \
  REDIS_URL=redis://127.0.0.1:6379 \
  JWT_ACCESS_SECRET=integration-access-secret-at-least-32-characters \
  JWT_REFRESH_SECRET=integration-refresh-secret-at-least-32-characters \
  node "$ROOT_DIR/services/api/dist/db/migrate.js"
}

# Running twice proves both a clean install and migration idempotency/checksum safety.
run_migrations
run_migrations

docker exec -i "$CONTAINER_NAME" psql -v ON_ERROR_STOP=1 -U postgres <<'SQL'
INSERT INTO app_users (id, email, display_name, role)
VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'integration@example.com', 'Integration Author', 'ADMIN');
INSERT INTO app_users (id, email, display_name, role)
VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'other@example.com', 'Other User', 'CLIENT');

INSERT INTO content_items (
  author_id, title, description, content_type, visibility, channel_name, tags
) VALUES (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Amazing Grace', 'A live worship recording', 'audio', 'published',
  'Claudy Worship Collective', ARRAY['grace', 'worship']
);

INSERT INTO content_items (
  author_id, title, description, content_type, visibility, channel_name, tags
) VALUES (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Worship Without Walls',
  'A second worship recording for cursor verification', 'video', 'published',
  'Claudy Worship Collective', ARRAY['worship', 'video']
);

INSERT INTO live_sessions (title, description, status, channel_id, tags, created_by)
VALUES (
  'Evening Prayer Live', 'Join the ministry prayer stream', 'live',
  'Claudy Live', ARRAY['prayer', 'live'], 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
);

INSERT INTO user_play_events (
  user_id, content_id, content_type, content_title, source_screen, client_event_id
) VALUES (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'guest-item', 'audio',
  'Guest item', 'guest_migration', 'guest:test-device:guest-item'
) ON CONFLICT (user_id, client_event_id) WHERE client_event_id IS NOT NULL DO NOTHING;
INSERT INTO user_play_events (
  user_id, content_id, content_type, content_title, source_screen, client_event_id
) VALUES (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'guest-item', 'audio',
  'Guest item', 'guest_migration', 'guest:test-device:guest-item'
) ON CONFLICT (user_id, client_event_id) WHERE client_event_id IS NOT NULL DO NOTHING;

DO $$
DECLARE title_matches integer;
DECLARE channel_matches integer;
DECLARE live_matches integer;
DECLARE synced_play_events integer;
BEGIN
  SELECT COUNT(*) INTO title_matches
  FROM content_items
  WHERE search_vector @@ websearch_to_tsquery('english', '"amazing grace"');

  SELECT COUNT(*) INTO channel_matches
  FROM content_items
  WHERE search_vector @@ websearch_to_tsquery('english', 'claudy collective');

  SELECT COUNT(*) INTO live_matches
  FROM live_sessions
  WHERE search_vector @@ websearch_to_tsquery('english', 'evening prayer');

  SELECT COUNT(*) INTO synced_play_events
  FROM user_play_events
  WHERE client_event_id = 'guest:test-device:guest-item';

  IF title_matches <> 1 OR channel_matches < 1 OR live_matches <> 1 OR synced_play_events <> 1 THEN
    RAISE EXCEPTION 'Integration verification failed: title %, channel %, live %, synced plays %', title_matches, channel_matches, live_matches, synced_play_events;
  END IF;
END $$;

SQL

QUERY_PLAN="$(docker exec "$CONTAINER_NAME" psql -At -U postgres -c \
  "SET enable_seqscan = off; EXPLAIN (COSTS OFF) SELECT id FROM content_items WHERE search_vector @@ websearch_to_tsquery('english', 'grace')")"
if ! grep -Fq 'idx_content_items_search_vector' <<<"$QUERY_PLAN"; then
  echo "Search query did not use idx_content_items_search_vector:" >&2
  echo "$QUERY_PLAN" >&2
  exit 1
fi

LIVE_QUERY_PLAN="$(docker exec "$CONTAINER_NAME" psql -At -U postgres -c \
  "SET enable_seqscan = off; EXPLAIN (COSTS OFF) SELECT id FROM live_sessions WHERE search_vector @@ websearch_to_tsquery('english', 'prayer')")"
if ! grep -Fq 'idx_live_sessions_search_vector' <<<"$LIVE_QUERY_PLAN"; then
  echo "Search query did not use idx_live_sessions_search_vector:" >&2
  echo "$LIVE_QUERY_PLAN" >&2
  exit 1
fi

NODE_ENV=test \
DATABASE_URL="$DATABASE_URL" \
DATABASE_SSL=false \
REDIS_URL=redis://127.0.0.1:6379 \
JWT_ACCESS_SECRET=integration-access-secret-at-least-32-characters \
JWT_REFRESH_SECRET=integration-refresh-secret-at-least-32-characters \
node "$ROOT_DIR/services/api/test/search-database.integration.cjs"

echo "Database integration passed: clean migration, idempotent replay, content/live search triggers, and GIN index usage."
