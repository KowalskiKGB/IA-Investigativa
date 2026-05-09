"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import cytoscape from "cytoscape";
// @ts-ignore
import coseBilkent from "cytoscape-cose-bilkent";
import { api } from "@/lib/api";

if (typeof window !== "undefined") {
  try { cytoscape.use(coseBilkent); } catch {}
}

const CytoscapeComponent: any = dynamic(() => import("react-cytoscapejs"), { ssr: false });

type Grafo = {
  nos: { id: string; label: string; tipo: string; identificador: string | null }[];
  arestas: { source: string; target: string; tipo: string; pagina: number | null; documento: string | null }[];
};

const CORES_TIPO: Record<string, string> = {
  pessoa: "#7f6df2",
  empresa: "#f2c46d",
  orgao: "#6df2c4",
  processo: "#f26d8a",
  valor: "#9af26d",
  outro: "#888",
};

export default function GrafoViewer({ grafo }: { grafo?: Grafo }) {
  const [data, setData] = useState<Grafo | null>(grafo ?? null);
  const [selecao, setSelecao] = useState<any>(null);
  const cyRef = useRef<any>(null);

  useEffect(() => {
    if (data) return;
    api<Grafo>("/grafo").then(setData).catch(console.error);
  }, [data]);

  const elementos = useMemo(() => {
    if (!data) return [];
    return [
      ...data.nos.map((n) => ({
        data: { id: n.id, label: n.label, tipo: n.tipo, ident: n.identificador },
      })),
      ...data.arestas.map((a, i) => ({
        data: {
          id: `e${i}`, source: a.source, target: a.target, label: a.tipo,
          pagina: a.pagina, documento: a.documento,
        },
      })),
    ];
  }, [data]);

  const stylesheet: any[] = [
    {
      selector: "node",
      style: {
        "background-color": (n: any) => CORES_TIPO[n.data("tipo")] || CORES_TIPO.outro,
        label: "data(label)",
        color: "#dcddde",
        "font-size": 11,
        "text-valign": "bottom", "text-halign": "center", "text-margin-y": 6,
        width: 28, height: 28,
        "border-width": 2, "border-color": "#1e1e1e",
        "transition-property": "width height background-color",
        "transition-duration": 200,
      },
    },
    {
      selector: "node:selected",
      style: { width: 40, height: 40, "border-color": "#fff" },
    },
    {
      selector: "edge",
      style: {
        width: 1.5,
        "line-color": "#3a3a3a",
        "target-arrow-color": "#3a3a3a",
        "target-arrow-shape": "triangle",
        "curve-style": "bezier",
        label: "data(label)",
        "font-size": 9, color: "#8a8a8a",
        "text-rotation": "autorotate",
        "text-background-color": "#1e1e1e",
        "text-background-opacity": 1, "text-background-padding": 2,
      },
    },
    { selector: ":parent", style: { "background-opacity": 0.1 } },
  ];

  if (!data) return <div className="text-muted p-6">Carregando grafo...</div>;
  if (data.nos.length === 0)
    return <div className="text-muted p-6">Ainda não há entidades. Faça upload de documentos.</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div className="lg:col-span-3 graph-canvas rounded-lg border border-edge" style={{ height: 700 }}>
        <CytoscapeComponent
          elements={elementos}
          stylesheet={stylesheet}
          layout={{ name: "cose-bilkent", nodeRepulsion: 8000, idealEdgeLength: 100, animate: true }}
          style={{ width: "100%", height: "100%" }}
          cy={(cy: any) => {
            cyRef.current = cy;
            cy.on("tap", "node, edge", (evt: any) => setSelecao(evt.target.data()));
            cy.on("tap", (evt: any) => { if (evt.target === cy) setSelecao(null); });
          }}
        />
      </div>
      <aside className="card text-sm">
        <h3 className="font-bold mb-2">Detalhes</h3>
        {selecao ? (
          <pre className="text-xs whitespace-pre-wrap break-all">
            {JSON.stringify(selecao, null, 2)}
          </pre>
        ) : (
          <p className="text-muted">Clique num nó ou aresta.</p>
        )}
        <hr className="my-3 border-edge" />
        <h4 className="font-semibold text-xs mb-2">Legenda</h4>
        <ul className="text-xs space-y-1">
          {Object.entries(CORES_TIPO).map(([t, c]) => (
            <li key={t} className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full" style={{ background: c }} />
              {t}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">
          {data.nos.length} entidades · {data.arestas.length} relações
        </p>
      </aside>
    </div>
  );
}
