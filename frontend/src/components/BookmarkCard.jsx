import { useState } from "react";
import { Trash2, ExternalLink, MessageSquare } from "lucide-react";

const SOURCE_COLORS = { ChatGPT: "#1f7a4d", Gemini: "#4285f4", Claude: "#d97757" };
const CLIP = "polygon(0 0, 96% 0, 100% 50%, 96% 100%, 0 100%)";

export default function BookmarkCard({ title, snippet, sourceLabel = "G", sourceTag, onDelete, onOpen }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = (snippet || "").length > 140;
  const displayText = expanded || !isLong ? snippet : `${snippet.slice(0, 140)}...`;
  const badgeColor = SOURCE_COLORS[sourceTag] || "#1f7a4d";

  return (
    <div className="group relative my-2.5 transition-transform duration-200 ease-out hover:-translate-y-0.5">
      {/* thin burgundy outline that traces the exact angled shape */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <polygon
          points="0,0 96,0 100,50 96,100 0,100"
          fill="none"
          stroke="#7A0912"
          strokeOpacity="0.55"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div
        className="flex items-start gap-3 bg-white px-5 py-4 pr-9 shadow-[0_1px_3px_rgba(47,47,47,0.06)] transition-shadow duration-200 group-hover:shadow-[0_10px_22px_rgba(47,47,47,0.12)]"
        style={{ clipPath: CLIP }}
      >
        <div
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
          style={{ backgroundColor: badgeColor }}
        >
          {sourceLabel}
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-[#2F2F2F]">{title}</h4>

          <div className="mt-2 flex items-start gap-2 rounded-lg bg-[#F7F4ED] px-3 py-2 text-xs text-[#5C584F]">
            <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8B8478]" />
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

        <div className="flex shrink-0 flex-col items-center gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={onOpen}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#7A0912] transition-colors duration-200 hover:bg-[#7A0912]/10"
            aria-label="Open bookmark source"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#B3453F] transition-colors duration-200 hover:bg-[#B3453F]/10"
            aria-label="Delete bookmark"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}