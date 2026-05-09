"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api } from "@/lib/api";
import { Shell, IconUpload, IconNet, IconDoc, IconSpark, IconArrowLeft } from "@/components/Shell";

const GrafoViewer = dynamic(() => import("@/components/GrafoViewer"), { ssr: false });

function IconTrash() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
}

type Doc = {
  id: string; nome_arquivo: string; status: string;
  total_paginas: number | null; progresso: number; erro: string | null;
};
type Grafo = { nos: any[]; arestas: any[] };

function ProgressBar({ progresso, status }: { progresso: number; status: string }) {
  const cor = status === "concluido" ? "var(--ok)" : status === "erro" ? "var(--danger)" : "var(--gold)";
  const pct = status === "concluido" ? 100 : progresso;
  return (
    <div style={{ height: 3, background: "var(--bg-soft)", borderRadius: 2, overflow: "hidden", marginTop: 4 }}>
      <div style={{ height: "100%", width: `${pct}%`, background: cor, borderRadius: 2, transition: "width 0.5s ease" }} />
    </div>
  );
}

export default function CasoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  const [pergunta, setPergunta] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resposta, setResposta] = useState<any>(null);
  const [drag, setDrag] = useState(false);
  const [enviandoFiles, setEnviandoFiles] = useState(0);
  const [grafoData, setGrafoData] = useState<Grafo | null>(null);
  const [mostrarGrafo, setMostrarGrafo] = useState(false);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [confirmarDoc, setConfirmarDoc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  async function carregar() {
    const [d, h] = await Promise.all([
      api<Doc[]>(`/documentos/${id}`),
      api<any[]>(`/chat/${id}/historico`),
    ]);
    setDocs(d); setHistorico(h);
  }

  async function carregarGrafo() {
    try {
      const g = await api<Grafo>(`/grafo/caso/${id}`);
      setGrafoData(g);
    } catch {}
  }

  useEffect(() => {
    carregar();
    carregarGrafo();
    const t = setInterval(() => {
      carregar();
      carregarGrafo();
    }, 5000);
    return () => clearInterval(t);
  }, [id]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [historico, resposta]);

  async function enviarArquivos(files: FileList | File[]) {
    const arr = Array.from(files);
    setEnviandoFiles(arr.length);
    for (const file of arr) {
      const fd = new FormData();
      fd.append("arquivo", file);
      try {
        await api(`/documentos/${id}`, { method: "POST", body: fd });
      } catch { /* segue */ }
      setEnviandoFiles((n) => n - 1);
    }
    carregar();
  }

  async function excluirDoc(docId: string) {
    setExcluindo(docId); setConfirmarDoc(null);
    try {
      await api(`/documentos/${id}/${docId}`, { method: "DELETE" });
      setDocs((prev) => prev.filter(d => d.id !== docId));
    } catch (e: any) { alert("Erro: " + e.message); }
    finally { setExcluindo(null); }
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

  const concluidos = docs.filter(d => d.status === "concluido").length;
  const processando = docs.filter(d => d.status !== "concluido" && d.status !== "erro").length;
  const temEntidades = (grafoData?.nos?.length ?? 0) > 0;

  return (
    <Shell
      crumbs={[{ label: "Casos", href: "/casos" }, { label: id?.slice(0, 8) || "Caso" }]}
      actions={<Link href={`/casos/${id}/grafo`} className="btn-ghost"><IconNet /> Grafo do caso</Link>}
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* coluna esquerda */}
        <section className="lg:col-span-2 space-y-4 anim-in">
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
            <div className="feat-icon mx-auto"><IconUpload /></div>
            <div className="serif text-2xl gold">Carregar documentos</div>
            <p className="muted text-sm mt-1">
              PDFs, contratos, certidões, diários, imagens — arraste ou clique
            </p>
            <input
              ref={fileRef} type="file" hidden multiple accept="application/pdf,image/*,.doc,.docx"
              onChange={(e) => e.target.files && enviarArquivos(e.target.files)}
            />
            {enviandoFiles > 0 && (
              <div className="mt-3">
                <span className="tag"><span className="spinner" /> Enviando {enviandoFiles}…</span>
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="serif text-xl">Documentos do caso</h2>
              <div className="flex gap-2">
                <span className="tag tag-ok">{concluidos} pronto(s)</span>
                {processando > 0 && <span className="tag tag-info"><span className="spinner" style={{ width: 10, height: 10 }} /> {processando}</span>}
              </div>
            </div>
            <ul className="space-y-1 text-sm" style={{ maxHeight: 420, overflowY: "auto" }}>
              {docs.map((d) => (
                <li key={d.id} className="rounded-md hover:bg-[var(--bg-soft)] transition">
                  <div className="flex justify-between items-center gap-2 px-2 py-2">
                    <button
                      className="flex items-center gap-2 min-w-0 flex-1 text-left"
                      style={{ color: "var(--ink-soft)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      onClick={() => router.push(`/casos/${id}/documento/${d.id}`)}
                      title="Ver texto extraído e PDF"
                    >
                      <IconDoc />
                      <span className="truncate">{d.nome_arquivo}</span>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`status-pill ${d.status === "concluido" ? "tag-ok" : d.status === "erro" ? "tag-danger" : "tag-info"}`}
                        title={d.erro || d.status}>
                        {d.status === "concluido" ? "✓" : d.status === "erro" ? "✕" : <span className="spinner" style={{ width: 10, height: 10 }} />}
                        {d.total_paginas ? `${d.total_paginas}p` : `${d.progresso}%`}
                      </span>
                      {confirmarDoc === d.id ? (
                        <>
                          <button className="btn btn-sm btn-danger" onClick={() => excluirDoc(d.id)} disabled={excluindo === d.id}>
                            {excluindo === d.id ? <span className="spinner" /> : "✕"}
                          </button>
                          <button className="btn-ghost btn-sm" onClick={() => setConfirmarDoc(null)}>—</button>
                        </>
                      ) : (
                        <button
                          className="btn-ghost btn-sm"
                          style={{ color: "var(--danger)", opacity: 0.6, padding: "0 4px" }}
                          onClick={(e) => { e.stopPropagation(); setConfirmarDoc(d.id); }}
                          title="Excluir documento"
                        >
                          <IconTrash />
                        </button>
                      )}
                    </div>
                  </div>
                  {d.status !== "concluido" && d.status !== "pendente" && (
                    <div className="px-2 pb-1">
                      <ProgressBar progresso={d.progresso} status={d.status} />
                      <span className="muted" style={{ fontSize: 10 }}>
                        {d.status === "erro" ? `Erro: ${d.erro?.slice(0, 80) || "desconhecido"}` : `${d.progresso}% — ${d.status}`}
                      </span>
                    </div>
                  )}
                </li>
              ))}
              {docs.length === 0 && (
                <li className="muted text-center py-6">Nenhum documento. Arraste acima para começar.</li>
              )}
            </ul>
          </div>

          {/* Mini grafo — aparece quando há entidades extraídas */}
          {temEntidades && (
            <div className="card anim-in-2">
              <button
                className="w-full flex items-center justify-between text-sm"
                onClick={() => setMostrarGrafo(!mostrarGrafo)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-soft)" }}
              >
                <span className="flex items-center gap-2">
                  <IconNet />
                  <strong className="gold">Grafo ao vivo</strong>
                  <span className="tag tag-info" style={{ fontSize: 10 }}>
                    {grafoData?.nos.length} entidades
                  </span>
                </span>
                <span className="muted">{mostrarGrafo ? "▲ recolher" : "▼ expandir"}</span>
              </button>
              {mostrarGrafo && (
                <div className="mt-3" style={{ height: 360 }}>
                  <GrafoViewer grafo={grafoData ?? undefined} />
                </div>
              )}
            </div>
          )}
        </section>

        {/* coluna direita — chat */}
        <section className="lg:col-span-3 card-elev flex flex-col anim-in-1" style={{ minHeight: 680 }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="kicker">Inquérito assistido por IA</span>
              <h2 className="h-display text-3xl mt-1">Pergunte aos autos</h2>
            </div>
            <span className="tag"><IconSpark /> Cita fonte e página</span>
          </div>
          <div className="divider-gold mb-3" />

          <div ref={chatRef} className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2" style={{ minHeight: 380 }}>
            {historico.length === 0 && !enviando && (
              <div className="muted text-center py-12">
                <div className="feat-icon mx-auto"><IconSpark /></div>
                <p className="serif text-xl gold mt-3">Comece a investigação</p>
                <p className="text-sm mt-2 max-w-sm mx-auto">
                  "Quais empresas aparecem?" · "Quem assinou o contrato?" · "Liste as partes do processo" · "Resuma as cláusulas de rescisão"
                </p>
              </div>
            )}
            {historico.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={`max-w-[85%] text-sm whitespace-pre-wrap ${m.role === "user" ? "bubble-user" : "bubble-bot"}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.conteudo}</ReactMarkdown>
                </div>
              </div>
            ))}
            {enviando && (
              <div className="flex justify-start">
                <div className="bubble-bot text-sm flex items-center gap-2">
                  <span className="spinner" /> Analisando os documentos…
                </div>
              </div>
            )}
            {resposta?.fontes?.length > 0 && (
              <div className="text-xs muted border-t border-[var(--line)] pt-3 mt-3">
                <strong className="gold">Fontes citadas:</strong>
                <ul className="list-disc ml-5 mt-1 space-y-0.5">
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
            <button className="btn" disabled={enviando || !pergunta.trim()}>
              {enviando ? <span className="spinner" /> : "Perguntar →"}
            </button>
          </form>
        </section>
      </div>
    </Shell>
  );
}

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
  const chatRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [historico, resposta]);

  async function enviarArquivos(files: FileList | File[]) {
    const arr = Array.from(files);
    setEnviandoFiles(arr.length);
    for (const file of arr) {
      const fd = new FormData();
      fd.append("arquivo", file);
      try {
        await api(`/documentos/${id}`, { method: "POST", body: fd });
      } catch { /* segue */ }
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

  const concluidos = docs.filter(d => d.status === "concluido").length;
  const processando = docs.filter(d => d.status !== "concluido" && d.status !== "erro").length;

  return (
    <Shell
      crumbs={[{ label: "Casos", href: "/casos" }, { label: id?.slice(0, 8) || "Caso" }]}
      actions={<Link href={`/casos/${id}/grafo`} className="btn-ghost"><IconNet /> Grafo do caso</Link>}
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* coluna esquerda */}
        <section className="lg:col-span-2 space-y-4 anim-in">
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
            <div className="feat-icon mx-auto"><IconUpload /></div>
            <div className="serif text-2xl gold">Carregar evidências</div>
            <p className="muted text-sm mt-1">
              Arraste PDFs ou imagens · ou clique para escolher · múltiplos arquivos
            </p>
            <input
              ref={fileRef} type="file" hidden multiple accept="application/pdf,image/*"
              onChange={(e) => e.target.files && enviarArquivos(e.target.files)}
            />
            {enviandoFiles > 0 && (
              <div className="mt-3">
                <span className="tag"><span className="spinner" /> Enviando {enviandoFiles}…</span>
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="serif text-xl">Autos do caso</h2>
              <div className="flex gap-2">
                <span className="tag tag-ok">{concluidos} pronto(s)</span>
                {processando > 0 && <span className="tag tag-info"><span className="spinner" style={{ width: 10, height: 10 }} /> {processando}</span>}
              </div>
            </div>
            <ul className="space-y-1 text-sm" style={{ maxHeight: 480, overflowY: "auto" }}>
              {docs.map((d) => (
                <li key={d.id} className="flex justify-between items-center gap-2 px-2 py-2 rounded-md hover:bg-[var(--bg-soft)] transition">
                  <Link href={`/casos/${id}/correcoes/${d.id}`} className="flex items-center gap-2 min-w-0 flex-1" style={{ color: "var(--ink-soft)" }}>
                    <IconDoc />
                    <span className="truncate">{d.nome_arquivo}</span>
                  </Link>
                  <span className={`status-pill ${d.status === "concluido" ? "tag-ok" : d.status === "erro" ? "tag-danger" : "tag-info"}`}>
                    {d.status === "concluido" ? "✓" : d.status === "erro" ? "✕" : <span className="spinner" style={{ width: 10, height: 10 }} />}
                    {d.total_paginas ? `${d.total_paginas}p` : d.status}
                  </span>
                </li>
              ))}
              {docs.length === 0 && (
                <li className="muted text-center py-6">Nenhum documento ainda. Arraste acima para começar.</li>
              )}
            </ul>
          </div>
        </section>

        {/* coluna direita — chat */}
        <section className="lg:col-span-3 card-elev flex flex-col anim-in-1" style={{ minHeight: 680 }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="kicker">Inquérito assistido</span>
              <h2 className="h-display text-3xl mt-1">Pergunte aos autos</h2>
            </div>
            <span className="tag"><IconSpark /> Cita fonte e página</span>
          </div>
          <div className="divider-gold mb-3" />

          <div ref={chatRef} className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2" style={{ minHeight: 380 }}>
            {historico.length === 0 && !enviando && (
              <div className="muted text-center py-12">
                <div className="feat-icon mx-auto"><IconSpark /></div>
                <p className="serif text-xl gold mt-3">Comece a investigação</p>
                <p className="text-sm mt-2 max-w-sm mx-auto">
                  Exemplos: "Quais empresas aparecem nos diários e em quantas páginas?" · "Liste os processos envolvendo o réu X" · "Resuma as decisões de 2024"
                </p>
              </div>
            )}
            {historico.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={`max-w-[85%] text-sm whitespace-pre-wrap ${m.role === "user" ? "bubble-user" : "bubble-bot"}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.conteudo}</ReactMarkdown>
                </div>
              </div>
            ))}
            {enviando && (
              <div className="flex justify-start">
                <div className="bubble-bot text-sm flex items-center gap-2">
                  <span className="spinner" /> Investigando os autos…
                </div>
              </div>
            )}
            {resposta?.fontes?.length > 0 && (
              <div className="text-xs muted border-t border-[var(--line)] pt-3 mt-3">
                <strong className="gold">Fontes citadas:</strong>
                <ul className="list-disc ml-5 mt-1 space-y-0.5">
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
            <button className="btn" disabled={enviando || !pergunta.trim()}>
              {enviando ? <span className="spinner" /> : "Perguntar →"}
            </button>
          </form>
        </section>
      </div>
    </Shell>
  );
}
