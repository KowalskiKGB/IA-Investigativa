"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, setToken } from "@/lib/api";

export default function RegistroPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome_escritorio: "", nome_usuario: "", email: "", senha: "",
  });
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const r = await api<{ access_token: string }>("/auth/registro", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setToken(r.access_token);
      router.push("/casos");
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10 relative overflow-hidden">
      <div className="hero-mesh" />
      <form onSubmit={submit} className="card-elev w-full max-w-lg space-y-5 relative z-10 anim-in">
        <Link href="/" className="brand">
          <span className="brand-mark" />
          <span>Investiga</span>
        </Link>

        <div>
          <span className="kicker">Comece agora</span>
          <h1 className="h-display text-4xl mt-3">Crie seu escritório</h1>
          <p className="muted text-sm mt-2">Você terá acesso imediato ao painel e poderá convidar sua equipe.</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="field-label">Nome do escritório</label>
            <input className="input" placeholder="Silva & Associados Advogados"
              value={form.nome_escritorio}
              onChange={(e) => setForm({ ...form, nome_escritorio: e.target.value })} required />
          </div>
          <div>
            <label className="field-label">Seu nome</label>
            <input className="input" placeholder="Dr. Rafael Silva"
              value={form.nome_usuario}
              onChange={(e) => setForm({ ...form, nome_usuario: e.target.value })} required />
          </div>
          <div>
            <label className="field-label">E-mail</label>
            <input className="input" placeholder="rafael@silva.adv.br" type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="field-label">Senha (mín. 8 caracteres)</label>
            <input className="input" placeholder="••••••••" type="password" minLength={8}
              value={form.senha}
              onChange={(e) => setForm({ ...form, senha: e.target.value })} required />
          </div>
        </div>

        {erro && (
          <div className="alert alert-error">
            <strong>✕</strong>
            <span>{erro}</span>
          </div>
        )}

        <button className="btn w-full" disabled={loading}>
          {loading ? <><span className="spinner" /> Criando…</> : "Criar escritório →"}
        </button>

        <div className="divider-gold" />
        <p className="text-sm muted text-center">
          Já tem conta? <Link href="/login">Entrar</Link>
        </p>
      </form>
    </main>
  );
}
