"use client";

import { useEffect, useState, type ReactNode } from "react";

export function CrudModal({
  triggerLabel,
  triggerClassName,
  title,
  children,
}: {
  triggerLabel: string;
  triggerClassName?: string;
  title: string;
  children: (onClose: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        className={
          triggerClassName ??
          "inline-flex min-h-9 items-center border-2 border-border bg-moodi-sky px-3 text-sm font-semibold text-ink hover:brightness-95 active:translate-x-[2px] active:translate-y-[2px]"
        }
        onClick={() => setOpen(true)}
        type="button"
      >
        {triggerLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 pt-[8vh]">
          {/* Backdrop */}
          <div
            aria-hidden
            className="fixed inset-0 bg-foreground/40"
            onClick={close}
          />
          {/* Modal panel */}
          <div
            aria-modal="true"
            className="relative z-10 mb-8 w-full max-w-lg border-2 border-border bg-card p-6 shadow-[6px_6px_0_var(--border)]"
            role="dialog"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="font-pixelify text-xl">{title}</h2>
              <button
                className="grid h-8 w-8 shrink-0 place-items-center border-2 border-border text-lg leading-none hover:bg-muted"
                onClick={close}
                type="button"
              >
                ×
              </button>
            </div>
            {children(close)}
          </div>
        </div>
      )}
    </>
  );
}
