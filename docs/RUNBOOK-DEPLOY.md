# 🛠️ Runbook de Deploy — Servidor próprio + Coolify + Cloudflare

> Guia operacional. Tudo aqui é executado no servidor `100.95.227.38` (Tailscale) ou em Cloudflare via `cloudflared`.
> ⚠️ Senha trivial detectada — **trocar para chave SSH antes do primeiro cliente real.**

---

## 1. Pré-requisitos no servidor

- Coolify já instalado (informado pelo usuário).
- Docker + Docker Compose (vêm com o Coolify).
- Acesso via Tailscale: `ssh rafael@100.95.227.38`.
- API do Coolify: token armazenado em `.env` (raiz do repo) como `COOLIFY_API_TOKEN`.

---

## 2. Topologia

```
Internet ──► Cloudflare (DNS + WAF + Tunnel)
                       │
                       ▼
          cloudflared (no servidor)
                       │
                       ▼
                  Coolify proxy
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   frontend       backend        postgres
   (Next.js)     (FastAPI)         + chromadb
                                   + minio
```

---

## 3. Variáveis de ambiente (Coolify → "Environment")

Copiar de `.env.example` na raiz e preencher:

```
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
POSTGRES_USER=invest
POSTGRES_PASSWORD=<gerar 32 chars>
POSTGRES_DB=investigacao
JWT_SECRET=<gerar 64 chars>
MINIO_ROOT_USER=invest
MINIO_ROOT_PASSWORD=<gerar 32 chars>
NEXT_PUBLIC_API_URL=https://api.<seu-dominio>
```

> Para gerar segredo forte: `openssl rand -hex 32`.

---

## 4. Fluxo de deploy via Coolify (UI)

1. **Criar projeto** "Investigacao SaaS".
2. **Adicionar 4 resources**:
   - `postgres` (template oficial)
   - `minio` (template oficial)
   - `chromadb` (Docker image: `chromadb/chroma:latest`, porta 8000)
   - aplicação `backend` (Docker, build do `./backend/Dockerfile`)
   - aplicação `frontend` (Docker, build do `./frontend/Dockerfile`)
3. **Conectar GitHub** ao projeto e habilitar deploy automático no push da branch `main`.
4. **Domínios**:
   - `api.<dominio>` → backend
   - `app.<dominio>` → frontend
5. **Health checks**: backend `/health`, frontend `/`.

---

## 5. Cloudflare Tunnel (alternativa ao port-forward)

No PC do usuário (já autenticado em `cloudflared`):

```powershell
# Criar túnel
cloudflared tunnel create investigacao-saas

# Mapear hosts (substituir DOMINIO)
cloudflared tunnel route dns investigacao-saas app.DOMINIO
cloudflared tunnel route dns investigacao-saas api.DOMINIO

# Config (~/.cloudflared/config.yml no servidor)
# tunnel: <UUID>
# credentials-file: /root/.cloudflared/<UUID>.json
# ingress:
#   - hostname: app.DOMINIO
#     service: http://localhost:3000
#   - hostname: api.DOMINIO
#     service: http://localhost:8000
#   - service: http_status:404

# Rodar como serviço no servidor
sudo cloudflared service install
```

---

## 6. Deploy via API do Coolify (automação)

Exemplo (PowerShell, usando token em `.env`):

```powershell
$token = (Get-Content .env | Select-String "COOLIFY_API_TOKEN").ToString().Split("=")[1]
$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
Invoke-RestMethod -Uri "http://100.95.227.38:8000/api/v1/deploy?uuid=<APP_UUID>" `
                  -Headers $headers -Method POST
```

> O `<APP_UUID>` é exibido na URL da aplicação no Coolify.

---

## 7. Operações comuns

| Tarefa | Comando |
|---|---|
| Backup Postgres | `docker exec postgres pg_dump -U invest investigacao > bk.sql` |
| Backup Chroma | tar do volume `chromadb_data` |
| Backup MinIO | `mc mirror minio/casos /backup/casos` |
| Logs backend | `docker logs -f <container>` ou aba "Logs" no Coolify |
| Reload secrets | atualizar no Coolify → "Redeploy" |

---

## 8. Checklist antes do primeiro cliente real

- [ ] Substituir senha SSH por chave Ed25519
- [ ] Desabilitar login root via senha (`/etc/ssh/sshd_config`)
- [ ] Firewall: bloquear tudo exceto Tailscale (admin) e 443 via Cloudflare
- [ ] Backup automatizado diário (cron + offsite — ex.: B2/R2)
- [ ] Rotação de chaves API (Anthropic + OpenAI) registrada
- [ ] Termos de uso + DPA assinado por email
- [ ] Página de status público (Uptime Kuma no Coolify)
