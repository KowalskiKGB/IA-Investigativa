"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Shell, IconBuilding, IconUsers, IconFolder, IconDoc, IconChat, IconUserPlus, IconCog, IconShield } from "@/components/Shell";

export default function AdminHome() {
  const [stats, setStats] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api<any>("/admin/stats").then(setStats).catch((e) => setErro(e.message));
  }, []);

  return (
    <Shell crumbs={[{ label: "Painel" }]}>
      <div className="space-y-7">
        <div className="anim-in">
          <span className="kicker">Visão geral</span>
          <h1 className="h-display text-4xl mt-2">Painel da plataforma</h1>
          <p className="muted text-sm mt-2 max-w-2xl">
            Estatísticas em tempo real da operação. Você é administrador — tem acesso a todos os escritórios, pode criar contas, configurar IA e auditar uso.
          </p>
        </div>

        {erro && (
          <div className="alert alert-error">
            <IconShield />
            <div>
              <strong>Acesso negado:</strong> {erro}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 anim-in-1">
          <Stat icon={<IconBuilding />} label="Escritórios" value={stats?.clientes} loading={!stats} />
          <Stat icon={<IconUsers />} label="Usuários" value={stats?.usuarios} loading={!stats} />
          <Stat icon={<IconFolder />} label="Casos" value={stats?.casos} loading={!stats} />
          <Stat icon={<IconDoc />} label="Documentos" value={stats?.documentos} loading={!stats} />
          <Stat icon={<IconChat />} label="Mensagens" value={stats?.mensagens} loading={!stats} />
        </div>

        <div className="grid md:grid-cols-3 gap-4 anim-in-2">
          <QuickAction
            href="/admin/usuarios/novo"
            icon={<IconUserPlus />}
            title="Criar usuário"
            desc="Cadastre um novo advogado em escritório existente ou crie um escritório novo."
          />
          <QuickAction
            href="/admin/clientes"
            icon={<IconBuilding />}
            title="Gerenciar escritórios"
            desc="Veja a lista completa de escritórios, planos e métricas de uso."
          />
          <QuickAction
            href="/admin/config"
            icon={<IconCog />}
            title="Configurar IA"
            desc="Provedor LLM, modelos, chaves de API e prompt-base do sistema."
          />
        </div>
      </div>
    </Shell>
  );
}

function Stat({ icon, label, value, loading }: { icon: React.ReactNode; label: string; value?: number; loading?: boolean }) {
  return (
    <div className="stat">
      <div className="stat-icon">{icon}</div>
      {loading
        ? <div className="skel" style={{ width: 70, height: 38 }} />
        : <div className="stat-value">{value ?? 0}</div>}
      <span className="stat-label">{label}</span>
    </div>
  );
}

function QuickAction({ href, icon, title, desc }: { href: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link href={href} className="card card-hover block">
      <div className="feat-icon">{icon}</div>
      <div className="serif text-xl gold">{title}</div>
      <p className="muted text-sm mt-2 leading-relaxed">{desc}</p>
      <span className="muted text-xs mt-3 inline-block" style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>Abrir →</span>
    </Link>
  );
}
