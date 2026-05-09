"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function AdminClientes() {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => { api<any[]>("/admin/clientes").then(setList).catch(() => {}); }, []);
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex justify-between">
        <Link href="/admin" className="muted text-sm">← Painel</Link>
        <Link href="/admin/usuarios/novo" className="btn">+ Novo escritório / usuário</Link>
      </header>
      <h1 className="serif text-3xl">Escritórios cadastrados</h1>
      <div className="divider-gold" />
      <table className="w-full text-sm">
        <thead className="text-left muted text-xs uppercase tracking-widest">
          <tr>
            <th className="py-2">Escritório</th><th>Email</th><th>Plano</th>
            <th>Usuários</th><th>Casos</th><th>Docs</th><th>Msgs</th>
          </tr>
        </thead>
        <tbody>
          {list.map((c) => (
            <tr key={c.id} className="border-t border-[var(--line)]">
              <td className="py-2"><Link href={`/admin/clientes/${c.id}`}>{c.nome}</Link></td>
              <td className="muted">{c.email}</td>
              <td><span className="tag">{c.plano}</span></td>
              <td>{c.usuarios}</td><td>{c.casos}</td><td>{c.documentos}</td><td>{c.mensagens}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {list.length === 0 && <p className="muted">Nenhum escritório ainda.</p>}
    </main>
  );
}
