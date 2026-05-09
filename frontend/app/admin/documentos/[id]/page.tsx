"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";

export default function AdminDocMD() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<any>(null);
  useEffect(() => { api<any>(`/admin/documentos/${id}/markdown`).then(setDoc).catch(() => {}); }, [id]);
  if (!doc) return <main className="p-6 muted">Carregando…</main>;
  return (
    <main className="max-w-4xl mx-auto p-6 space-y-4">
      <Link href="/admin" className="muted text-sm">← Painel</Link>
      <h1 className="serif text-2xl">{doc.nome_arquivo}</h1>
      <div className="divider-gold" />
      <pre className="card text-xs whitespace-pre-wrap" style={{ fontFamily: "ui-monospace, monospace" }}>
        {doc.markdown}
      </pre>
    </main>
  );
}
