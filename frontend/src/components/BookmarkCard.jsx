import { Trash2, ExternalLink } from "lucide-react";

export default function BookmarkCard({
  title,
  snippet,
  sourceLabel = "G",
  sourceTag,
  onDelete,
  onOpen,
}) {
  return (
    <div className="relative my-2">
      <div
        className="group relative rounded-xl border border-[#b94444] bg-[#fdfaf7] px-4 py-3 shadow-sm"
        style={{
          clipPath: "polygon(0 0, 96% 0, 100% 50%, 96% 100%, 0 100%)",
        }}
      >
        {/* Top row: source initial + title + optional tag */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1f7a4d] text-xs font-semibold text-white">
              {sourceLabel}
            </div>
            <div className="text-sm font-semibold text-[#333333]">{title}</div>
          </div>

          {sourceTag && (
            <span className="rounded-full bg-[#1f7a4d] px-3 py-1 text-xs font-semibold text-white">
              {sourceTag}
            </span>
          )}
        </div>

        {/* Snippet bubble */}
        <div className="mt-2 rounded-lg bg-[#f1f1f1] px-3 py-2 text-xs text-[#444444]">
          {snippet}
          <button
            type="button"
            className="ml-1 text-xs font-semibold text-[#0b7a5c] underline underline-offset-2"
          >
            read more
          </button>
        </div>

        {/* Bottom right actions */}
        <div className="mt-2 flex justify-end gap-3 text-[#b94444]">
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center justify-center rounded-full p-1 hover:bg-[#ffecec]"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onOpen}
            className="flex items-center justify-center rounded-full p-1 text-[#333333] hover:bg-[#ececec]"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

