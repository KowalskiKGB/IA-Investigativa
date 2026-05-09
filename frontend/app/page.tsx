import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-8 py-5 flex items-center justify-between">
        <Link href="/" className="brand">
          <span className="brand-mark" />
          <span>Investiga</span>
        </Link>
        <nav className="flex gap-3 items-center">
          <Link href="/login" className="btn-ghost">Entrar</Link>
          <Link href="/registro" className="btn">Criar escritório</Link>
        </nav>
      </header>

      <section className="flex-1 grid place-items-center px-6">
        <div className="max-w-3xl text-center">
          <span className="tag">Inteligência Documental Jurídica</span>
          <h1 className="serif text-5xl md:text-6xl mt-5 leading-tight">
            Da pilha de PDFs <span className="gold">à malha de evidências</span> em minutos.
          </h1>
          <p className="text-lg muted mt-6 max-w-2xl mx-auto">
            Investigação documental assistida por IA para escritórios de advocacia.
            Carregue diários oficiais, processos e documentos: convertemos para Markdown,
            corrigimos o OCR com supervisão humana, indexamos com vetores e desenhamos
            o grafo de pessoas, empresas, órgãos e processos do seu caso.
          </p>
          <div className="flex gap-4 justify-center mt-8 flex-wrap">
            <Link href="/registro" className="btn">Começar agora</Link>
            <Link href="/login" className="btn-ghost">Já tenho conta</Link>
          </div>
          <div className="divider-gold mt-12" />
          <div className="grid md:grid-cols-3 gap-4 mt-8 text-left">
            <div className="card">
              <div className="serif text-xl gold">OCR auditável</div>
              <p className="muted text-sm mt-2">A IA propõe correções; o advogado aprova com a página de origem ao lado.</p>
            </div>
            <div className="card">
              <div className="serif text-xl gold">Chat com fontes</div>
              <p className="muted text-sm mt-2">Toda resposta cita o documento e a página — ideal para defesa e sustentação.</p>
            </div>
            <div className="card">
              <div className="serif text-xl gold">Grafo de relações</div>
              <p className="muted text-sm mt-2">Visualização estilo Obsidian de pessoas, empresas, órgãos e processos do caso.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="text-center py-6 text-xs muted">
        v0.1 · LGPD-friendly · Markdown soberano · isolamento por escritório
      </footer>
    </main>
  );
}
