#!/bin/bash
echo 123 | sudo -S bash -c '
  PGN=$(docker ps -a --format "{{.Names}}" | grep "^postgres-eg0tvjxgs" || true)
  echo "PG=$PGN"
  if [ -n "$PGN" ]; then docker rm -f "$PGN"; fi
  VOLS=$(docker volume ls --format "{{.Name}}" | grep "eg0tvjxgs.*postgres_data" || true)
  echo "VOLS=$VOLS"
  for v in $VOLS; do docker volume rm "$v"; done
  echo "remaining:"
  docker volume ls --format "{{.Name}}" | grep eg0tvjxgs
'
