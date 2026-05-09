"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, setToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
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
        body: JSON.stringify({ email, senha }),
      });
      setToken(r.access_token);
      router.push("/casos");
    } catch (e: any) {
      setErro(e.message || "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={submit} className="card w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Entrar</h1>
        <input className="input" placeholder="Email" type="email"
          value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input" placeholder="Senha" type="password"
          value={senha} onChange={(e) => setSenha(e.target.value)} required />
        {erro && <p className="text-red-400 text-sm">{erro}</p>}
        <button className="btn w-full" disabled={loading}>
          {loading ? "..." : "Entrar"}
        </button>
        <p className="text-sm text-muted text-center">
          Sem conta? <Link href="/registro" className="text-accent">Criar agora</Link>
        </p>
      </form>
    </main>
  );
}
