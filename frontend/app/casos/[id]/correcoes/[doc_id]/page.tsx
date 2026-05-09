"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

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

  return (
    <main className="max-w-5xl mx-auto p-6">
      <header className="mb-4">
        <Link href={`/casos/${id}`} className="text-muted text-sm">← Voltar</Link>
        <h1 className="text-2xl font-bold mt-2">✏️ Correções de OCR</h1>
        <p className="text-muted text-sm">
          A IA sugeriu as correções abaixo. Confira cada uma no PDF original (página indicada) e aceite/rejeite.
        </p>
      </header>
      {loading && <p className="text-muted">Carregando...</p>}
      <ul className="space-y-3">
        {list.map((c) => (
          <li key={c.id} className="card">
            <div className="flex justify-between text-xs text-muted mb-2">
              <span>Página {c.pagina}</span>
              {c.confianca && <span>confiança {(c.confianca * 100).toFixed(0)}%</span>}
            </div>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-muted mb-1">Original</div>
                <pre className="bg-bg p-2 rounded whitespace-pre-wrap">{c.texto_original}</pre>
              </div>
              <div>
                <div className="text-xs text-muted mb-1">Corrigido</div>
                <pre className="bg-bg p-2 rounded whitespace-pre-wrap text-green-300">{c.texto_corrigido}</pre>
              </div>
            </div>
            {c.motivo && <p className="text-xs text-muted mt-2">Motivo: {c.motivo}</p>}
            <div className="flex gap-2 mt-3">
              <button className="btn" onClick={() => decidir(c, true)}
                      disabled={c.aceita_pelo_usuario === true}>
                {c.aceita_pelo_usuario === true ? "✓ Aceita" : "Aceitar"}
              </button>
              <button className="btn-ghost" onClick={() => decidir(c, false)}
                      disabled={c.aceita_pelo_usuario === false}>
                {c.aceita_pelo_usuario === false ? "✗ Rejeitada" : "Rejeitar"}
              </button>
            </div>
          </li>
        ))}
        {!loading && list.length === 0 && <p className="text-muted">Nenhuma correção sugerida.</p>}
      </ul>
    </main>
  );
}
