import { CheckCircle2, XCircle } from "lucide-react";

export default function Toast({ toast }) {
  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-6 z-[200] flex justify-center px-4 transition-all duration-300 ${
        toast ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
      aria-live="polite"
    >
      {toast && (
        <div
          className={`pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-[0_10px_28px_rgba(0,0,0,0.20)] ${
            toast.type === "error" ? "bg-[#B3453F]" : "bg-[#2F2F2F]"
          }`}
        >
          {toast.type === "error" ? (
            <XCircle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}