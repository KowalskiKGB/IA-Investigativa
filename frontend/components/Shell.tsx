"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, clearToken, hasToken } from "@/lib/api";

type Me = { id: string; nome: string; email: string; is_admin: boolean; role?: string };

export type Crumb = { label: string; href?: string };

export function Shell({
  children,
  crumbs,
  actions,
}: {
  children: React.ReactNode;
  crumbs?: Crumb[];
  actions?: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    if (!hasToken()) { router.replace("/login"); return; }
    api<Me>("/auth/me").then(setMe).catch(() => { clearToken(); router.replace("/login"); });
  }, [router]);

  function sair() { clearToken(); router.replace("/login"); }

  const isAdmin = !!me?.is_admin;

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link href={isAdmin ? "/admin" : "/casos"} className="brand mb-6 px-2">
          <span className="brand-mark" />
          <span>Investiga</span>
        </Link>

        <div className="nav-section">Investigação</div>
        <NavLink href="/casos" icon={IconFolder} active={pathname?.startsWith("/casos")}>Casos</NavLink>
        <NavLink href="/grafo" icon={IconNet} active={pathname === "/grafo"}>Grafo geral</NavLink>

        {isAdmin && <>
          <div className="nav-section">Administração</div>
          <NavLink href="/admin" icon={IconDash} active={pathname === "/admin"}>Painel</NavLink>
          <NavLink href="/admin/clientes" icon={IconBuilding} active={pathname?.startsWith("/admin/clientes")}>Escritórios</NavLink>
          <NavLink href="/admin/usuarios/novo" icon={IconUserPlus} active={pathname?.startsWith("/admin/usuarios")}>Novo usuário</NavLink>
          <NavLink href="/admin/config" icon={IconCog} active={pathname?.startsWith("/admin/config")}>IA & Config</NavLink>
        </>}

        <div className="nav-section">Conta</div>
        <button onClick={sair} className="nav-item w-full text-left">
          <IconExit className="nav-icon" />
          <span>Sair</span>
        </button>

        <div style={{ marginTop: "1.4rem", padding: "0.85rem", borderRadius: 10, border: "1px solid var(--line)", background: "rgba(212,184,118,0.04)" }}>
          <div className="text-xs muted truncate">{me?.email || "—"}</div>
          <div className="text-sm" style={{ fontWeight: 600 }}>{me?.nome || <span className="skel" style={{ display: "inline-block", width: 80, height: 14 }} />}</div>
          {isAdmin && <span className="tag tag-info" style={{ marginTop: 6 }}>Admin</span>}
        </div>
      </aside>

      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header className="topbar">
          <nav className="crumb">
            {crumbs?.map((c, i) => (
              <span key={i}>
                {i > 0 && <span className="sep">/</span>}
                {c.href ? <Link href={c.href}>{c.label}</Link> : <span style={{ color: "var(--ink)" }}>{c.label}</span>}
              </span>
            ))}
          </nav>
          <div className="flex gap-2 items-center">{actions}</div>
        </header>

        <main className="flex-1" style={{ padding: "1.6rem 1.6rem 3rem" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

function NavLink({ href, children, active, icon: Icon }: { href: string; children: React.ReactNode; active?: boolean; icon: any }) {
  return (
    <Link href={href} className={`nav-item ${active ? "active" : ""}`}>
      <Icon className="nav-icon" />
      <span>{children}</span>
    </Link>
  );
}

/* ---------- inline SVG icons ---------- */
const baseIconProps = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
export function IconFolder(p: any) { return <svg {...baseIconProps} {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" /></svg>; }
export function IconNet(p: any) { return <svg {...baseIconProps} {...p}><circle cx="6" cy="6" r="2" /><circle cx="18" cy="6" r="2" /><circle cx="12" cy="18" r="2" /><circle cx="12" cy="12" r="2" /><path d="M7.5 6.5l3 4M16.5 6.5l-3 4M12 14v2" /></svg>; }
export function IconDash(p: any) { return <svg {...baseIconProps} {...p}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>; }
export function IconBuilding(p: any) { return <svg {...baseIconProps} {...p}><path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" /><path d="M16 9h2a2 2 0 0 1 2 2v10" /><path d="M8 7h2M8 11h2M8 15h2M12 7h2M12 11h2M12 15h2" /></svg>; }
export function IconUserPlus(p: any) { return <svg {...baseIconProps} {...p}><circle cx="9" cy="8" r="4" /><path d="M3 21v-1a6 6 0 0 1 12 0v1" /><path d="M19 8v6M16 11h6" /></svg>; }
export function IconCog(p: any) { return <svg {...baseIconProps} {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>; }
export function IconExit(p: any) { return <svg {...baseIconProps} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></svg>; }
export function IconUpload(p: any) { return <svg {...baseIconProps} {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5M12 3v12" /></svg>; }
export function IconSearch(p: any) { return <svg {...baseIconProps} {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>; }
export function IconPlus(p: any) { return <svg {...baseIconProps} {...p}><path d="M12 5v14M5 12h14" /></svg>; }
export function IconDoc(p: any) { return <svg {...baseIconProps} {...p}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6M9 13h6M9 17h6M9 9h2" /></svg>; }
export function IconChat(p: any) { return <svg {...baseIconProps} {...p}><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>; }
export function IconUsers(p: any) { return <svg {...baseIconProps} {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>; }
export function IconArrowLeft(p: any) { return <svg {...baseIconProps} {...p}><path d="M19 12H5M12 19l-7-7 7-7" /></svg>; }
export function IconCheck(p: any) { return <svg {...baseIconProps} {...p}><path d="m20 6-11 11-5-5" /></svg>; }
export function IconShield(p: any) { return <svg {...baseIconProps} {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>; }
export function IconSpark(p: any) { return <svg {...baseIconProps} {...p}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /><circle cx="12" cy="12" r="3" /></svg>; }
