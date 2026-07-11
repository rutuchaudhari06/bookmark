import React, { useState } from "react";
import {
  BookOpen,
  Edit2,
  Share2,
  Trash2,
  Check,
  X,
  Bookmark,
  Layers,
} from "lucide-react";

import { Button } from "./ui/button";
import { Input } from "./ui/input";

function SubjectCard({ subject, onDelete, onUpdate, onShare, onClick }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(subject.subjectName);

  const handleSave = (e) => {
    e.stopPropagation();
    onUpdate(subject.id, newName);
    setIsEditing(false);
  };

  const todayLabel = "Dec 10"; // static label to match design; you can replace with real date

  return (
    <div
      onClick={onClick}
      className="group flex min-h-[340px] cursor-pointer flex-col justify-between rounded-xl border border-[#cfc4b3] bg-[#f7f2ea] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* Folder illustration area */}
      <div className="border-b border-[#cfc4b3] bg-[#f7f2ea] px-4 pb-6 pt-6">
        <div className="relative h-52 w-full">
          {/* folder body */}
          <div className="absolute bottom-2 left-0 right-1 top-7 rounded-[28px] bg-[#4b6478] shadow-[0_4px_0_rgba(0,0,0,0.22)]" />

          {/* front-left tab merged into body */}
          <div className="absolute left-0 top-1 z-20 h-14 w-[58%] rounded-[28px] bg-[#4b6478]" />

          {/* soft connector so the tab and body appear as one joined shape */}
          <div className="absolute left-[42%] top-7 z-20 h-6 w-[20%] bg-[#4b6478]" />

          {/* inner paper strip */}
          <div
            className="absolute left-6 right-6 top-9 z-30 h-5 bg-gradient-to-r from-[#f9f9f9] to-[#d4d4d4]"
            style={{
              borderTopLeftRadius: "6px",
              borderTopRightRadius: "6px",
              clipPath: "polygon(0 0, 100% 0, 84% 100%, 0% 100%)",
            }}
          />
        </div>
      </div>

      {/* Text area */}
      <div className="border-b border-[#cfc4b3] px-4 py-3">
        {isEditing ? (
          <div className="space-y-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                className="gap-1"
                onClick={handleSave}
              >
                <Check className="h-4 w-4" />
                Save
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(false);
                  setNewName(subject.subjectName);
                }}
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-sm font-semibold text-foreground">
              {subject.subjectName || "folder name"}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">{todayLabel}</p>
          </>
        )}
      </div>

      {/* Stats and actions row */}
      <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1">
            <Bookmark className="h-3 w-3" />
            0
          </span>
          <span className="inline-flex items-center gap-1">
            <Layers className="h-3 w-3" />
            0
          </span>
          <span className="inline-flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            0
          </span>
        </div>

        {!isEditing && (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onShare(subject.id);
              }}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(subject.id);
              }}
              className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SubjectCard;
