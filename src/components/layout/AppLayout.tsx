import { useCallback, useMemo, useState, type MouseEvent as ReactMouseEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {LayoutDashboard, Orbit, PieChart, Sparkles, Table2, Columns3, Map} from "lucide-react";
import type { ReactNode } from "react";
import { Sidebar, type NavItem } from "./Sidebar";

const navigation: NavItem[] = [
  {
    title: "Overview",
    path: "/overview",
    icon: LayoutDashboard,
    description: "Mission summary"
  },
  {
    title: "Gallery",
    path: "/gallery",
    icon: Sparkles,
    description: "Poster highlights"
  },
  {
    title: "Orbit Lab",
    path: "/orbit",
    icon: Orbit,
    description: "Transit preview"
  },
  {
    title: "Compare",
    path: "/compare",
    icon: Columns3,
    description: "Side-by-side planets"
  },
  {
    title: "Analytics",
    path: "/analytics",
    icon: PieChart,
    description: "Disposition & rankings"
  },
    {
        title: "Star Map",
        path: "/starmap",
        icon: Map,
        description: "Map of stars with KOI data"
    },
];

const fallbackNav = navigation[0]?.path ?? "/overview";

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();

  const activePath = useMemo(() => {
    const current = location.pathname;
    if (current.startsWith("/planet")) {
      return "/gallery";
    }

    const matched = navigation.find((item) => current.startsWith(item.path));
    return matched?.path ?? fallbackNav;
  }, [location.pathname]);

  const [collapsed, setCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isResizing, setIsResizing] = useState(false);

  const handleSelect = useCallback(
    (item: NavItem) => {
      navigate(item.path);
    },
    [navigate]
  );

  const handleResizeStart = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (collapsed) {
        return;
      }

      event.preventDefault();
      setIsResizing(true);
      const startX = event.clientX;
      const startWidth = sidebarWidth;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX;
        const nextWidth = Math.min(Math.max(startWidth + delta, 200), 360);
        setSidebarWidth(nextWidth);
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [collapsed, sidebarWidth]
  );

  return (
    <div className="min-h-screen bg-brand-midnight text-brand-white">
      <div className={`flex min-h-screen ${isResizing ? "select-none" : ""}`}>
        <Sidebar
          items={navigation}
          activePath={activePath}
          onSelect={handleSelect}
          collapsed={collapsed}
          width={sidebarWidth}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
        />

        {!collapsed ? (
          <div
            className="hidden cursor-col-resize border-r border-brand-slate/40 md:block"
            onMouseDown={handleResizeStart}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize sidebar"
            tabIndex={-1}
            style={{ width: 6 }}
          />
        ) : null}

        <div className="flex-1">
          <div className="sticky top-0 z-20 border-b border-brand-slate/25 bg-brand-midnight/80 px-4 py-3 backdrop-blur md:hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Exoplanet Finder</p>
                <p className="text-xs uppercase tracking-[0.3em] text-brand-slate/60">NASA Archive</p>
              </div>
              <nav className="flex items-center gap-2 overflow-x-auto">
                {navigation.map((item) => {
                  const isActive = activePath === item.path;
                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                        isActive ? "bg-brand-accent/20 text-brand-accent" : "bg-brand-indigo/50 text-brand-slate/70"
                      }`}
                    >
                      {item.title}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="relative flex-1 pb-16">{children}</div>
        </div>
      </div>
    </div>
  );
}
