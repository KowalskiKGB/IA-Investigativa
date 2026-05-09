"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { Shell, IconUserPlus, IconCheck } from "@/components/Shell";

export default function AdminNovoUsuario() {
  const [form, setForm] = useState<any>({
    nome: "", email: "", senha: "", role: "membro",
    is_admin: false, plano: "solo", nome_escritorio: "",
  });
  const [ok, setOk] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null); setOk(false); setSalvando(true);
    try {
      await api("/admin/usuarios", { method: "POST", body: JSON.stringify(form) });
      setOk(true);
      setForm({ ...form, nome: "", email: "", senha: "" });
    } catch (e: any) {
      setErro(e.message);
    } finally { setSalvando(false); }
  }

  function on(k: string, v: any) { setForm({ ...form, [k]: v }); }

  return (
    <Shell crumbs={[{ label: "Painel", href: "/admin" }, { label: "Novo usuário" }]}>
      <div className="max-w-2xl space-y-6 anim-in">
        <div>
          <span className="kicker">Acesso</span>
          <h1 className="h-display text-4xl mt-2">Criar usuário</h1>
          <p className="muted text-sm mt-2">Crie em escritório existente (deixe nome do escritório vazio) ou crie um escritório novo simultaneamente.</p>
        </div>

        <form onSubmit={salvar} className="card-elev space-y-5">
          <section className="space-y-3">
            <h3 className="serif text-lg gold">Escritório</h3>
            <div>
              <label className="field-label">Nome do escritório (vazio = usar existente)</label>
              <input className="input" placeholder="Silva & Associados"
                value={form.nome_escritorio} onChange={(e) => on("nome_escritorio", e.target.value)} />
            </div>
            <div>
              <label className="field-label">Plano</label>
              <select className="input" value={form.plano} onChange={(e) => on("plano", e.target.value)}>
                <option value="solo">Solo</option>
                <option value="escritorio">Escritório</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </section>

          <div className="divider-gold" />

          <section className="space-y-3">
            <h3 className="serif text-lg gold">Usuário</h3>
            <div>
              <label className="field-label">Nome</label>
              <input className="input" placeholder="Dr. João Silva" required
                value={form.nome} onChange={(e) => on("nome", e.target.value)} />
            </div>
            <div>
              <label className="field-label">E-mail</label>
              <input className="input" type="email" placeholder="joao@silva.adv.br" required
                value={form.email} onChange={(e) => on("email", e.target.value)} />
            </div>
            <div>
              <label className="field-label">Senha</label>
              <input className="input" type="password" placeholder="••••••••" required
                value={form.senha} onChange={(e) => on("senha", e.target.value)} />
            </div>
            <div>
              <label className="field-label">Papel</label>
              <select className="input" value={form.role} onChange={(e) => on("role", e.target.value)}>
                <option value="membro">Membro</option>
                <option value="admin">Admin (do escritório)</option>
              </select>
            </div>
            <label className="flex items-center gap-2.5 text-sm cursor-pointer mt-2">
              <input type="checkbox" checked={form.is_admin} onChange={(e) => on("is_admin", e.target.checked)} />
              <span>Administrador da plataforma (acesso total)</span>
            </label>
          </section>

          {ok && <div className="alert alert-ok"><IconCheck /> Usuário criado com sucesso.</div>}
          {erro && <div className="alert alert-error"><strong>✕</strong> {erro}</div>}

          <button className="btn" disabled={salvando}>
            {salvando ? <><span className="spinner" /> Criando…</> : <><IconUserPlus /> Criar usuário</>}
          </button>
        </form>
      </div>
    </Shell>
  );
}
