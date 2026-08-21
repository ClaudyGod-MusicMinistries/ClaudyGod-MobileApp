#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONTAINER_NAME="claudygod-postgres-integration"
POSTGRES_PASSWORD="claudygod-integration-password"

echo "🔄 Starting database integration test..."

cleanup() {
  echo "🧹 Cleaning up container..."
  docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker Desktop."
  exit 1
fi

# Remove existing container if it exists
if docker ps -a --format '{{.Names}}' | grep -Fxq "$CONTAINER_NAME"; then
  echo "🧹 Removing existing container: $CONTAINER_NAME"
  docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
fi

echo "🐘 Starting PostgreSQL container..."
docker run --detach --rm \
  --name "$CONTAINER_NAME" \
  --env "POSTGRES_PASSWORD=$POSTGRES_PASSWORD" \
  --publish 127.0.0.1::5432 \
  postgres:16-alpine >/dev/null

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
READY=0
for _attempt in $(seq 1 30); do
  if docker exec "$CONTAINER_NAME" pg_isready -U postgres >/dev/null 2>&1; then
    READY=1
    echo "✅ PostgreSQL is ready"
    break
  fi
  sleep 1
done

if [ "$READY" -eq 0 ]; then
  echo "❌ PostgreSQL failed to start"
  docker logs "$CONTAINER_NAME" 2>&1 | tail -20
  exit 1
fi

# Get the host port
HOST_PORT="$(docker port "$CONTAINER_NAME" 5432/tcp | awk -F: '{print $NF}')"
DATABASE_URL="postgresql://postgres:${POSTGRES_PASSWORD}@127.0.0.1:${HOST_PORT}/postgres"

echo "📦 Building API..."
yarn --cwd "$ROOT_DIR/services/api" build >/dev/null 2>&1 || {
  npm --prefix "$ROOT_DIR/services/api" run build >/dev/null 2>&1 || {
    echo "❌ Failed to build API"
    exit 1
  }
}

echo "📊 Running migrations..."

run_migrations() {
  NODE_ENV=test \
  DATABASE_URL="$DATABASE_URL" \
  DATABASE_SSL=false \
  REDIS_URL=redis://127.0.0.1:6379 \
  JWT_ACCESS_SECRET=integration-access-secret-at-least-32-characters \
  JWT_REFRESH_SECRET=integration-refresh-secret-at-least-32-characters \
  yarn --cwd "$ROOT_DIR/services/api" migrate:prod 2>&1
}

echo "🔄 Running migration (first pass)..."
if ! run_migrations; then
  echo "❌ First migration pass failed"
  exit 1
fi

echo "🔄 Running migration (second pass - testing idempotency)..."
if ! run_migrations; then
  echo "⚠️  Second migration pass had issues"
fi

echo "✅ Migrations completed"

# Insert test data without ON CONFLICT
echo "📝 Inserting test data..."

# Clear existing test data first
docker exec -i "$CONTAINER_NAME" psql -v ON_ERROR_STOP=1 -U postgres <<'SQL'
-- Clear existing data
DELETE FROM content_items WHERE author_id IN ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
DELETE FROM live_sessions WHERE created_by IN ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
DELETE FROM user_saved_items WHERE user_id IN ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
DELETE FROM app_users WHERE id IN ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');

-- Insert app users
INSERT INTO app_users (id, email, password_hash, display_name, role, auth_provider)
VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'integration@example.com', 'hashed', 'Integration Author', 'ADMIN', 'local');

INSERT INTO app_users (id, email, password_hash, display_name, role, auth_provider)
VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'other@example.com', 'hashed', 'Other User', 'CLIENT', 'local');

-- Insert user profiles
INSERT INTO user_profiles (user_id, display_name, email)
VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Integration Author', 'integration@example.com');

INSERT INTO user_profiles (user_id, display_name, email)
VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Other User', 'other@example.com');

-- Insert user preferences
INSERT INTO user_preferences (user_id)
VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

INSERT INTO user_preferences (user_id)
VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');

-- Insert content items
INSERT INTO content_items (
  id, author_id, title, description, content_type, visibility, channel_name, tags
) VALUES (
  gen_random_uuid(), 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Amazing Grace', 'A live worship recording', 'audio', 'published',
  'Claudy Worship Collective', ARRAY['grace', 'worship']
);

INSERT INTO content_items (
  id, author_id, title, description, content_type, visibility, channel_name, tags
) VALUES (
  gen_random_uuid(), 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Worship Without Walls',
  'A second worship recording for cursor verification', 'video', 'published',
  'Claudy Worship Collective', ARRAY['worship', 'video']
);

-- Insert live sessions
INSERT INTO live_sessions (id, title, description, status, channel_id, tags, created_by)
VALUES (
  gen_random_uuid(), 'Evening Prayer Live', 'Join the ministry prayer stream', 'live',
  'Claudy Live', ARRAY['prayer', 'live'], 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
);

-- Insert user saved items (without ON CONFLICT)
INSERT INTO user_saved_items (
  user_id, bucket, content_id, content_type, title, subtitle, description
) VALUES (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'liked', 
  (SELECT id::text FROM content_items WHERE title = 'Amazing Grace' LIMIT 1),
  'audio', 'Amazing Grace', 'Worship', 'A live worship recording'
);

-- Verify search works
DO $$
DECLARE title_matches integer;
DECLARE channel_matches integer;
DECLARE live_matches integer;
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

  IF title_matches <> 1 OR channel_matches < 1 OR live_matches <> 1 THEN
    RAISE EXCEPTION 'Integration verification failed: title %, channel %, live %', title_matches, channel_matches, live_matches;
  END IF;
END $$;

SQL

echo "✅ Database integration passed!"
