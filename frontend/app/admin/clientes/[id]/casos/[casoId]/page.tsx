"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Shell, IconDoc } from "@/components/Shell";

export default function AdminCasoDocs() {
  const { id, casoId } = useParams<{ id: string; casoId: string }>();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api<any[]>(`/admin/clientes/${id}/casos/${casoId}/documentos`).then(setDocs).catch(() => {}).finally(() => setLoading(false));
  }, [id, casoId]);

  return (
    <Shell crumbs={[
      { label: "Painel", href: "/admin" },
      { label: "Escritórios", href: "/admin/clientes" },
      { label: "Escritório", href: `/admin/clientes/${id}` },
      { label: "Caso" },
    ]}>
      <div className="space-y-6 anim-in">
        <div>
          <span className="kicker">Auditoria</span>
          <h1 className="h-display text-4xl mt-2">Documentos do caso</h1>
          <p className="muted text-sm mt-2">Acesso completo ao markdown gerado de cada documento.</p>
        </div>
        <div className="card-elev p-0 overflow-hidden">
          {loading ? <div className="p-6"><div className="skel" style={{ height: 80 }} /></div> : (
            <table className="tbl">
              <thead><tr><th>Arquivo</th><th>Status</th><th>Páginas</th></tr></thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id}>
                    <td><Link href={`/admin/documentos/${d.id}`} style={{ color: "var(--ink)", fontWeight: 600 }}><IconDoc /> {d.nome_arquivo}</Link></td>
                    <td><span className={`status-pill ${d.status === "concluido" ? "tag-ok" : d.status === "erro" ? "tag-danger" : "tag-info"}`}>{d.status}</span></td>
                    <td className="serif-num">{d.total_paginas || 0}</td>
                  </tr>
                ))}
                {docs.length === 0 && <tr><td colSpan={3} className="muted text-center py-8">Nenhum documento.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Shell>
  );
}
