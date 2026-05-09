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
      // verifica se admin para redirecionar ao painel
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
    <main className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={submit} className="card-elev w-full max-w-md space-y-5">
        <Link href="/" className="brand">
          <span className="brand-mark" />
          <span>Investiga</span>
        </Link>
        <div className="divider-gold" />
        <div>
          <h1 className="serif text-3xl">Acesso à plataforma</h1>
          <p className="muted text-sm mt-1">Entre com seu e-mail ou nome de usuário.</p>
        </div>
        <input className="input" placeholder="E-mail ou usuário"
          value={identificador} onChange={(e) => setIdentificador(e.target.value)} required autoFocus />
        <input className="input" placeholder="Senha" type="password"
          value={senha} onChange={(e) => setSenha(e.target.value)} required />
        {erro && <p className="text-sm" style={{ color: "var(--danger)" }}>{erro}</p>}
        <button className="btn w-full" disabled={loading}>
          {loading ? "Verificando…" : "Entrar"}
        </button>
        <p className="text-sm muted text-center">
          Sem conta? <Link href="/registro">Criar escritório</Link>
        </p>
      </form>
    </main>
  );
}
