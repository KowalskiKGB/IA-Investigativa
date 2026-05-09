"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, clearToken, hasToken } from "@/lib/api";

export default function AdminHome() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!hasToken()) { router.push("/login"); return; }
    (async () => {
      try {
        const s = await api<any>("/admin/stats");
        setStats(s);
      } catch (e: any) {
        setErro(e.message);
      }
    })();
  }, [router]);

  function sair() { clearToken(); router.push("/login"); }

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex justify-between items-center">
        <Link href="/admin" className="brand">
          <span className="brand-mark" />
          <span>Investiga · Admin</span>
        </Link>
        <div className="flex gap-2">
          <Link href="/admin/clientes" className="btn-ghost">Clientes</Link>
          <Link href="/admin/usuarios/novo" className="btn-ghost">Novo usuário</Link>
          <Link href="/admin/config" className="btn-ghost">Configurar IA</Link>
          <button onClick={sair} className="btn-ghost">Sair</button>
        </div>
      </header>
      <div className="divider-gold" />

      {erro && (
        <div className="card" style={{ borderColor: "var(--danger)" }}>
          <strong style={{ color: "var(--danger)" }}>Acesso negado:</strong> {erro}
        </div>
      )}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Stat label="Escritórios" value={stats.clientes} />
          <Stat label="Usuários" value={stats.usuarios} />
          <Stat label="Casos" value={stats.casos} />
          <Stat label="Documentos" value={stats.documentos} />
          <Stat label="Mensagens" value={stats.mensagens} />
        </div>
      )}

      <section className="card-elev">
        <h2 className="serif text-2xl gold">Painel da plataforma</h2>
        <p className="muted text-sm mt-2">
          Você é o administrador da plataforma. Tem acesso aos dados de todos os escritórios,
          pode criar contas, alterar provedor de IA, ler markdowns e investigar uso.
        </p>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card text-center">
      <div className="serif text-4xl gold">{value ?? "—"}</div>
      <div className="muted text-xs uppercase tracking-widest mt-1">{label}</div>
    </div>
  );
}
