#!/bin/bash
BN=$(echo 123 | sudo -S docker ps --format '{{.Names}}' | grep '^backend-eg0tvjxgs')
echo "BN=$BN"
echo 123 | sudo -S docker logs --tail 100 "$BN" 2>&1 | tail -100
