#!/bin/bash
echo 123 | sudo -S docker ps --format '{{.Names}}' | grep eg0tvjxgs
echo '---'
for c in $(echo 123 | sudo -S docker ps --format '{{.Names}}' | grep -E 'backend-eg0|frontend-eg0'); do
  echo "== $c =="
  echo 123 | sudo -S docker inspect $c --format '{{json .Config.Labels}}' | python3 -c 'import sys,json; d=json.loads(sys.stdin.read()); [print(k,"=",v) for k,v in d.items() if "traefik" in k]'
  echo 123 | sudo -S docker inspect $c --format 'NETS={{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
done
echo '---host curl---'
curl -s --max-time 5 -H 'Host: adv-inv.rocketxsistemas.com.br' http://localhost/ -o /dev/null -w 'FRONT=%{http_code}\n'
curl -s --max-time 5 -H 'Host: api.adv-inv.rocketxsistemas.com.br' http://localhost/health -w '\nBACK=%{http_code}\n'
