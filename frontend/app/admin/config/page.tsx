"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

const PROVIDERS = [
  { value: "pollinations", label: "Pollinations (gratuito, público)", note: "Sem chave. Ideal para testes." },
  { value: "anthropic", label: "Anthropic Claude", note: "Requer ANTHROPIC_API_KEY." },
  { value: "openai", label: "OpenAI", note: "Requer OPENAI_API_KEY." },
  { value: "groq", label: "Groq (Llama 3.3 70B)", note: "Requer GROQ_API_KEY." },
  { value: "openrouter", label: "OpenRouter", note: "Requer OPENROUTER_API_KEY." },
];

export default function AdminConfig() {
  const [cfg, setCfg] = useState<any>({});
  const [salvo, setSalvo] = useState(false);

  useEffect(() => { api<any>("/admin/config").then(setCfg).catch(() => {}); }, []);

  function on(k: string, v: string) { setCfg({ ...cfg, [k]: v }); setSalvo(false); }

  async function salvar() {
    await api("/admin/config", { method: "POST", body: JSON.stringify(cfg) });
    setSalvo(true);
    const c = await api<any>("/admin/config");
    setCfg(c);
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <Link href="/admin" className="muted text-sm">← Painel</Link>
      <h1 className="serif text-3xl">Configurar IA</h1>
      <p className="muted text-sm">Escolha o provedor e modelo. Chaves ficam armazenadas no banco.</p>
      <div className="divider-gold" />

      <section className="card-elev space-y-4">
        <label className="block">
          <div className="muted text-xs uppercase tracking-widest mb-1">Provedor</div>
          <select className="input" value={cfg.llm_provider || "pollinations"}
            onChange={(e) => on("llm_provider", e.target.value)}>
            {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <p className="muted text-xs mt-1">
            {PROVIDERS.find(p => p.value === (cfg.llm_provider || "pollinations"))?.note}
          </p>
        </label>

        <label className="block">
          <div className="muted text-xs uppercase tracking-widest mb-1">Modelo (opcional)</div>
          <input className="input" value={cfg.llm_model || ""} onChange={(e) => on("llm_model", e.target.value)} />
        </label>

        {(["anthropic_api_key", "openai_api_key", "groq_api_key", "openrouter_api_key"] as const).map((k) => (
          <label key={k} className="block">
            <div className="muted text-xs uppercase tracking-widest mb-1">{k}</div>
            <input className="input" placeholder={cfg[k] || "—"}
              onChange={(e) => on(k, e.target.value)} />
          </label>
        ))}

        <label className="block">
          <div className="muted text-xs uppercase tracking-widest mb-1">Prompt do sistema (override)</div>
          <textarea className="input" rows={5} value={cfg.system_prompt_override || ""}
            onChange={(e) => on("system_prompt_override", e.target.value)} />
        </label>

        <button className="btn" onClick={salvar}>Salvar configuração</button>
        {salvo && <p className="text-sm" style={{ color: "var(--ok)" }}>✓ Salvo.</p>}
      </section>
    </main>
  );
}
