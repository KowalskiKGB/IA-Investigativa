"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Shell, IconCheck } from "@/components/Shell";

type Correcao = {
  id: string; pagina: number;
  texto_original: string; texto_corrigido: string;
  motivo: string | null; confianca: number | null;
  aceita_pelo_usuario: boolean | null;
};

export default function CorrecoesPage() {
  const { id, doc_id } = useParams<{ id: string; doc_id: string }>();
  const [list, setList] = useState<Correcao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Correcao[]>(`/correcoes/${doc_id}`).then(setList).finally(() => setLoading(false));
  }, [doc_id]);

  async function decidir(c: Correcao, aceitar: boolean) {
    await api(`/correcoes/${c.id}/aceitar?aceitar=${aceitar}`, { method: "POST" });
    setList((l) => l.map((x) => (x.id === c.id ? { ...x, aceita_pelo_usuario: aceitar } : x)));
  }

  const pendentes = list.filter(c => c.aceita_pelo_usuario === null).length;
  const aceitas = list.filter(c => c.aceita_pelo_usuario === true).length;
  const rejeitadas = list.filter(c => c.aceita_pelo_usuario === false).length;

  return (
    <Shell crumbs={[{ label: "Casos", href: "/casos" }, { label: "Caso", href: `/casos/${id}` }, { label: "Correções OCR" }]}>
      <div className="space-y-6 anim-in">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <span className="kicker">Revisão supervisionada</span>
            <h1 className="h-display text-4xl mt-2">Correções de OCR</h1>
            <p className="muted text-sm mt-2 max-w-2xl">A IA sugeriu as correções abaixo. Confira no PDF original (página indicada) e aceite ou rejeite cada uma.</p>
          </div>
          <div className="flex gap-2">
            <span className="tag tag-info">{pendentes} pendentes</span>
            <span className="tag tag-ok">{aceitas} aceitas</span>
            <span className="tag tag-danger">{rejeitadas} rejeitadas</span>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0,1,2].map(i => <div key={i} className="skel" style={{ height: 140 }} />)}
          </div>
        ) : list.length === 0 ? (
          <div className="card-elev text-center py-12">
            <div className="feat-icon mx-auto"><IconCheck /></div>
            <h3 className="serif text-2xl gold mt-3">Nenhuma correção sugerida</h3>
            <p className="muted text-sm mt-2">O OCR ficou limpo ou ainda está sendo processado.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {list.map((c) => (
              <li key={c.id} className="card">
                <div className="flex justify-between items-center mb-3">
                  <span className="tag">Página {c.pagina}</span>
                  <div className="flex items-center gap-2">
                    {c.confianca && <span className="muted text-xs">confiança {(c.confianca * 100).toFixed(0)}%</span>}
                    {c.aceita_pelo_usuario === true && <span className="status-pill tag-ok">✓ Aceita</span>}
                    {c.aceita_pelo_usuario === false && <span className="status-pill tag-danger">✕ Rejeitada</span>}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="field-label">Original (OCR)</div>
                    <pre className="text-xs p-3 rounded-lg whitespace-pre-wrap" style={{ background: "rgba(240,133,133,0.06)", border: "1px solid rgba(240,133,133,0.2)", color: "#fbcfcf" }}>{c.texto_original}</pre>
                  </div>
                  <div>
                    <div className="field-label">Corrigido (sugestão)</div>
                    <pre className="text-xs p-3 rounded-lg whitespace-pre-wrap" style={{ background: "rgba(125,211,167,0.06)", border: "1px solid rgba(125,211,167,0.2)", color: "#cdf0dc" }}>{c.texto_corrigido}</pre>
                  </div>
                </div>
                {c.motivo && <p className="muted text-xs mt-3"><strong className="gold">Motivo:</strong> {c.motivo}</p>}
                <div className="flex gap-2 mt-4">
                  <button className="btn btn-sm" onClick={() => decidir(c, true)} disabled={c.aceita_pelo_usuario === true}>
                    <IconCheck /> Aceitar
                  </button>
                  <button className="btn-ghost btn-sm" onClick={() => decidir(c, false)} disabled={c.aceita_pelo_usuario === false}>
                    Rejeitar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Shell>
  );
}
