"use client";
import GrafoViewer from "@/components/GrafoViewer";
import { Shell, IconNet } from "@/components/Shell";

export default function GrafoPage() {
  return (
    <Shell crumbs={[{ label: "Grafo geral" }]}>
      <div className="space-y-5 anim-in">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <span className="kicker">Visão consolidada</span>
            <h1 className="h-display text-4xl mt-2 flex items-center gap-3"><IconNet /> Grafo de relações</h1>
            <p className="muted text-sm mt-2 max-w-2xl">Pessoas, empresas, órgãos e processos extraídos dos seus documentos. Use scroll para zoom e arraste nós para reorganizar.</p>
          </div>
        </div>
        <div className="graph-canvas" style={{ minHeight: 640 }}>
          <GrafoViewer />
        </div>
      </div>
    </Shell>
  );
}
