"use client";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function AdminNovoUsuario() {
  const [form, setForm] = useState<any>({
    nome: "", email: "", senha: "", role: "membro",
    is_admin: false, plano: "solo", nome_escritorio: "",
  });
  const [ok, setOk] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null); setOk(false);
    try {
      await api("/admin/usuarios", { method: "POST", body: JSON.stringify(form) });
      setOk(true);
    } catch (e: any) {
      setErro(e.message);
    }
  }

  function on(k: string, v: any) { setForm({ ...form, [k]: v }); }

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <Link href="/admin" className="muted text-sm">← Painel</Link>
      <h1 className="serif text-3xl">Criar usuário</h1>
      <p className="muted text-sm">Crie em escritório existente (deixe Nome do escritório vazio) ou crie um escritório novo.</p>
      <div className="divider-gold" />

      <form onSubmit={salvar} className="card-elev space-y-3">
        <input className="input" placeholder="Nome do escritório (deixe vazio para usar existente)"
          onChange={(e) => on("nome_escritorio", e.target.value)} />
        <input className="input" placeholder="Plano (solo/escritorio/enterprise)"
          value={form.plano} onChange={(e) => on("plano", e.target.value)} />
        <div className="divider-gold my-2" />
        <input className="input" placeholder="Nome do usuário" required
          onChange={(e) => on("nome", e.target.value)} />
        <input className="input" placeholder="E-mail" type="email" required
          onChange={(e) => on("email", e.target.value)} />
        <input className="input" placeholder="Senha" type="password" required
          onChange={(e) => on("senha", e.target.value)} />
        <input className="input" placeholder="Papel (admin/membro)"
          value={form.role} onChange={(e) => on("role", e.target.value)} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" onChange={(e) => on("is_admin", e.target.checked)} />
          Administrador da plataforma
        </label>
        <button className="btn">Criar</button>
        {ok && <p style={{ color: "var(--ok)" }}>✓ Criado.</p>}
        {erro && <p style={{ color: "var(--danger)" }}>{erro}</p>}
      </form>
    </main>
  );
}
