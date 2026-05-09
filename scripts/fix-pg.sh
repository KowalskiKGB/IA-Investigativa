#!/bin/bash
echo 123 | sudo -S bash -c '
PGN=$(docker ps --format "{{.Names}}" | grep "^postgres-eg0tvjxgs")
BN=$(docker ps --format "{{.Names}}" | grep "^backend-eg0tvjxgs")
PWD=$(docker exec "$BN" printenv POSTGRES_PASSWORD)
echo "pwd from backend len=${#PWD}"
docker exec -e PGPASSWORD="anything" "$PGN" psql -U investiga -d investiga -c "ALTER USER investiga WITH PASSWORD '"'"'$PWD'"'"';" 2>&1
echo "--- retest ---"
docker exec "$BN" python -c "
import os, asyncio, asyncpg
async def m():
    try:
        c = await asyncpg.connect(host=os.environ[\"POSTGRES_HOST\"], user=os.environ[\"POSTGRES_USER\"], password=os.environ[\"POSTGRES_PASSWORD\"], database=os.environ[\"POSTGRES_DB\"], port=5432)
        print(\"OK conn\")
        await c.close()
    except Exception as e:
        print(\"ERR\", e)
asyncio.run(m())
"
'
