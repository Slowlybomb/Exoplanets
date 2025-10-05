import { useId, useState, type ReactNode } from "react";
import { HelpCircle } from "lucide-react";
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
  useHover,
  useFocus,
  useRole,
  useDismiss,
  useInteractions,
  FloatingPortal,
  FloatingFocusManager
} from "@floating-ui/react";

type InfoTooltipProps = {
  label: string;
  children: ReactNode;
};

export function InfoTooltip({ label, children }: InfoTooltipProps): JSX.Element {
  const tooltipId = useId();
  const [open, setOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
    placement: "top"
  });

  const hover = useHover(context, { move: false, delay: { open: 100 } });
  const focus = useFocus(context);
  const role = useRole(context, { role: "tooltip" });
  const dismiss = useDismiss(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, role, dismiss]);

  return (
    <div className="inline-flex">
      <button
        type="button"
        aria-describedby={tooltipId}
        ref={refs.setReference}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-brand-accent/40 bg-brand-indigo/60 text-brand-accent transition hover:bg-brand-accent/10 focus:outline-none focus:ring-2 focus:ring-brand-accent/60"
        {...getReferenceProps()}
      >
        <HelpCircle className="h-4 w-4" aria-hidden />
        <span className="sr-only">{label}</span>
      </button>
      {open ? (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false} visuallyHiddenDismiss>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              role="tooltip"
              id={tooltipId}
              className="z-[999] w-64 rounded-2xl border border-brand-slate/40 bg-brand-midnight/95 p-3 text-xs text-brand-slate/80 shadow-lg"
              {...getFloatingProps()}
            >
              {children}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      ) : null}
    </div>
  );
}
