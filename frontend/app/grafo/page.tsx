"use client";
import Link from "next/link";
import GrafoViewer from "@/components/GrafoViewer";

export default function GrafoPage() {
  return (
    <main className="max-w-7xl mx-auto p-6">
      <header className="flex justify-between mb-4">
        <Link href="/casos" className="text-muted text-sm">← Voltar</Link>
        <h1 className="text-2xl font-bold">🕸️ Grafo de Relações</h1>
        <span />
      </header>
      <GrafoViewer />
    </main>
  );
}
