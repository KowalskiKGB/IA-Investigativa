"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { hasToken } from "@/lib/api";

export default function Home() {
  const [logged, setLogged] = useState(false);
  useEffect(() => { setLogged(hasToken()); }, []);

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="hero-grid" />
      <div className="hero-mesh" />

      <header className="px-8 py-5 flex items-center justify-between relative z-10">
        <Link href="/" className="brand">
          <span className="brand-mark" />
          <span>Investiga</span>
        </Link>
        <nav className="flex gap-3 items-center">
          {logged ? (
            <Link href="/casos" className="btn">Entrar no painel</Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">Entrar</Link>
              <Link href="/registro" className="btn">Criar escritório</Link>
            </>
          )}
        </nav>
      </header>

      <section className="flex-1 grid place-items-center px-6 relative z-10">
        <div className="max-w-4xl text-center py-12">
          <span className="kicker anim-in">Inteligência Documental Jurídica</span>
          <h1 className="h-display text-5xl md:text-7xl mt-6 anim-in-1">
            Da pilha de PDFs <br className="hidden md:block" />
            <span className="gradient-text">à malha de evidências</span>
          </h1>
          <p className="text-lg muted mt-7 max-w-2xl mx-auto leading-relaxed anim-in-2">
            Investigação documental assistida por IA para escritórios de advocacia.
            Carregue diários oficiais, processos e provas: convertemos para Markdown auditável,
            corrigimos OCR com supervisão humana, indexamos com vetores e desenhamos
            o grafo de pessoas, empresas, órgãos e processos do seu caso.
          </p>
          <div className="flex gap-3 justify-center mt-10 flex-wrap anim-in-3">
            {logged ? (
              <Link href="/casos" className="btn">Ir para meus casos →</Link>
            ) : (
              <>
                <Link href="/registro" className="btn">Começar gratuitamente</Link>
                <Link href="/login" className="btn-ghost">Já tenho conta</Link>
              </>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-20 text-left anim-in-4">
            <Feature
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6M9 13h6M9 17h6" /></svg>}
              title="OCR auditável"
              desc="A IA propõe correções; o advogado aprova com a página de origem ao lado, em diff revisável."
            />
            <Feature
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>}
              title="Chat com fontes"
              desc="Toda resposta cita documento e página — ideal para defesa, sustentação oral e relatórios."
            />
            <Feature
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="12" cy="18" r="2.5" /><circle cx="12" cy="12" r="2.5" /><path d="M7.5 6.5l3 4M16.5 6.5l-3 4M12 14v2" /></svg>}
              title="Grafo de relações"
              desc="Visualização interativa de pessoas, empresas, órgãos e processos. Encontre pontes ocultas."
            />
          </div>
        </div>
      </section>

      <footer className="text-center py-8 text-xs muted relative z-10">
        v0.1 · LGPD-friendly · Markdown soberano · isolamento por escritório
      </footer>
    </main>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="card card-hover">
      <div className="feat-icon">{icon}</div>
      <div className="serif text-xl gold">{title}</div>
      <p className="muted text-sm mt-2 leading-relaxed">{desc}</p>
    </div>
  );
}
