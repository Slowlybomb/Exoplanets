import type { ReactNode } from "react";
import { ChevronsLeftRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  title: string;
  path: string;
  icon: LucideIcon;
  description?: string;
};

type SidebarProps = {
  items: NavItem[];
  activePath: string;
  onSelect: (item: NavItem) => void;
  footer?: ReactNode;
  collapsed: boolean;
  width: number;
  onToggleCollapse: () => void;
};

export function Sidebar({ items, activePath, onSelect, footer, collapsed, width, onToggleCollapse }: SidebarProps): JSX.Element {
  return (
    <aside
      className="hidden h-screen shrink-0 border-r border-brand-slate/30 bg-brand-midnight/80 backdrop-blur md:flex md:flex-col"
      style={{ width: collapsed ? 80 : width }}
    >
      <div className="flex h-20 items-center gap-3 border-b border-brand-slate/25 px-4">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-slate/40 bg-brand-indigo/60 text-brand-slate/60 transition hover:border-brand-accent/60 hover:text-brand-accent"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronsLeftRight className="h-4 w-4" />
        </button>
        {!collapsed ? (
          <div>
            <p className="text-sm font-semibold text-brand-white">Exoplanet Finder</p>
            <p className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">NASA Archive</p>
          </div>
        ) : null}
      </div>

      <nav className={`flex-1 overflow-y-auto px-3 py-6 ${collapsed ? "" : ""}`}>
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activePath === item.path;

            return (
              <li key={item.path}>
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                    isActive
                      ? "border-brand-accent bg-brand-accent/15 text-brand-white"
                      : "border-transparent text-brand-slate/80 hover:border-brand-accent/50 hover:bg-brand-indigo/50 hover:text-brand-white"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                      isActive
                        ? "border-brand-accent bg-brand-accent/30 text-brand-white"
                        : "border-brand-slate/40 bg-brand-indigo/60 text-brand-slate/70 group-hover:border-brand-accent/60 group-hover:text-brand-accent"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  {!collapsed ? (
                    <span className="flex-1">
                    <span className="block text-sm font-semibold">{item.title}</span>
                    {item.description ? (
                      <span className="block text-xs text-brand-slate/60">{item.description}</span>
                    ) : null}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {footer && !collapsed ? (
        <div className="border-t border-brand-slate/25 px-6 py-4 text-sm text-brand-slate/70">{footer}</div>
      ) : null}
    </aside>
  );
}
