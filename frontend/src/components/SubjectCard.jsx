import { Bookmark, Layers, BookOpen, Share2, Trash2 } from "lucide-react";

function formatDate(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function SubjectCard({ subject, isOwner, counts, onDeleteRequest, onShare, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-[16px] border border-[#E6DED2] bg-[#FBF8F3] shadow-[0_2px_10px_-4px_rgba(46,46,46,0.10)] transition-all duration-[250ms] ease-out hover:-translate-y-1.5 hover:shadow-[0_24px_44px_-16px_rgba(46,46,46,0.22)]"
    >
      {/* Hover-revealed actions — same handlers, tucked out of the illustration's way */}
      <div className="absolute right-3 top-3 z-20 flex items-center gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onShare(subject.id); }}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E6DED2] bg-[#FBF8F3]/95 text-[#8A8175] shadow-sm transition-colors duration-200 hover:border-[#5C7385] hover:bg-[#5C7385] hover:text-white"
          aria-label="Share folder"
        >
          <Share2 className="h-3.5 w-3.5" />
        </button>
        {isOwner && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDeleteRequest(subject); }}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E6DED2] bg-[#FBF8F3]/95 text-[#8A8175] shadow-sm transition-colors duration-200 hover:border-[#7A0A12] hover:bg-[#7A0A12] hover:text-white"
            aria-label="Delete folder"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Folder illustration — built entirely in CSS, top ~65% of the card */}
      <div className="relative flex h-[190px] items-center justify-center overflow-hidden bg-gradient-to-b from-[#F7F3EC] to-[#FBF8F3] px-8 pt-6">
        <div
          className="relative w-full max-w-[168px] transition-transform duration-300 ease-out group-hover:scale-[1.04]"
          style={{ aspectRatio: "1.5" }}
        >
          {/* soft paper shadow resting under the folder */}
          <div className="absolute -bottom-2 left-[8%] right-[8%] h-4 rounded-full bg-[#2E2E2E]/15 blur-md" />

          {/* back layer — a second folder peeking out, tilted, giving a stacked/layered feel */}
          <div
            className="absolute inset-x-[6%] bottom-[4%] top-[14%] rounded-[10px] bg-[#5C7385]/40"
            style={{ transform: "rotate(-4deg)" }}
          />

          {/* papers inside the folder */}
          <div className="absolute left-[12%] right-[14%] top-[2%] h-[64%] rounded-t-[6px] border border-[#E6DED2] bg-[#FEFCF8]" />

          {/* folder tab */}
          <div className="absolute left-[10%] top-[10%] h-[18%] w-[38%] rounded-t-[6px] bg-gradient-to-b from-[#6d8598] to-[#5C7385]" />

          {/* folder body */}
          <div className="absolute inset-x-[4%] bottom-0 top-[22%] overflow-hidden rounded-[10px] bg-[#5C7385] shadow-[0_14px_26px_-10px_rgba(30,40,50,0.45)]">
            <div className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-white/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        </div>
      </div>

      {/* Info section — bottom ~35% */}
      <div className="flex flex-1 flex-col justify-between gap-4 border-t border-[#E6DED2] px-5 py-4">
        <div>
          <h3 className="text-[22px] font-semibold leading-snug text-[#2E2E2E]">
            {subject.subjectName || "folder name"}
          </h3>
          <p className="mt-1 text-sm font-normal text-[#8A8175]">
            {formatDate(subject.createdAt) || "No date yet"}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-[#E6DED2] pt-3">
          <div className="flex flex-col items-center gap-1">
            <Bookmark
              className="h-4 w-4 text-[#2E2E2E] transition-transform duration-200 hover:scale-110"
              strokeWidth={1.75}
            />
            <span className="text-xs font-medium text-[#2E2E2E]">{counts?.bookmarks ?? 0}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Layers
              className="h-4 w-4 text-[#2E2E2E] transition-transform duration-200 hover:scale-110"
              strokeWidth={1.75}
            />
            <span className="text-xs font-medium text-[#2E2E2E]">{counts?.flashcards ?? 0}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <BookOpen
              className="h-4 w-4 text-[#2E2E2E] transition-transform duration-200 hover:scale-110"
              strokeWidth={1.75}
            />
            <span className="text-xs font-medium text-[#2E2E2E]">{counts?.notes ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubjectCard;
