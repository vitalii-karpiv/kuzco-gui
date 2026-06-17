"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft } from "lucide-react";

import { kuzcoService } from "@/shared/api/kuzco-service";
import type { KuzcoState } from "@/shared/domain/kuzco";

import { NAV_GROUPS } from "./nav-config";

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [systemState, setSystemState] = useState<KuzcoState | null>(null);

  useEffect(() => {
    kuzcoService
      .getState()
      .then((kuzco) => setSystemState(kuzco.state))
      .catch(() => {
        // silent fail — sidebar is not the right place for error messages
      });
  }, []);

  // Running index across all groups so the load-in stagger flows top-to-bottom.
  let order = 0;

  return (
    <aside
      data-collapsed={collapsed}
      className="gc-scroll group/side sticky top-0 flex h-dvh shrink-0 flex-col overflow-y-auto border-r border-hairline bg-graphite text-ink-dark transition-[width] duration-300 ease-out data-[collapsed=true]:w-[72px] data-[collapsed=false]:w-64"
    >
      {/* Wordmark */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-5">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent font-display text-lg font-extrabold text-graphite">
          K
        </span>
        {!collapsed && (
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg font-extrabold tracking-tight text-ink-dark">
              KUZCO
            </span>
            <span className="mt-1 font-mono text-[10px] tracking-[0.2em] text-accent">
              {"// OPS"}
            </span>
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        {NAV_GROUPS.map((groupItem) => (
          <div key={groupItem.title} className="mb-6">
            {!collapsed && (
              <p className="px-3 pb-2 font-mono text-[10px] font-medium tracking-[0.22em] text-muted-console/70 uppercase">
                {groupItem.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {groupItem.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                const delay = order++ * 40;
                return (
                  <li
                    key={item.href}
                    className="animate-nav-in"
                    style={{ animationDelay: `${delay}ms` }}
                  >
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      data-active={active}
                      className="group/link relative flex items-center gap-3 rounded-lg px-3 py-2 font-mono text-[13px] tracking-tight text-muted-console transition-all duration-150 hover:translate-x-0.5 hover:bg-panel hover:text-ink-dark data-[active=true]:bg-accent-dim data-[active=true]:text-ink-dark"
                    >
                      {/* active left-bar */}
                      <span className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r bg-accent opacity-0 transition-opacity group-data-[active=true]/link:opacity-100" />
                      <Icon
                        className="size-[18px] shrink-0 transition-colors group-data-[active=true]/link:text-accent"
                        strokeWidth={2}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* System status pill — links to /admin/system */}
      <div className="px-3 pb-3">
        <Link
          href="/admin/system"
          title={collapsed ? (systemState === "readonly" ? "Лише читання" : "Система активна") : undefined}
          className="flex items-center gap-2 rounded-lg border border-hairline bg-panel/60 px-3 py-2 transition-colors hover:bg-panel"
        >
          {systemState === null && (
            <span className="relative flex size-2 shrink-0">
              <span className="relative inline-flex size-2 rounded-full bg-muted-console/40" />
            </span>
          )}
          {systemState === "active" && (
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-accent" />
            </span>
          )}
          {systemState === "readonly" && (
            <span className="relative flex size-2 shrink-0">
              <span className="relative inline-flex size-2 rounded-full bg-amber-400" />
            </span>
          )}
          {!collapsed && (
            <span
              className={`truncate font-mono text-[10px] tracking-[0.15em] uppercase ${
                systemState === "readonly"
                  ? "text-amber-400"
                  : "text-muted-console"
              }`}
            >
              {systemState === null && "…"}
              {systemState === "active" && "Система активна"}
              {systemState === "readonly" && "Лише читання"}
            </span>
          )}
        </Link>
      </div>

      {/* Collapse toggle */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Розгорнути меню" : "Згорнути меню"}
        className="flex items-center gap-3 border-t border-hairline px-5 py-3 font-mono text-[11px] tracking-[0.15em] text-muted-console uppercase transition-colors hover:text-ink-dark"
      >
        <ChevronsLeft
          className="size-[18px] shrink-0 transition-transform duration-300 data-[flip=true]:rotate-180"
          data-flip={collapsed}
        />
        {!collapsed && <span>Згорнути</span>}
      </button>
    </aside>
  );
}
