import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function Modal({ open, title, children, actions }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6">
      <div className="glass-strong w-full max-w-xl rounded-3xl p-6 shadow-soft animate-fadeInUp">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-ink-800">{title}</h2>
        </div>
        <div className="mt-4 text-sm text-ink-500">{children}</div>
        {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </div>
  );
}
