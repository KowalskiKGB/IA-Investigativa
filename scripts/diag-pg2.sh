#!/bin/bash
echo 123 | sudo -S bash -c '
BN=$(docker ps --format "{{.Names}}" | grep "^backend-eg0tvjxgs")
PGN=$(docker ps --format "{{.Names}}" | grep "^postgres-eg0tvjxgs")
echo "--- connect from backend using asyncpg ---"
docker exec "$BN" python -c "
import os, asyncio, asyncpg
async def m():
    print(\"host=\", os.environ.get(\"POSTGRES_HOST\"))
    print(\"user=\", os.environ.get(\"POSTGRES_USER\"))
    print(\"pwd_first=\", os.environ.get(\"POSTGRES_PASSWORD\")[:8])
    print(\"db=\", os.environ.get(\"POSTGRES_DB\"))
    try:
        c = await asyncpg.connect(host=os.environ[\"POSTGRES_HOST\"], user=os.environ[\"POSTGRES_USER\"], password=os.environ[\"POSTGRES_PASSWORD\"], database=os.environ[\"POSTGRES_DB\"], port=5432)
        print(\"OK conn\")
        await c.close()
    except Exception as e:
        print(\"ERR\", type(e).__name__, e)
asyncio.run(m())
"
echo "--- pg_hba ---"
docker exec "$PGN" cat /var/lib/postgresql/data/pg_hba.conf | grep -v "^#" | grep -v "^$"
echo "--- pg_isready over network from backend ---"
docker exec "$BN" sh -c "apt list --installed 2>/dev/null | grep -i postgres" || true
docker exec "$BN" python -c "import socket; s=socket.socket(); s.settimeout(3); s.connect((\"postgres\",5432)); print(\"tcp ok\")"
'
