"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Shell, IconCog, IconSpark, IconCheck } from "@/components/Shell";

const PROVIDERS = [
  { value: "pollinations", label: "Pollinations", note: "Gratuito, público. Ideal para testes — sem chave." },
  { value: "anthropic", label: "Anthropic Claude", note: "Requer ANTHROPIC_API_KEY. Excelente raciocínio." },
  { value: "openai", label: "OpenAI", note: "Requer OPENAI_API_KEY. GPT-4o e variantes." },
  { value: "groq", label: "Groq", note: "Requer GROQ_API_KEY. Llama 3.3 70B ultrarrápido." },
  { value: "openrouter", label: "OpenRouter", note: "Requer OPENROUTER_API_KEY. Multi-modelo." },
];

export default function AdminConfig() {
  const [cfg, setCfg] = useState<any>({});
  const [salvo, setSalvo] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => { api<any>("/admin/config").then(setCfg).catch(() => {}); }, []);

  function on(k: string, v: string) { setCfg({ ...cfg, [k]: v }); setSalvo(false); }

  async function salvar() {
    setSalvando(true);
    try {
      await api("/admin/config", { method: "POST", body: JSON.stringify(cfg) });
      setSalvo(true);
      const c = await api<any>("/admin/config");
      setCfg(c);
    } finally { setSalvando(false); }
  }

  const provedor = cfg.llm_provider || "pollinations";
  const meta = PROVIDERS.find(p => p.value === provedor);

  return (
    <Shell crumbs={[{ label: "Painel", href: "/admin" }, { label: "Configurar IA" }]}>
      <div className="space-y-6 anim-in max-w-3xl">
        <div>
          <span className="kicker">Inteligência</span>
          <h1 className="h-display text-4xl mt-2">Configurar IA</h1>
          <p className="muted text-sm mt-2">Escolha o provedor LLM, modelo e chaves. As chaves ficam armazenadas no banco e não são expostas na UI após salvas.</p>
        </div>

        <section className="card-elev space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <IconSpark />
            <h2 className="serif text-xl gold">Provedor & modelo</h2>
          </div>
          <label className="block">
            <span className="field-label">Provedor</span>
            <select className="input" value={provedor}
              onChange={(e) => on("llm_provider", e.target.value)}>
              {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            {meta && <p className="muted text-xs mt-2">{meta.note}</p>}
          </label>

          <label className="block">
            <span className="field-label">Modelo (opcional)</span>
            <input className="input" placeholder="ex: claude-3-5-sonnet-latest, gpt-4o, llama-3.3-70b-versatile"
              value={cfg.llm_model || ""} onChange={(e) => on("llm_model", e.target.value)} />
          </label>
        </section>

        <section className="card-elev space-y-4">
          <h2 className="serif text-xl gold flex items-center gap-2"><IconCog /> Chaves de API</h2>
          <p className="muted text-xs">Deixe em branco para manter a chave atual. O placeholder mostra o valor atual mascarado.</p>
          {(["anthropic_api_key", "openai_api_key", "groq_api_key", "openrouter_api_key"] as const).map((k) => (
            <label key={k} className="block">
              <span className="field-label">{k.replace("_api_key", "").toUpperCase()}</span>
              <input className="input" placeholder={cfg[k] || "—"} type="password"
                onChange={(e) => on(k, e.target.value)} />
            </label>
          ))}
        </section>

        <section className="card-elev">
          <h2 className="serif text-xl gold mb-3">Prompt do sistema</h2>
          <p className="muted text-xs mb-3">Override opcional. Deixe em branco para usar o prompt-base do sistema (cita fonte e página).</p>
          <textarea className="textarea" rows={6} placeholder="Você é um assistente jurídico investigativo..."
            value={cfg.system_prompt_override || ""}
            onChange={(e) => on("system_prompt_override", e.target.value)} />
        </section>

        <div className="flex items-center gap-3 sticky bottom-3 z-10">
          <button className="btn" onClick={salvar} disabled={salvando}>
            {salvando ? <><span className="spinner" /> Salvando…</> : <><IconCheck /> Salvar configuração</>}
          </button>
          {salvo && <span className="alert alert-ok"><IconCheck /> Configuração salva.</span>}
        </div>
      </div>
    </Shell>
  );
}
