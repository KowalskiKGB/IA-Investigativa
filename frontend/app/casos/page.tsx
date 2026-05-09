"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, clearToken } from "@/lib/api";
import { Shell, IconPlus, IconNet, IconFolder, IconSearch } from "@/components/Shell";

type Caso = { id: string; nome: string; descricao: string | null; status: string };

export default function CasosPage() {
  const [casos, setCasos] = useState<Caso[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [novo, setNovo] = useState({ nome: "", descricao: "" });
  const [criando, setCriando] = useState(false);

  useEffect(() => {
    api<Caso[]>("/casos").then(setCasos).catch(() => clearToken()).finally(() => setLoading(false));
  }, []);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setCriando(true);
    try {
      const c = await api<Caso>("/casos", { method: "POST", body: JSON.stringify(novo) });
      setCasos([c, ...casos]);
      setNovo({ nome: "", descricao: "" });
    } finally { setCriando(false); }
  }

  const filtrados = casos.filter(c =>
    !filtro || c.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    (c.descricao || "").toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <Shell crumbs={[{ label: "Casos" }]} actions={<Link href="/grafo" className="btn-ghost"><IconNet /> Grafo geral</Link>}>
      <div className="space-y-7">
        <div className="anim-in flex items-end justify-between flex-wrap gap-4">
          <div>
            <span className="kicker">Investigação</span>
            <h1 className="h-display text-4xl mt-2">Casos do escritório</h1>
            <p className="muted text-sm mt-2">Cada caso é um espaço isolado de documentos, chat e grafo de evidências.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="tag">{casos.length} caso(s)</span>
          </div>
        </div>

        <form onSubmit={criar} className="card-elev anim-in-1 grid md:grid-cols-[1fr_2fr_auto] gap-3 items-end">
          <div>
            <label className="field-label">Novo caso</label>
            <input className="input" placeholder="Ex: Operação Diários 2024"
              value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} required />
          </div>
          <div>
            <label className="field-label">Descrição (opcional)</label>
            <input className="input" placeholder="Investigação sobre..."
              value={novo.descricao} onChange={(e) => setNovo({ ...novo, descricao: e.target.value })} />
          </div>
          <button className="btn" disabled={criando}>
            {criando ? <><span className="spinner" /> Criando…</> : <><IconPlus /> Criar caso</>}
          </button>
        </form>

        <div className="anim-in-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-dim)" }}><IconSearch /></span>
              <input className="input" style={{ paddingLeft: "2.4rem" }} placeholder="Buscar caso..."
                value={filtro} onChange={(e) => setFiltro(e.target.value)} />
            </div>
          </div>

          {loading ? (
            <div className="grid gap-3">
              {[0, 1, 2].map(i => <div key={i} className="skel" style={{ height: 90 }} />)}
            </div>
          ) : filtrados.length === 0 ? (
            <div className="card-elev text-center py-12">
              <div className="feat-icon mx-auto"><IconFolder /></div>
              <h3 className="serif text-2xl gold mt-3">{filtro ? "Nenhum caso encontrado" : "Crie seu primeiro caso"}</h3>
              <p className="muted text-sm mt-2 max-w-md mx-auto">
                {filtro ? "Tente outro termo de busca." : "Casos isolam documentos, chat e grafo. Comece criando um acima."}
              </p>
            </div>
          ) : (
            <ul className="grid gap-3">
              {filtrados.map((c, i) => (
                <li key={c.id} className="card card-hover anim-in-1" style={{ animationDelay: `${0.05 * i}s` }}>
                  <Link href={`/casos/${c.id}`} className="flex items-center gap-4">
                    <div className="feat-icon" style={{ marginBottom: 0 }}><IconFolder /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h2 className="serif text-xl truncate" style={{ color: "var(--ink)" }}>{c.nome}</h2>
                        <span className={`status-pill ${c.status === "ativo" ? "tag-ok" : "tag-muted"}`}>
                          <span className="dot" /> {c.status}
                        </span>
                      </div>
                      {c.descricao && <p className="text-sm muted mt-1 truncate">{c.descricao}</p>}
                    </div>
                    <span className="muted text-sm whitespace-nowrap">Abrir →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Shell>
  );
}
