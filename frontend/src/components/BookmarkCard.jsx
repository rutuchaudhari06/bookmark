import { useState } from "react";
import { Trash2, ExternalLink, MessageSquare } from "lucide-react";

const SOURCE_COLORS = { ChatGPT: "#1f7a4d", Gemini: "#4285f4", Claude: "#d97757" };

export default function BookmarkCard({ title, snippet, sourceLabel = "G", sourceTag, onDelete, onOpen }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = (snippet || "").length > 140;
  const displayText = expanded || !isLong ? snippet : `${snippet.slice(0, 140)}...`;
  const badgeColor = SOURCE_COLORS[sourceTag] || "#1f7a4d";

  return (
    <div className="relative my-2 flex items-stretch gap-2">
      <div
        className="group relative flex-1 rounded-xl border border-[#b94444] bg-[#fdfaf7] px-4 py-3 shadow-sm transition-shadow hover:shadow-md"
        style={{ clipPath: "polygon(0 0, 96% 0, 100% 50%, 96% 100%, 0 100%)" }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: badgeColor }}
            >
              {sourceLabel}
            </div>
            <div className="text-sm font-semibold text-[#333333]">{title}</div>
          </div>

          <div className="flex items-center gap-2">
            {sourceTag && (
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                style={{ backgroundColor: badgeColor }}
              >
                {sourceTag}
              </span>
            )}
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center justify-center rounded-full p-1 text-[#b94444] hover:bg-[#ffecec]"
              aria-label="Delete bookmark"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-2 flex items-start gap-2 rounded-lg bg-[#f1f1f1] px-3 py-2 text-xs text-[#444444]">
          <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#666666]" />
          <div>
            {displayText}{" "}
            {isLong && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="ml-1 text-xs font-semibold text-[#0b7a5c] underline underline-offset-2"
              >
                {expanded ? "show less" : "read more"}
              </button>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="flex w-9 shrink-0 items-center justify-center rounded-xl border border-[#b94444] bg-[#fdfaf7] text-[#333333] shadow-sm hover:bg-[#7d0000] hover:text-white"
        aria-label="Open bookmark source"
      >
        <ExternalLink className="h-4 w-4" />
      </button>
    </div>
  );
}