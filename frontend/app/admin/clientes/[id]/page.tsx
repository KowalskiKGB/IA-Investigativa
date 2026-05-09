"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Shell, IconBuilding, IconUsers, IconFolder } from "@/components/Shell";

export default function AdminClienteDetalhe() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  useEffect(() => { api<any>(`/admin/clientes/${id}`).then(setData).catch(() => {}); }, [id]);

  if (!data) return (
    <Shell crumbs={[{ label: "Painel", href: "/admin" }, { label: "Escritórios", href: "/admin/clientes" }, { label: "Detalhe" }]}>
      <div className="skel" style={{ height: 280 }} />
    </Shell>
  );

  return (
    <Shell crumbs={[
      { label: "Painel", href: "/admin" },
      { label: "Escritórios", href: "/admin/clientes" },
      { label: data.cliente.nome },
    ]}>
      <div className="space-y-6 anim-in">
        <header className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <span className="kicker">Escritório</span>
            <h1 className="h-display text-4xl mt-2">{data.cliente.nome}</h1>
            <p className="muted text-sm mt-1">{data.cliente.email} · plano <strong className="gold">{data.cliente.plano}</strong></p>
          </div>
          <div className="flex gap-3">
            <div className="stat" style={{ minWidth: 110 }}>
              <div className="stat-icon"><IconUsers /></div>
              <div className="stat-value">{data.usuarios.length}</div>
              <span className="stat-label">Usuários</span>
            </div>
            <div className="stat" style={{ minWidth: 110 }}>
              <div className="stat-icon"><IconFolder /></div>
              <div className="stat-value">{data.casos.length}</div>
              <span className="stat-label">Casos</span>
            </div>
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-5">
          <section className="card">
            <h2 className="serif text-xl gold mb-3 flex items-center gap-2"><IconUsers /> Usuários</h2>
            <ul className="text-sm divide-y" style={{ borderColor: "var(--line-soft)" }}>
              {data.usuarios.map((u: any) => (
                <li key={u.id} className="flex justify-between py-2">
                  <span><strong style={{ color: "var(--ink)" }}>{u.nome}</strong> <span className="muted">· {u.email}</span></span>
                  <span className="tag tag-muted">{u.role}{u.is_admin ? " · admin" : ""}</span>
                </li>
              ))}
              {data.usuarios.length === 0 && <li className="muted py-4 text-center">Sem usuários.</li>}
            </ul>
          </section>

          <section className="card">
            <h2 className="serif text-xl gold mb-3 flex items-center gap-2"><IconFolder /> Casos</h2>
            <ul className="text-sm divide-y" style={{ borderColor: "var(--line-soft)" }}>
              {data.casos.map((c: any) => (
                <li key={c.id} className="flex justify-between py-2">
                  <Link href={`/admin/clientes/${id}/casos/${c.id}`} style={{ color: "var(--ink)" }}>{c.nome}</Link>
                  <span className={`status-pill ${c.status === "ativo" ? "tag-ok" : "tag-muted"}`}>{c.status}</span>
                </li>
              ))}
              {data.casos.length === 0 && <li className="muted py-4 text-center">Sem casos.</li>}
            </ul>
          </section>
        </div>
      </div>
    </Shell>
  );
}
