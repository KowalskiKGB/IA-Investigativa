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
    <main className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={submit} className="card-elev w-full max-w-md space-y-4">
        <Link href="/" className="brand">
          <span className="brand-mark" />
          <span>Investiga</span>
        </Link>
        <div className="divider-gold" />
        <h1 className="serif text-3xl">Criar escritório</h1>
        <input className="input" placeholder="Nome do escritório"
          value={form.nome_escritorio}
          onChange={(e) => setForm({ ...form, nome_escritorio: e.target.value })} required />
        <input className="input" placeholder="Seu nome"
          value={form.nome_usuario}
          onChange={(e) => setForm({ ...form, nome_usuario: e.target.value })} required />
        <input className="input" placeholder="E-mail" type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="input" placeholder="Senha (mín. 8 caracteres)" type="password" minLength={8}
          value={form.senha}
          onChange={(e) => setForm({ ...form, senha: e.target.value })} required />
        {erro && <p className="text-sm" style={{ color: "var(--danger)" }}>{erro}</p>}
        <button className="btn w-full" disabled={loading}>
          {loading ? "Criando…" : "Criar conta"}
        </button>
        <p className="text-sm muted text-center">
          Já tem conta? <Link href="/login">Entrar</Link>
        </p>
      </form>
    </main>
  );
}
