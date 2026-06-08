import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Info, X } from "lucide-react";

type DialogVariant = "info" | "success" | "warning" | "danger";
type DialogKind = "alert" | "confirm";

interface DialogRequest {
  id: string;
  kind: DialogKind;
  title: string;
  message: string;
  variant: DialogVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  resolve: (value: boolean) => void;
}

type DialogEvent = CustomEvent<Omit<DialogRequest, "id">>;

const emitDialog = (request: Omit<DialogRequest, "id">) => {
  window.dispatchEvent(new CustomEvent("oncodb-dialog", { detail: request }));
};

export const notify = (message: string, title = "Notification", variant: DialogVariant = "info") => {
  return new Promise<void>((resolve) => {
    emitDialog({
      kind: "alert",
      title,
      message,
      variant,
      confirmLabel: "OK",
      resolve: () => resolve(),
    });
  });
};

export const confirmDialog = (
  message: string,
  title = "Confirm Action",
  variant: DialogVariant = "warning",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel"
) => {
  return new Promise<boolean>((resolve) => {
    emitDialog({
      kind: "confirm",
      title,
      message,
      variant,
      confirmLabel,
      cancelLabel,
      resolve,
    });
  });
};

const variantStyles: Record<DialogVariant, { icon: React.ReactNode; tone: string; button: string }> = {
  info: {
    icon: <Info className="h-5 w-5" />,
    tone: "text-[#5B6B52] bg-[#7A8C70]/10 border-[#7A8C70]/25",
    button: "bg-[#7A8C70] hover:bg-[#68785E] text-white",
  },
  success: {
    icon: <CheckCircle className="h-5 w-5" />,
    tone: "text-emerald-700 bg-emerald-500/10 border-emerald-500/25",
    button: "bg-emerald-700 hover:bg-emerald-800 text-white",
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5" />,
    tone: "text-amber-700 bg-amber-500/10 border-amber-500/25",
    button: "bg-amber-700 hover:bg-amber-800 text-white",
  },
  danger: {
    icon: <AlertTriangle className="h-5 w-5" />,
    tone: "text-rose-700 bg-rose-500/10 border-rose-500/25",
    button: "bg-rose-700 hover:bg-rose-800 text-white",
  },
};

export function AppDialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogRequest | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const onDialog = (event: Event) => {
      const detail = (event as DialogEvent).detail;
      setIsClosing(false);
      setDialog({
        ...detail,
        id: `dialog_${Date.now()}`,
      });
    };
    window.addEventListener("oncodb-dialog", onDialog);
    return () => window.removeEventListener("oncodb-dialog", onDialog);
  }, []);

  const close = (value: boolean) => {
    if (!dialog) return;
    const currentDialog = dialog;
    setIsClosing(true);
    window.setTimeout(() => {
      currentDialog.resolve(value);
      setDialog(null);
      setIsClosing(false);
    }, 170);
  };

  return (
    <>
      {children}
      {dialog && (
        <div className={`fixed inset-0 z-[100] bg-slate-950/45 backdrop-blur-[2px] flex items-center justify-center p-4 ${isClosing ? "premium-dialog-backdrop-out" : "premium-dialog-backdrop-in"}`}>
          <div className={`w-full max-w-md rounded-2xl bg-[#F7F6F2] dark:bg-slate-900 border border-[#D9D5CB] dark:border-slate-700 shadow-[0_28px_90px_-38px_rgba(15,23,42,0.7),0_1px_0_rgba(255,255,255,0.65)_inset] dark:shadow-[0_30px_100px_-42px_rgba(0,0,0,0.9),0_1px_0_rgba(255,255,255,0.08)_inset] overflow-hidden ${isClosing ? "premium-dialog-out" : "premium-dialog-in"}`}>
            <div className="p-5 flex items-start gap-3">
              <div className={`premium-icon-tile h-10 w-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${variantStyles[dialog.variant].tone}`}>
                {variantStyles[dialog.variant].icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-bold text-slate-850 dark:text-white ">{dialog.title}</h3>
                  <button
                    type="button"
                    onClick={() => close(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Close dialog"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 text-xs leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-250">{dialog.message}</p>
              </div>
            </div>
            <div className="px-5 py-4 bg-white/45 dark:bg-slate-950/30 border-t border-[#D9D5CB]/70 dark:border-slate-800 flex justify-end gap-2">
              {dialog.kind === "confirm" && (
                <button
                  type="button"
                  onClick={() => close(false)}
                  className="px-4 py-2 rounded-xl border border-[#D9D5CB] dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-250 hover:bg-white dark:hover:bg-slate-800"
                >
                  {dialog.cancelLabel || "Cancel"}
                </button>
              )}
              <button
                type="button"
                onClick={() => close(true)}
                className={`px-4 py-2 rounded-xl text-xs font-bold ${variantStyles[dialog.variant].button}`}
              >
                {dialog.confirmLabel || "OK"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
