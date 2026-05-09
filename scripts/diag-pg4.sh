#!/bin/bash
echo 123 | sudo -S bash -c '
BN=$(docker ps --format "{{.Names}}" | grep "^backend-eg0tvjxgs")
PGN=$(docker ps --format "{{.Names}}" | grep "^postgres-eg0tvjxgs")
echo "--- ALTER again with literal ---"
docker exec "$PGN" psql -U investiga -d investiga -c "ALTER USER investiga WITH PASSWORD '"'"'ec01f0c60018c98fd83d8ded81e3d608afb93eced2d040c3'"'"';"
echo "--- direct from backend ---"
docker exec "$BN" python -c "
import asyncio, asyncpg
async def m():
    try:
        c = await asyncpg.connect(host=\"postgres\", port=5432, user=\"investiga\", password=\"ec01f0c60018c98fd83d8ded81e3d608afb93eced2d040c3\", database=\"investiga\")
        print(\"OK conn\")
        await c.close()
    except Exception as e:
        print(\"ERR\", repr(e))
asyncio.run(m())
"
echo "--- pg log tail ---"
docker logs --tail 30 "$PGN" 2>&1 | tail -30
'
