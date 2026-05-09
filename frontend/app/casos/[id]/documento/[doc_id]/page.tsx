"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, apiBase, getToken } from "@/lib/api";
import { Shell, IconDoc, IconArrowLeft, IconCheck, IconSearch } from "@/components/Shell";

function IconPdf() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
}
function IconStream() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>;
}
function IconCorrect() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}

type Pagina = { numero: number; texto: string; metodo: string };
type DocInfo = {
  documento_id: string;
  nome_arquivo: string;
  total_paginas: number | null;
  status: string;
  paginas: Pagina[];
};

type StreamEvt = { type: string; pagina?: number; total?: number; texto?: string; metodo?: string; msg?: string; cached?: boolean };

export default function DocumentoViewer() {
  const { id: casoId, doc_id: docId } = useParams<{ id: string; doc_id: string }>();
  const [docInfo, setDocInfo] = useState<DocInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pdf" | "texto" | "stream">("texto");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pagAtual, setPagAtual] = useState(1);
  const [streamLines, setStreamLines] = useState<{ pagina: number; texto: string; metodo: string }[]>([]);
  const [streamStatus, setStreamStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [streamMsg, setStreamMsg] = useState("");
  const [streamTotal, setStreamTotal] = useState(0);
  const streamRef = useRef<HTMLDivElement>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);

  useEffect(() => {
    api<DocInfo>(`/documentos/${casoId}/${docId}/texto`)
      .then(setDocInfo)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [casoId, docId]);

  useEffect(() => {
    if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
  }, [streamLines]);

  // Pre-load PDF blob when tab switches to "pdf"
  useEffect(() => {
    if (tab !== "pdf" || pdfUrl) return;
    setPdfLoading(true);
    const token = getToken();
    fetch(`${apiBase()}/documentos/${casoId}/${docId}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const blob = await r.blob();
        setPdfUrl(URL.createObjectURL(blob));
      })
      .catch(() => setStreamMsg("Erro ao carregar PDF"))
      .finally(() => setPdfLoading(false));
  }, [tab, casoId, docId, pdfUrl]);

  async function iniciarStream() {
    if (readerRef.current) {
      readerRef.current.cancel();
      readerRef.current = null;
    }
    setStreamLines([]);
    setStreamStatus("running");
    setStreamMsg("");

    const token = getToken();
    try {
      const res = await fetch(`${apiBase()}/documentos/${casoId}/${docId}/stream-ocr`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          for (const line of part.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            try {
              const evt: StreamEvt = JSON.parse(line.slice(6));
              if (evt.type === "start") {
                setStreamTotal(evt.total ?? 0);
              } else if (evt.type === "page" && evt.pagina != null && evt.texto != null) {
                setStreamLines((prev) => [...prev, { pagina: evt.pagina!, texto: evt.texto!, metodo: evt.metodo ?? "extraido" }]);
              } else if (evt.type === "done") {
                setStreamStatus("done");
                // Reload text tab data
                api<DocInfo>(`/documentos/${casoId}/${docId}/texto`).then(setDocInfo).catch(() => {});
              } else if (evt.type === "error") {
                setStreamStatus("error");
                setStreamMsg(evt.msg ?? "Erro desconhecido");
              } else if (evt.type === "info") {
                setStreamMsg(evt.msg ?? "");
              }
            } catch {}
          }
        }
      }
      if (streamStatus === "running") setStreamStatus("done");
    } catch (e: any) {
      setStreamStatus("error");
      setStreamMsg(e.message);
    }
  }

  function pararStream() {
    readerRef.current?.cancel();
    readerRef.current = null;
    setStreamStatus("idle");
  }

  const paginaAtual = docInfo?.paginas?.find(p => p.numero === pagAtual);
  const totalPages = docInfo?.total_paginas ?? docInfo?.paginas?.length ?? 0;

  const tabs = [
    { id: "texto" as const, label: "Texto Extraído", icon: <IconDoc /> },
    { id: "pdf" as const, label: "Ver PDF", icon: <IconPdf /> },
    { id: "stream" as const, label: "Converter sem IA", icon: <IconStream /> },
  ];

  return (
    <Shell crumbs={[
      { label: "Casos", href: "/casos" },
      { label: "Caso", href: `/casos/${casoId}` },
      { label: docInfo?.nome_arquivo || "Documento" },
    ]}>
      <div className="space-y-4 anim-in">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <span className="kicker">Análise documental</span>
            <h1 className="h-display text-3xl mt-2 flex items-center gap-3">
              <IconDoc /> {loading ? <span className="skel" style={{ width: 300, height: 32, display: "inline-block" }} /> : docInfo?.nome_arquivo}
            </h1>
            {docInfo && (
              <div className="flex gap-2 mt-2">
                <span className={`tag ${docInfo.status === "concluido" ? "tag-ok" : docInfo.status === "erro" ? "tag-danger" : "tag-info"}`}>
                  {docInfo.status}
                </span>
                {totalPages > 0 && <span className="tag">{totalPages} página(s)</span>}
                <Link href={`/casos/${casoId}/correcoes/${docId}`} className="tag tag-info" style={{ textDecoration: "none" }}>
                  <IconCorrect /> Correções IA
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[var(--line)] pb-0">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="btn-ghost btn-sm"
              style={{
                borderBottom: tab === t.id ? "2px solid var(--gold)" : "2px solid transparent",
                borderRadius: "4px 4px 0 0",
                color: tab === t.id ? "var(--gold)" : "var(--ink-muted)",
                paddingBottom: 8,
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "texto" && (
          <div className="grid lg:grid-cols-[220px_1fr] gap-4">
            {/* Page navigator */}
            <div className="card" style={{ maxHeight: "70vh", overflowY: "auto", alignSelf: "start" }}>
              <h3 className="field-label mb-3">Páginas</h3>
              <ul className="space-y-1">
                {loading ? [1,2,3].map(i => <li key={i}><div className="skel" style={{ height: 28 }} /></li>) :
                  docInfo?.paginas.map(p => (
                    <li key={p.numero}>
                      <button
                        onClick={() => setPagAtual(p.numero)}
                        className="w-full text-left text-sm px-2 py-1 rounded"
                        style={{
                          background: pagAtual === p.numero ? "var(--bg-soft)" : "transparent",
                          color: pagAtual === p.numero ? "var(--gold)" : "var(--ink-soft)",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>Página {p.numero}</span>
                        <span style={{ fontSize: 10, color: p.metodo === "ocr" ? "var(--info)" : "var(--ok)" }}>
                          {p.metodo}
                        </span>
                      </button>
                    </li>
                  ))
                }
                {!loading && !docInfo?.paginas.length && (
                  <li className="muted text-xs text-center py-4">Sem páginas ainda</li>
                )}
              </ul>
            </div>

            {/* Text content */}
            <div className="card-elev" style={{ minHeight: "60vh" }}>
              {loading ? (
                <div className="skel" style={{ height: 400 }} />
              ) : paginaAtual ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="kicker">Página {paginaAtual.numero} / {totalPages}</span>
                    <span className={`tag ${paginaAtual.metodo === "ocr" ? "tag-info" : "tag-ok"}`}>
                      {paginaAtual.metodo === "ocr" ? "📷 OCR" : "📄 Extraído"}
                    </span>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <button
                      className="btn-ghost btn-sm"
                      disabled={pagAtual <= 1}
                      onClick={() => setPagAtual(p => p - 1)}
                    >← Ant</button>
                    <button
                      className="btn-ghost btn-sm"
                      disabled={pagAtual >= totalPages}
                      onClick={() => setPagAtual(p => p + 1)}
                    >Próx →</button>
                  </div>
                  <pre
                    className="text-sm whitespace-pre-wrap"
                    style={{
                      fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
                      lineHeight: 1.7,
                      color: "var(--ink-soft)",
                      maxHeight: "60vh",
                      overflowY: "auto",
                    }}
                  >
                    {paginaAtual.texto || <span className="muted italic">(página vazia)</span>}
                  </pre>
                </>
              ) : (
                <div className="muted text-center py-12">
                  {docInfo?.status === "pendente" || docInfo?.status === "processando"
                    ? "Aguardando processamento…"
                    : "Selecione uma página à esquerda ou use a aba 'Converter sem IA' para processar."}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "pdf" && (
          <div className="card-elev" style={{ minHeight: "75vh", padding: 0, overflow: "hidden" }}>
            {pdfLoading ? (
              <div className="flex items-center justify-center h-full" style={{ minHeight: 500 }}>
                <div className="text-center">
                  <span className="spinner" style={{ width: 32, height: 32 }} />
                  <p className="muted mt-3 text-sm">Carregando PDF…</p>
                </div>
              </div>
            ) : pdfUrl ? (
              <iframe
                src={pdfUrl}
                style={{ width: "100%", height: "75vh", border: "none" }}
                title={docInfo?.nome_arquivo}
              />
            ) : (
              <div className="flex items-center justify-center" style={{ minHeight: 300 }}>
                <p className="muted text-sm">{streamMsg || "Clique na aba para carregar o PDF"}</p>
              </div>
            )}
          </div>
        )}

        {tab === "stream" && (
          <div className="space-y-4">
            <div className="card-elev">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="serif text-xl">Conversão direta sem IA</h2>
                  <p className="muted text-sm mt-1">
                    {docInfo?.status === "concluido"
                      ? "Documento já processado. Clique para ver o texto ao vivo (lido do banco)."
                      : "Processa OCR página a página usando Tesseract, sem nenhuma chamada à IA. Ideal para documentos simples."}
                  </p>
                </div>
                <div className="flex gap-2">
                  {streamStatus !== "running" ? (
                    <button className="btn" onClick={iniciarStream}>
                      <IconStream />
                      {docInfo?.status === "concluido" ? "Ver texto" : "Iniciar conversão"}
                    </button>
                  ) : (
                    <button className="btn-ghost" onClick={pararStream}>Parar</button>
                  )}
                  {streamStatus === "done" && <span className="tag tag-ok"><IconCheck /> Concluído</span>}
                  {streamStatus === "error" && <span className="tag tag-danger">Erro</span>}
                </div>
              </div>

              {streamStatus !== "idle" && streamTotal > 0 && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs muted mb-1">
                    <span>{streamLines.length} / {streamTotal} páginas</span>
                    <span>{Math.round(streamLines.length / streamTotal * 100)}%</span>
                  </div>
                  <div style={{ height: 4, background: "var(--bg-soft)", borderRadius: 2 }}>
                    <div style={{
                      height: "100%",
                      width: `${Math.round(streamLines.length / streamTotal * 100)}%`,
                      background: streamStatus === "done" ? "var(--ok)" : "var(--gold)",
                      borderRadius: 2,
                      transition: "width 0.3s ease",
                    }} />
                  </div>
                </div>
              )}

              {streamMsg && <div className="alert mb-3">{streamMsg}</div>}
            </div>

            {/* Live text output */}
            {streamLines.length > 0 && (
              <div
                ref={streamRef}
                className="card space-y-4"
                style={{ maxHeight: "60vh", overflowY: "auto", fontFamily: "ui-monospace, SF Mono, Menlo, monospace" }}
              >
                {streamLines.map((line, i) => (
                  <div key={i} className={`anim-in ${i === streamLines.length - 1 ? "" : ""}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="tag" style={{ fontSize: 10 }}>Página {line.pagina}</span>
                      <span className={`tag ${line.metodo === "ocr" ? "tag-info" : "tag-ok"}`} style={{ fontSize: 10 }}>
                        {line.metodo === "ocr" ? "📷 OCR" : "📄 Digital"}
                      </span>
                    </div>
                    <pre className="text-xs whitespace-pre-wrap" style={{
                      color: "var(--ink-soft)",
                      lineHeight: 1.6,
                      padding: "8px 0",
                      borderBottom: "1px solid var(--line)",
                    }}>
                      {line.texto || "(página vazia)"}
                    </pre>
                  </div>
                ))}
                {streamStatus === "running" && (
                  <div className="flex items-center gap-2 muted text-sm">
                    <span className="spinner" />
                    Processando página {streamLines.length + 1}…
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Shell>
  );
}
