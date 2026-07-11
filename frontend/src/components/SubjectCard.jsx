import { Bookmark, Layers, BookOpen, Share2, Trash2 } from "lucide-react";

function formatDate(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function SubjectCard({ subject, isOwner, counts, onDeleteRequest, onShare, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group flex min-h-[300px] cursor-pointer flex-col justify-between rounded-2xl border border-[#cfc4b3] bg-[#f7f2ea] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="rounded-t-2xl bg-[#eee6d8] px-5 pb-4 pt-5">
        <div className="relative mx-auto h-36 w-full">
          <div className="absolute left-0 top-4 h-8 w-[55%] rounded-t-lg bg-[#4b6478]" />
          <div className="absolute inset-x-0 bottom-0 top-9 rounded-lg rounded-tl-none bg-[#4b6478] shadow-[0_3px_0_rgba(0,0,0,0.18)]" />
          <div
            className="absolute left-4 right-4 top-11 h-4 bg-gradient-to-r from-[#f9f9f9] to-[#d8d8d8]"
            style={{ clipPath: "polygon(0 0, 100% 0, 88% 100%, 0% 100%)" }}
          />
        </div>
      </div>

      <div className="border-t border-[#cfc4b3] px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">{subject.subjectName || "folder name"}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{formatDate(subject.createdAt)}</p>
      </div>

      <div className="flex items-center justify-between border-t border-[#cfc4b3] px-4 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1"><Bookmark className="h-3 w-3" />{counts?.bookmarks ?? 0}</span>
          <span className="inline-flex items-center gap-1"><Layers className="h-3 w-3" />{counts?.flashcards ?? 0}</span>
          <span className="inline-flex items-center gap-1"><BookOpen className="h-3 w-3" />{counts?.notes ?? 0}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onShare(subject.id); }}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-[#4b6478]/10 hover:text-[#4b6478]"
            aria-label="Share folder"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
          {isOwner && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDeleteRequest(subject); }}
              className="flex h-7 w-7 items-center justify-center rounded-full text-destructive hover:bg-destructive/10"
              aria-label="Delete folder"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SubjectCard;