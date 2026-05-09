#!/bin/bash
echo 123 | sudo -S bash -c '
BN=$(docker ps --format "{{.Names}}" | grep "^backend-eg0tvjxgs")
echo "--- which postgres does backend resolve to ---"
docker exec "$BN" sh -c "getent hosts postgres; getent hosts postgres-eg0tvjxgs472y1zl0bb6t56r-153406261009 2>/dev/null"
echo "--- all postgres containers ---"
docker ps -a --filter "ancestor=postgres:16-alpine" --format "{{.Names}} {{.Status}}"
docker ps --format "{{.Names}}" | xargs -I{} docker inspect {} --format "{{.Name}} ip4={{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}" 2>/dev/null | grep -E "postgres|backend"
echo "--- backend networks ---"
docker inspect "$BN" --format "{{range \$k,\$v := .NetworkSettings.Networks}}{{\$k}}={{\$v.IPAddress}}{{println}}{{end}}"
'
