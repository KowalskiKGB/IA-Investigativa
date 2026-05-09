#!/bin/bash
echo 123 | sudo -S bash -c '
echo "--- containers named postgres on coolify network ---"
docker network inspect coolify --format "{{json .Containers}}" | python3 -m json.tool | grep -B1 -A2 postgres || true
echo "--- what is fd64:69c7:1f2b::7 ---"
docker network inspect coolify --format "{{json .Containers}}" | python3 -c "
import json,sys
d=json.load(sys.stdin)
for k,v in d.items():
    if \"fd64:69c7:1f2b::7\" in v.get(\"IPv6Address\",\"\") or \"postgres\" in v.get(\"Name\",\"\").lower():
        print(v.get(\"Name\"), v.get(\"IPv4Address\"), v.get(\"IPv6Address\"))
" 2>/dev/null
echo "--- all containers with name postgres ---"
docker ps -a --format "{{.Names}}"  | grep -i postgres
'
