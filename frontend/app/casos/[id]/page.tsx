"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api } from "@/lib/api";

type Doc = { id: string; nome_arquivo: string; status: string; total_paginas: number | null };

export default function CasoPage() {
  const { id } = useParams<{ id: string }>();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  const [pergunta, setPergunta] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resposta, setResposta] = useState<any>(null);
  const [drag, setDrag] = useState(false);
  const [enviandoFiles, setEnviandoFiles] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  async function carregar() {
    const [d, h] = await Promise.all([
      api<Doc[]>(`/documentos/${id}`),
      api<any[]>(`/chat/${id}/historico`),
    ]);
    setDocs(d); setHistorico(h);
  }

  useEffect(() => {
    carregar();
    const t = setInterval(carregar, 5000);
    return () => clearInterval(t);
  }, [id]);

  async function enviarArquivos(files: FileList | File[]) {
    const arr = Array.from(files);
    setEnviandoFiles(arr.length);
    for (const file of arr) {
      const fd = new FormData();
      fd.append("arquivo", file);
      try {
        await api(`/documentos/${id}`, { method: "POST", body: fd });
      } catch (e) { /* segue para próximo */ }
      setEnviandoFiles((n) => n - 1);
    }
    carregar();
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
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/casos" className="muted text-sm">← Casos</Link>
          <span className="tag">Caso ativo</span>
        </div>
        <div className="flex gap-2">
          <Link href={`/casos/${id}/grafo`} className="btn-ghost">Grafo do escritório</Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* coluna esquerda — upload + docs */}
        <section className="lg:col-span-2 space-y-4">
          <div
            className={`dropzone ${drag ? "drag" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault(); setDrag(false);
              if (e.dataTransfer.files?.length) enviarArquivos(e.dataTransfer.files);
            }}
            onClick={() => fileRef.current?.click()}
          >
            <div className="serif text-2xl gold">Carregar evidências</div>
            <p className="muted text-sm mt-1">
              Arraste PDFs ou imagens · ou clique para escolher · múltiplos arquivos suportados
            </p>
            <input
              ref={fileRef} type="file" hidden multiple accept="application/pdf,image/*"
              onChange={(e) => e.target.files && enviarArquivos(e.target.files)}
            />
            {enviandoFiles > 0 && (
              <p className="text-sm gold mt-3">Enviando… ({enviandoFiles} restantes)</p>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="serif text-xl">Autos do caso</h2>
              <span className="muted text-xs">{docs.length} documento(s)</span>
            </div>
            <ul className="space-y-2 text-sm">
              {docs.map((d) => (
                <li key={d.id} className="flex justify-between gap-2 border-b border-[var(--line)] pb-2">
                  <Link href={`/casos/${id}/correcoes/${d.id}`} className="truncate">
                    {d.nome_arquivo}
                  </Link>
                  <span className="text-xs whitespace-nowrap" style={{
                    color: d.status === "concluido" ? "var(--ok)" :
                           d.status === "erro" ? "var(--danger)" : "var(--ink-muted)"
                  }}>
                    {d.status}{d.total_paginas ? ` · ${d.total_paginas}p` : ""}
                  </span>
                </li>
              ))}
              {docs.length === 0 && <p className="muted">Nenhum documento ainda. Carregue acima.</p>}
            </ul>
          </div>
        </section>

        {/* coluna direita — chat */}
        <section className="lg:col-span-3 card-elev flex flex-col" style={{ minHeight: 640 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="serif text-2xl">Inquérito assistido</h2>
            <span className="tag">Cita fonte e página</span>
          </div>
          <div className="divider-gold mb-3" />
          <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-2">
            {historico.length === 0 && (
              <p className="muted text-sm italic">
                Nenhuma pergunta ainda. Comece perguntando, por exemplo:
                "Quais empresas aparecem nos diários e em quantas páginas?"
              </p>
            )}
            {historico.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={`max-w-[85%] px-4 py-3 text-sm whitespace-pre-wrap ${m.role === "user" ? "bubble-user" : "bubble-bot"}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.conteudo}</ReactMarkdown>
                </div>
              </div>
            ))}
            {resposta?.fontes?.length > 0 && (
              <div className="text-xs muted border-t border-[var(--line)] pt-2">
                <strong className="gold">Fontes citadas:</strong>
                <ul className="list-disc ml-5 mt-1">
                  {resposta.fontes.map((f: any, i: number) => (
                    <li key={i}>{f.nome_arquivo} · p. {f.pagina}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <form onSubmit={perguntar} className="flex gap-2">
            <input
              className="input"
              placeholder="Pergunte sobre os documentos do caso…"
              value={pergunta}
              onChange={(e) => setPergunta(e.target.value)}
            />
            <button className="btn" disabled={enviando}>
              {enviando ? "Investigando…" : "Perguntar"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
