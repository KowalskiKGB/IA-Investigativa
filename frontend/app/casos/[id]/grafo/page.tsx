"use client";
import { useParams } from "next/navigation";
import GrafoViewer from "@/components/GrafoViewer";
import { Shell, IconNet } from "@/components/Shell";

export default function GrafoCasoPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <Shell crumbs={[{ label: "Casos", href: "/casos" }, { label: "Caso", href: `/casos/${id}` }, { label: "Grafo" }]}>
      <div className="space-y-5 anim-in">
        <div>
          <span className="kicker">Caso</span>
          <h1 className="h-display text-4xl mt-2 flex items-center gap-3"><IconNet /> Grafo do caso</h1>
          <p className="muted text-sm mt-2">Entidades extraídas exclusivamente dos documentos deste caso.</p>
        </div>
        <div className="graph-canvas" style={{ minHeight: 640 }}>
          <GrafoViewer />
        </div>
      </div>
    </Shell>
  );
}
