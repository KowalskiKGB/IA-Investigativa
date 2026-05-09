"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, hasToken, clearToken } from "@/lib/api";

type Caso = { id: string; nome: string; descricao: string | null; status: string };

export default function CasosPage() {
  const router = useRouter();
  const [casos, setCasos] = useState<Caso[]>([]);
  const [loading, setLoading] = useState(true);
  const [novo, setNovo] = useState({ nome: "", descricao: "" });

  useEffect(() => {
    if (!hasToken()) { router.push("/login"); return; }
    api<Caso[]>("/casos").then(setCasos).catch(() => clearToken()).finally(() => setLoading(false));
  }, [router]);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    const c = await api<Caso>("/casos", { method: "POST", body: JSON.stringify(novo) });
    setCasos([c, ...casos]);
    setNovo({ nome: "", descricao: "" });
  }

  return (
    <main className="max-w-5xl mx-auto p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Casos</h1>
        <div className="flex gap-3">
          <Link href="/grafo" className="btn-ghost">🕸️ Grafo geral</Link>
          <button className="btn-ghost" onClick={() => { clearToken(); router.push("/"); }}>Sair</button>
        </div>
      </header>

      <form onSubmit={criar} className="card flex gap-2 mb-6">
        <input className="input" placeholder="Nome do caso"
          value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} required />
        <input className="input" placeholder="Descrição (opcional)"
          value={novo.descricao} onChange={(e) => setNovo({ ...novo, descricao: e.target.value })} />
        <button className="btn">Criar</button>
      </form>

      {loading ? <p className="text-muted">Carregando...</p> : (
        <ul className="grid gap-3">
          {casos.map((c) => (
            <li key={c.id} className="card hover:border-accent transition">
              <Link href={`/casos/${c.id}`} className="block">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{c.nome}</h2>
                  <span className="text-xs text-muted">{c.status}</span>
                </div>
                {c.descricao && <p className="text-sm text-muted mt-1">{c.descricao}</p>}
              </Link>
            </li>
          ))}
          {casos.length === 0 && <p className="text-muted">Nenhum caso ainda.</p>}
        </ul>
      )}
    </main>
  );
}
