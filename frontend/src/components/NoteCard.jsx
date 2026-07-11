import { Trash2 } from "lucide-react";

import { Button } from "./ui/button";

export default function NoteCard({ note, onDelete }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card/80 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{note.title}</h4>
          <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
            {note.content}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onDelete(note.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        Visibility:{" "}
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] uppercase tracking-wide">
          {note.visibility}
        </span>
      </div>
    </div>
  );
}
