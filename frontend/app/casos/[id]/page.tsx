"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api } from "@/lib/api";

type Doc = { id: string; nome_arquivo: string; status: string; total_paginas: number | null };
type Msg = { role: "user" | "assistant"; resposta?: string; conteudo?: string; fontes?: any[] };

export default function CasoPage() {
  const { id } = useParams<{ id: string }>();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  const [pergunta, setPergunta] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resposta, setResposta] = useState<any>(null);

  async function carregar() {
    const [d, h] = await Promise.all([
      api<Doc[]>(`/documentos/${id}`),
      api<any[]>(`/chat/${id}/historico`),
    ]);
    setDocs(d); setHistorico(h);
  }

  useEffect(() => { carregar(); }, [id]);

  async function enviarArquivo(file: File) {
    const fd = new FormData();
    fd.append("arquivo", file);
    await api(`/documentos/${id}`, { method: "POST", body: fd });
    setTimeout(carregar, 800);
  }

  async function perguntar(e: React.FormEvent) {
    e.preventDefault();
    if (!pergunta.trim()) return;
    setEnviando(true);
    try {
      const r = await api<any>("/chat", { method: "POST", body: JSON.stringify({ caso_id: id, pergunta }) });
      setResposta(r);
      setPergunta("");
      carregar();
    } finally { setEnviando(false); }
  }

  return (
    <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <header className="lg:col-span-3 flex justify-between">
        <Link href="/casos" className="text-muted text-sm">← Voltar</Link>
        <Link href={`/casos/${id}/grafo`} className="btn-ghost">🕸️ Ver grafo deste cliente</Link>
      </header>

      {/* coluna documentos */}
      <section className="card">
        <h2 className="text-xl font-bold mb-3">Documentos</h2>
        <label className="btn-ghost block text-center cursor-pointer mb-3">
          📎 Enviar PDF
          <input type="file" hidden accept="application/pdf,image/*"
            onChange={(e) => e.target.files && enviarArquivo(e.target.files[0])} />
        </label>
        <ul className="space-y-2 text-sm">
          {docs.map((d) => (
            <li key={d.id} className="flex justify-between border-b border-edge pb-1">
              <Link href={`/casos/${id}/correcoes/${d.id}`} className="hover:text-accent truncate">
                {d.nome_arquivo}
              </Link>
              <span className={`text-xs ${d.status === "concluido" ? "text-green-400" : "text-muted"}`}>
                {d.status} {d.total_paginas ? `(${d.total_paginas}p)` : ""}
              </span>
            </li>
          ))}
          {docs.length === 0 && <p className="text-muted">Nenhum documento.</p>}
        </ul>
      </section>

      {/* chat */}
      <section className="card lg:col-span-2 flex flex-col" style={{ minHeight: 600 }}>
        <h2 className="text-xl font-bold mb-3">Chat investigativo</h2>
        <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-2">
          {historico.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : ""}>
              <div className={`inline-block max-w-[85%] px-3 py-2 rounded-md text-sm whitespace-pre-wrap
                ${m.role === "user" ? "bg-accent/30" : "bg-bg border border-edge"}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.conteudo}</ReactMarkdown>
              </div>
            </div>
          ))}
          {resposta?.fontes?.length > 0 && (
            <div className="text-xs text-muted">
              <strong>Fontes:</strong>
              <ul className="list-disc ml-5">
                {resposta.fontes.map((f: any, i: number) => (
                  <li key={i}>{f.nome_arquivo}, p. {f.pagina}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <form onSubmit={perguntar} className="flex gap-2">
          <input className="input" placeholder="Pergunte algo sobre os documentos..."
            value={pergunta} onChange={(e) => setPergunta(e.target.value)} />
          <button className="btn" disabled={enviando}>
            {enviando ? "..." : "Enviar"}
          </button>
        </form>
      </section>
    </main>
  );
}
