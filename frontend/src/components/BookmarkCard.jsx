import { useState } from "react";
import { Trash2, ExternalLink, MessageSquare } from "lucide-react";

const SOURCE_COLORS = { ChatGPT: "#1f7a4d", Gemini: "#4285f4", Claude: "#d97757" };
const OUTLINE = "#7A0912";

export default function BookmarkCard({ title, snippet, sourceLabel = "G", sourceTag, onDelete, onOpen }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = (snippet || "").length > 140;
  const displayText = expanded || !isLong ? snippet : `${snippet.slice(0, 140)}...`;
  const badgeColor = SOURCE_COLORS[sourceTag] || "#1f7a4d";

  return (
    <div className="group my-2.5 flex items-stretch transition-[transform,filter] duration-200 ease-out [filter:drop-shadow(0_1px_2px_rgba(47,47,47,0.07))] hover:-translate-y-0.5 hover:[filter:drop-shadow(0_10px_18px_rgba(47,47,47,0.14))]">
      {/* main body — rounded only on the left, matching top/bottom radius */}
      <div
        className="flex flex-1 items-start gap-3 rounded-l-2xl border-y border-l px-5 py-4"
        style={{ borderColor: `${OUTLINE}8c`, backgroundColor: "#FFFFFF" }}
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

      {/* angled tail — same fill as the body, outlined only on its two
          diagonal edges so it reads as one continuous stroke with the body */}
      <div className="relative w-4 shrink-0 md:w-5">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 20 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,0 L20,50 L0,100"
            fill="#FFFFFF"
            stroke={OUTLINE}
            strokeOpacity="0.55"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  );
}