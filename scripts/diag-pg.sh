#!/bin/bash
echo 123 | sudo -S bash -c '
PGN=$(docker ps --format "{{.Names}}" | grep "^postgres-eg0tvjxgs")
BN=$(docker ps --format "{{.Names}}" | grep "^backend-eg0tvjxgs")
echo "PG=$PGN BN=$BN"
echo "--- pg env ---"
docker exec "$PGN" env | grep -E "POSTGRES_(USER|PASSWORD|DB)"
echo "--- backend env ---"
docker exec "$BN" env | grep -E "POSTGRES_(HOST|USER|PASSWORD|DB)|DATABASE_URL"
echo "--- pg can list dbs ---"
docker exec "$PGN" psql -U "$(docker exec "$PGN" printenv POSTGRES_USER)" -d postgres -c "\\l" 2>&1 | head -10
echo "--- test backend->pg with backend env ---"
docker exec "$BN" sh -c "python -c \"import os,asyncio,asyncpg; asyncio.run(asyncpg.connect(host=os.environ[\\\"POSTGRES_HOST\\\"],user=os.environ[\\\"POSTGRES_USER\\\"],password=os.environ[\\\"POSTGRES_PASSWORD\\\"],database=os.environ[\\\"POSTGRES_DB\\\"]).then(lambda c: c.close()) if False else None\" 2>&1" 
docker exec "$BN" sh -c "echo \"User: \$POSTGRES_USER  Pwd len: \${#POSTGRES_PASSWORD}  DB: \$POSTGRES_DB  Host: \$POSTGRES_HOST\""
docker exec "$PGN" sh -c "echo \"PG User: \$POSTGRES_USER  Pwd len: \${#POSTGRES_PASSWORD}  DB: \$POSTGRES_DB\""
'
