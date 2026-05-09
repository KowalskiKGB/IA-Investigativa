"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import GrafoViewer from "@/components/GrafoViewer";

export default function GrafoCasoPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <main className="max-w-7xl mx-auto p-6">
      <header className="flex justify-between mb-4">
        <Link href={`/casos/${id}`} className="text-muted text-sm">← Voltar ao caso</Link>
        <h1 className="text-2xl font-bold">🕸️ Grafo</h1>
        <span />
      </header>
      <GrafoViewer />
    </main>
  );
}
