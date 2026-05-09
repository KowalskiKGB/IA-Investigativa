"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Shell, IconDoc } from "@/components/Shell";

export default function AdminDocMD() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<any>(null);
  useEffect(() => { api<any>(`/admin/documentos/${id}/markdown`).then(setDoc).catch(() => {}); }, [id]);

  return (
    <Shell crumbs={[{ label: "Painel", href: "/admin" }, { label: "Documento" }]}>
      {!doc ? <div className="skel" style={{ height: 400 }} /> : (
        <div className="space-y-5 anim-in">
          <div>
            <span className="kicker">Markdown</span>
            <h1 className="h-display text-3xl mt-2 flex items-center gap-3"><IconDoc /> {doc.nome_arquivo}</h1>
          </div>
          <pre className="card text-xs whitespace-pre-wrap" style={{ fontFamily: "ui-monospace, SF Mono, Menlo, monospace", maxHeight: "75vh", overflowY: "auto" }}>
            {doc.markdown}
          </pre>
        </div>
      )}
    </Shell>
  );
}
