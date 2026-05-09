#!/bin/bash
echo 123 | sudo -S bash -c '
BN=$(docker ps --format "{{.Names}}" | grep "^backend-eg0tvjxgs")
PGN=$(docker ps --format "{{.Names}}" | grep "^postgres-eg0tvjxgs")
echo "--- backend pwd bytes ---"
docker exec "$BN" sh -c "printenv POSTGRES_PASSWORD | xxd | head -3"
echo "--- pg pwd bytes ---"
docker exec "$PGN" sh -c "printenv POSTGRES_PASSWORD | xxd | head -3"
echo "--- what backend Settings sees ---"
docker exec "$BN" python -c "
from app.config import get_settings
s = get_settings()
print(\"user=\", repr(s.postgres_user))
print(\"pwd=\", repr(s.postgres_password))
print(\"host=\", repr(s.postgres_host))
print(\"port=\", s.postgres_port)
print(\"db=\", repr(s.postgres_db))
print(\"url=\", s.database_url)
"
'
