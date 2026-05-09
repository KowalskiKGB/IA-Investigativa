"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, setToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [identificador, setIdentificador] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const r = await api<{ access_token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ identificador, senha }),
      });
      setToken(r.access_token);
      try {
        const me = await api<{ is_admin: boolean }>("/auth/me");
        router.push(me.is_admin ? "/admin" : "/casos");
      } catch {
        router.push("/casos");
      }
    } catch (e: any) {
      setErro(e.message || "Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2 relative overflow-hidden">
      {/* painel esquerdo — branding */}
      <aside className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden" style={{ background: "linear-gradient(180deg, rgba(15,31,58,0.9) 0%, rgba(6,12,26,0.95) 100%)", borderRight: "1px solid var(--line)" }}>
        <div className="hero-grid" />
        <div className="hero-mesh" />

        <Link href="/" className="brand relative z-10">
          <span className="brand-mark glow-pulse" />
          <span>Investiga</span>
        </Link>

        <div className="relative z-10 anim-in-1">
          <span className="kicker">Tecnologia investigativa</span>
          <h2 className="h-display text-5xl mt-4 leading-tight">
            Cada documento <br />
            <span className="gradient-text">conta uma história.</span>
          </h2>
          <p className="muted mt-5 leading-relaxed max-w-md">
            Diários oficiais, processos, contratos. A Investiga converte tudo
            em malha auditável de evidências com fontes citadas e grafo
            interativo.
          </p>

          <ul className="mt-8 space-y-3 text-sm">
            <Bullet>OCR com correção supervisionada</Bullet>
            <Bullet>Chat que cita documento + página</Bullet>
            <Bullet>Grafo de pessoas, empresas e órgãos</Bullet>
            <Bullet>Isolamento por escritório · LGPD</Bullet>
          </ul>
        </div>

        <div className="relative z-10 text-xs muted">
          v0.1 · Markdown soberano · Coolify-hosted
        </div>
      </aside>

      {/* painel direito — formulário */}
      <section className="flex items-center justify-center px-6 py-12 relative">
        <div className="hero-mesh lg:hidden" />
        <form onSubmit={submit} className="card-elev w-full max-w-md space-y-5 anim-in relative z-10">
          <div className="lg:hidden mb-2">
            <Link href="/" className="brand">
              <span className="brand-mark" />
              <span>Investiga</span>
            </Link>
          </div>
          <div>
            <span className="kicker">Acesso</span>
            <h1 className="h-display text-4xl mt-3">Bem-vindo de volta.</h1>
            <p className="muted text-sm mt-2">Entre com seu e-mail ou nome de usuário.</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="field-label">Usuário ou e-mail</label>
              <input className="input" placeholder="advogado@escritorio.com.br"
                value={identificador} onChange={(e) => setIdentificador(e.target.value)} required autoFocus autoComplete="username" />
            </div>
            <div>
              <label className="field-label">Senha</label>
              <input className="input" type="password" placeholder="••••••••"
                value={senha} onChange={(e) => setSenha(e.target.value)} required autoComplete="current-password" />
            </div>
          </div>

          {erro && (
            <div className="alert alert-error">
              <strong>✕</strong>
              <span>{erro}</span>
            </div>
          )}

          <button className="btn w-full" disabled={loading}>
            {loading ? <><span className="spinner" /> Verificando…</> : "Entrar →"}
          </button>

          <div className="divider-gold" />

          <p className="text-sm muted text-center">
            Sem conta? <Link href="/registro">Criar escritório</Link>
          </p>
        </form>
      </section>
    </main>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span style={{ color: "var(--gold-bright)", marginTop: 2 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m20 6-11 11-5-5" /></svg>
      </span>
      <span>{children}</span>
    </li>
  );
}
