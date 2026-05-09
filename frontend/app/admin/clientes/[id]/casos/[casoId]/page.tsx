"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";

export default function AdminCasoDocs() {
  const { id, casoId } = useParams<{ id: string; casoId: string }>();
  const [docs, setDocs] = useState<any[]>([]);
  useEffect(() => {
    api<any[]>(`/admin/clientes/${id}/casos/${casoId}/documentos`).then(setDocs).catch(() => {});
  }, [id, casoId]);
  return (
    <main className="max-w-5xl mx-auto p-6 space-y-4">
      <Link href={`/admin/clientes/${id}`} className="muted text-sm">← Escritório</Link>
      <h1 className="serif text-2xl">Documentos do caso</h1>
      <div className="divider-gold" />
      <ul className="text-sm space-y-1">
        {docs.map((d) => (
          <li key={d.id} className="flex justify-between border-b border-[var(--line)] py-2">
            <Link href={`/admin/documentos/${d.id}`}>{d.nome_arquivo}</Link>
            <span className="muted">{d.status} · {d.total_paginas || 0}p</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
