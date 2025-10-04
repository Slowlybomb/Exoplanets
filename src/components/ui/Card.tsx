import type { ReactNode } from "react";

type CardProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  id?: string;
  className?: string;
};

export function Card({ title, description, action, children, id, className }: CardProps): JSX.Element {
  return (
    <section id={id} className={`glass-card space-y-4 ${className ?? ""}`}>
      {(title || description || action) && (
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title ? (
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-slate/70">
                {title}
              </p>
            ) : null}
            {description ? <p className="text-xl font-semibold text-brand-white sm:text-2xl">{description}</p> : null}
          </div>
          {action ? <div className="text-sm text-brand-slate/80">{action}</div> : null}
        </header>
      )}
      <div className="space-y-4 text-sm text-brand-slate/80">{children}</div>
    </section>
  );
}
