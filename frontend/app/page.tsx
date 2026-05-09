import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold mb-4">
          Investigação Documental <span className="text-accent">para Advogados</span>
        </h1>
        <p className="text-lg text-muted mb-8">
          Faça upload dos PDFs do seu caso. Nós convertemos para Markdown,
          corrigimos o OCR, indexamos com IA e construímos um grafo de
          relações navegável — pronto para o Obsidian.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/registro" className="btn">Criar conta</Link>
          <Link href="/login" className="btn-ghost">Entrar</Link>
        </div>
      </div>
      <footer className="absolute bottom-6 text-xs text-muted">
        v0.1 · LGPD-friendly · Markdown soberano
      </footer>
    </main>
  );
}
