"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";

export default function AdminClienteDetalhe() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  useEffect(() => { api<any>(`/admin/clientes/${id}`).then(setData).catch(() => {}); }, [id]);
  if (!data) return <main className="p-6 muted">Carregando…</main>;
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <Link href="/admin/clientes" className="muted text-sm">← Escritórios</Link>
      <header>
        <h1 className="serif text-3xl">{data.cliente.nome}</h1>
        <p className="muted text-sm">{data.cliente.email} · plano {data.cliente.plano}</p>
      </header>
      <div className="divider-gold" />

      <section className="card">
        <h2 className="serif text-xl gold mb-3">Usuários</h2>
        <ul className="text-sm space-y-1">
          {data.usuarios.map((u: any) => (
            <li key={u.id} className="flex justify-between border-b border-[var(--line)] py-1">
              <span>{u.nome} · {u.email}</span>
              <span className="muted">{u.role}{u.is_admin ? " · admin" : ""}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="serif text-xl gold mb-3">Casos</h2>
        <ul className="text-sm space-y-1">
          {data.casos.map((c: any) => (
            <li key={c.id} className="flex justify-between border-b border-[var(--line)] py-1">
              <Link href={`/admin/clientes/${id}/casos/${c.id}`}>{c.nome}</Link>
              <span className="muted">{c.status}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
