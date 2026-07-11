import { Trash2, Sparkles } from "lucide-react";

import { Button } from "./ui/button";

export default function FlashcardCard({ flashcard, onDelete }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card/80 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">
            <span className="mr-1 rounded-md bg-forest/10 px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-forest">
              Q
            </span>
            {flashcard.question}
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="mr-1 rounded-md bg-cream-dark/60 px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-coral">
              A
            </span>
            {flashcard.answer}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onDelete(flashcard.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] uppercase tracking-wide">
          <Sparkles className="h-3 w-3 text-forest" />
          {flashcard.difficulty}
        </span>
      </div>
    </div>
  );
}
