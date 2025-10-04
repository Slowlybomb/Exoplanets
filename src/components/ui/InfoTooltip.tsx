import { useId, type ReactNode } from "react";
import { HelpCircle } from "lucide-react";

type InfoTooltipProps = {
  label: string;
  children: ReactNode;
};

export function InfoTooltip({ label, children }: InfoTooltipProps): JSX.Element {
  const tooltipId = useId();

  return (
    <div className="group relative inline-flex">
      <button
        type="button"
        aria-describedby={tooltipId}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-brand-accent/40 bg-brand-indigo/60 text-brand-accent transition hover:bg-brand-accent/10 focus:outline-none focus:ring-2 focus:ring-brand-accent/60"
      >
        <HelpCircle className="h-4 w-4" aria-hidden />
        <span className="sr-only">{label}</span>
      </button>
      <div
        role="tooltip"
        id={tooltipId}
        className="invisible absolute left-1/2 top-full z-20 w-64 -translate-x-1/2 translate-y-2 rounded-2xl border border-brand-slate/40 bg-brand-midnight/95 p-3 text-xs text-brand-slate/80 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
      >
        {children}
      </div>
    </div>
  );
}
