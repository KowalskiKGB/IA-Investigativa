"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Shell, IconUserPlus, IconBuilding } from "@/components/Shell";

export default function AdminClientes() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api<any[]>("/admin/clientes").then(setList).catch(() => {}).finally(() => setLoading(false)); }, []);

  return (
    <Shell
      crumbs={[{ label: "Painel", href: "/admin" }, { label: "Escritórios" }]}
      actions={<Link href="/admin/usuarios/novo" className="btn"><IconUserPlus /> Novo escritório</Link>}
    >
      <div className="space-y-6 anim-in">
        <div>
          <span className="kicker">Multi-tenant</span>
          <h1 className="h-display text-4xl mt-2">Escritórios cadastrados</h1>
          <p className="muted text-sm mt-2">Cada linha é um cliente isolado. Clique para detalhes, usuários e casos.</p>
        </div>

        <div className="card-elev p-0 overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-2">
              {[0,1,2].map(i => <div key={i} className="skel" style={{ height: 36 }} />)}
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-12">
              <div className="feat-icon mx-auto"><IconBuilding /></div>
              <h3 className="serif text-2xl gold mt-3">Nenhum escritório ainda</h3>
              <p className="muted text-sm mt-2">Cadastre o primeiro pelo botão "Novo escritório".</p>
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Escritório</th><th>E-mail</th><th>Plano</th>
                  <th>Usuários</th><th>Casos</th><th>Docs</th><th>Mensagens</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id}>
                    <td><Link href={`/admin/clientes/${c.id}`} style={{ color: "var(--ink)", fontWeight: 600 }}>{c.nome}</Link></td>
                    <td className="muted">{c.email}</td>
                    <td><span className="tag">{c.plano}</span></td>
                    <td className="serif-num">{c.usuarios}</td>
                    <td className="serif-num">{c.casos}</td>
                    <td className="serif-num">{c.documentos}</td>
                    <td className="serif-num">{c.mensagens}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Shell>
  );
}
