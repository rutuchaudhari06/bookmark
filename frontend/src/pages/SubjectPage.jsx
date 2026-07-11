import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Shield,
  BookOpenCheck,
  StickyNote,
  Sparkles,
  Search,
  Lock,
  Image,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import {
  createNote,
  getNotesBySubject,
  getBookmarksBySubject,
  deleteNote,
  deleteBookmark,
  updateNote,
} from "../services/noteService";
import NoteCard from "../components/NoteCard";
import {
  createFlashcard,
  getFlashcardBySubject,
  deleteFlashcard,
} from "../services/flashcardService";
import FlashcardCard from "../components/FlashCard";
import { getSubjectById } from "../services/subjectService";
import { addCollaborator } from "../services/collaboratorService";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import BookmarkCard from "../components/BookmarkCard";

function SubjectPage() {
  const { user } = useAuth();
  const { subjectId } = useParams();
  const navigate = useNavigate();

  const [subject, setSubject] = useState(null);

  // notes
  const [notes, setNotes] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState("private");

  // flashcards
  const [flashcards, setFlashcards] = useState([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [difficulty, setDifficulty] = useState("easy");

  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isSavingCard, setIsSavingCard] = useState(false);
  const [activeTab, setActiveTab] = useState("flashcards"); // bookmarks | flashcards | notes
  const [bookmarkSearch, setBookmarkSearch] = useState("");
  const [currentCardIndex, setCurrentCardIndex] = useState(0); // index of currently shown flashcard in viewer.
  const [isFlipped, setIsFlipped] = useState(false); //isFlipped: whether current flashcard shows answer side.
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [showNoteForm, setShowNoteForm] = useState(false); //showNoteForm : it tells wheather form is shown or hidden , the form is only shown when we click on create flash
  const [showFlashcardForm, setShowFlashcardForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadSubject = async () => {
    const data = await getSubjectById(subjectId);
    setSubject(data);
  };

  const loadFlashcards = async () => {
    if (!subject) return;
    try {
      const data = await getFlashcardBySubject(subject.id);
      setFlashcards(data);
    } catch (error) {
      console.error("Failed to load flashcards:", error);
      setErrorMessage(
        "You do not have permission to read flashcards for this subject.",
      );
    }
  };

  const handleCreateFlashcard = async (e) => {
    e?.preventDefault();
    if (!question || !answer || !user || !subject) {
      return;
    }

    setIsSavingCard(true);
    try {
      setErrorMessage("");
      await createFlashcard({
        question,
        answer,
        subjectId: subject.id,
        userId: user.uid,
        difficulty,
      });

      setQuestion("");
      setAnswer("");
      setDifficulty("easy");
      setShowFlashcardForm(false);
      await loadFlashcards();
    } catch (error) {
      console.error("Failed to create flashcard:", error);
      setErrorMessage(
        "Unable to create flashcard. Check Firestore rules for this subject.",
      );
    } finally {
      setIsSavingCard(false);
    }
  };

  const handleDeleteFlashcard = async (id) => {
    if (!subject) return;
    await deleteFlashcard(subject.id, id);
    await loadFlashcards();
  };

  const loadBookmarks = async () => {
    if (!subject) return;
    try {
      const data = await getBookmarksBySubject(subject.id);
      setBookmarks(data);
    } catch (error) {
      console.error("Failed to load bookmarks:", error);
      setErrorMessage("You do not have permission to read bookmarks for this subject.");
    }
  };

  const handleDeleteBookmark = async (bookmarkId) => {
    if (!subject) return;
    await deleteBookmark(subject.id, bookmarkId);
    await loadBookmarks();
  };

  const loadNotes = async () => {
    if (!subject) return;
    try {
      const data = await getNotesBySubject(subject.id);
      setNotes(data);
    } catch (error) {
      console.error("Failed to load notes:", error);
      setErrorMessage("You do not have permission to read notes.");
    }
  };

  const handleCreate = async (e) => {
    e?.preventDefault();

    if (!title || !content || !user || !subject) {
      return;
    }

    setIsSavingNote(true);
    try {
      setErrorMessage("");
      if (editingNoteId) {
        await updateNote(subject.id, editingNoteId, {
          title,
          content,
          visibility,
        });
      } else {
      await createNote({
        title,
        content,
        subjectId: subject.id,
        userId: user.uid,
        visibility,
      });
      }

      setTitle("");
      setContent("");
      setVisibility("private");
      setEditingNoteId(null);
      setShowNoteForm(false);
      await loadNotes();
    } catch (error) {
      console.error("Failed to save note:", error);
      setErrorMessage(
        "Unable to save note. Check Firestore rules for notes access.",
      );
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDelete = async (noteId) => {
    if (!subject) return;
    await deleteNote(subject.id, noteId);
    loadNotes();
  };

  useEffect(() => {
    if (subjectId) {
      loadSubject();
    }
  }, [subjectId]);

  useEffect(() => {
    if (subject) {
      loadNotes();
      loadFlashcards();
      loadBookmarks();
    }
  }, [subject]);

  // ensure current card index stays in range when flashcards change
  useEffect(() => {
    if (flashcards.length === 0) {
      setCurrentCardIndex(0);
      setIsFlipped(false);
    } else if (currentCardIndex > flashcards.length - 1) {
      setCurrentCardIndex(flashcards.length - 1);
      setIsFlipped(false);
    }
  }, [flashcards.length]);

  useEffect(() => {
    if (!user || !subject) {
      return;
    }

    const isOwner = subject.ownerId === user.uid;
    const isCollaborator =
      subject.collaborators && subject.collaborators.includes(user.uid);

    if (!isOwner && !isCollaborator) {
      addCollaborator(subjectId, user.uid);
    }
  }, [user, subject, subjectId]);

  if (!subject) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="rounded-xl border border-border bg-card px-6 py-4 text-sm text-muted-foreground shadow-sm">
          Loading subject...
        </div>
      </div>
    );
  }

  const isOwner = subject.ownerId === user?.uid;
  const collaboratorCount = subject.collaborators?.length || 0;

  const filteredBookmarks = bookmarks.filter((bookmark) => {
    const queryText = bookmarkSearch.trim().toLowerCase();
    if (!queryText) return true;
    const haystack = [
      bookmark.title,
      bookmark.snippet,
      bookmark.content,
      bookmark.description,
      bookmark.url,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(queryText);
  });

  const getBookmarkSourceLabel = (bookmark) => {
    try {
      const hostname = new URL(bookmark.url).hostname.replace("www.", "");
      return hostname.charAt(0).toUpperCase();
    } catch (error) {
      return "B";
    }
  };

  const getBookmarkSourceTag = (bookmark) => {
    try {
      const hostname = new URL(bookmark.url).hostname.replace("www.", "");
      if (hostname.includes("openai") || hostname.includes("chatgpt")) return "ChatGPT";
      if (hostname.includes("gemini") || hostname.includes("google")) return "Gemini";
      if (hostname.includes("claude")) return "Claude";
      return hostname.split(".")[0];
    } catch (error) {
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f3eee5]">
      {/* Top red bar */}
      <header className="border-b border-border bg-[#7d0000] text-cream-dark">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-cream-dark hover:bg-cream-dark/10"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Button>
        </div>
      </header>

      <main className="mt-6 flex flex-col gap-0 pb-10">
        {/* Folder header */}
        <section className="pb-4 pt-6">
          <div className="relative h-24 overflow-hidden rounded-t-3xl bg-[#f7f2ea] px-3">
            <div className="absolute inset-x-0 top-16 z-20 h-6 rounded-tl-[18px] rounded-tr-[18px] bg-[#4b6478]" />
            <div className="absolute left-8 top-0 z-10 inline-flex h-16 min-w-[280px] items-center justify-center rounded-t-[12px] rounded-b-none bg-[#4b6478] px-12 text-white">
              <span className="font-serif text-2xl font-medium leading-none">
                {subject.subjectName}
              </span>
            </div>
          </div>

            {/* Tabs */}
            <div className="flex gap-3 border-b border-[#d2c6b3] px-6 pb-3">
              {[
                { id: "bookmarks", label: "Bookmarks", count: bookmarks.length },
                { id: "flashcards", label: "Flashcards", count: flashcards.length },
                { id: "notes", label: "Notepad", count: notes.length },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-2 rounded-md border px-4 py-1.5 text-sm ${
                      isActive
                        ? "border-[#4b6478] bg-[#4b6478] text-cream-dark"
                        : "border-[#c6b9a3] bg-[#f7f2ea] text-foreground"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className="rounded-full bg-[#f7f2ea] px-2 text-xs">
                      {tab.count.toString().padStart(2, "0")}
                    </span>
                  </button>
                );
              })}
            </div>

        {/* Content area */}
        <div className="border-t border-[#d2c6b3] px-6 pb-8 pt-4">
          <div className="space-y-5">
            {/* Search + create row */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-start md:gap-6">
              <div className="relative w-full md:w-[260px]">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                  <Search className="h-4 w-4" />
                </span>
                <Input
                  className="h-10 rounded-lg border-[#6d6d6d] bg-[#fbf7f0] pl-9"
                  placeholder={
                    activeTab === "bookmarks"
                      ? "Search your bookmark"
                      : activeTab === "flashcards"
                      ? "Search your flashcards"
                      : "Search your notes"
                  }
                  value={bookmarkSearch}
                  onChange={(e) => setBookmarkSearch(e.target.value)}
                />
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 rounded-lg border-[#b34747] bg-[#f7f2ea] px-5 text-sm font-medium text-[#7d0000] hover:bg-[#7d0000] hover:text-cream-dark md:ml-auto"
                onClick={
                  activeTab === "flashcards"
                    ? () => {
                        setQuestion("");
                        setAnswer("");
                        setDifficulty("easy");
                        setShowFlashcardForm(true);
                      }
                    : activeTab === "notes"
                    ? () => {
                        setEditingNoteId(null);
                        setTitle("");
                        setContent("");
                        setVisibility("private");
                        setShowNoteForm(true);
                      }
                    : undefined
                }
                disabled={
                  activeTab === "flashcards"
                    ? isSavingCard
                    : activeTab === "notes"
                    ? isSavingNote
                    : activeTab === "bookmarks"
                    ? false
                    : true
                }
              >
                + 
                {activeTab === "bookmarks"
                  ? " Create bookmark"
                  : activeTab === "flashcards"
                  ? isSavingCard
                    ? "Saving..."
                    : " Create custom"
                  : isSavingNote
                  ? "Saving..."
                  : " Create custom"}
              </Button>
            </div>
            {errorMessage && (
              <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
                {errorMessage}
              </p>
            )}

            {/* Tab content */}
            {activeTab === "bookmarks" && (
              <div className="space-y-4">
                {filteredBookmarks.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No bookmarks yet. Save a chat selection from the Chrome extension to see it here.
                  </p>
                ) : (
                  filteredBookmarks.map((bookmark) => (
                    <BookmarkCard
                      key={bookmark.id}
                      title={bookmark.title || "AI Chat Bookmark"}
                      snippet={bookmark.snippet || bookmark.content || ""}
                      sourceLabel={getBookmarkSourceLabel(bookmark)}
                      sourceTag={getBookmarkSourceTag(bookmark)}
                      onDelete={() => handleDeleteBookmark(bookmark.id)}
                      onOpen={() => {
                        if (bookmark.url) {
                          window.open(bookmark.url, "_blank", "noopener,noreferrer");
                        }
                      }}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === "notes" && (
              <div className="space-y-6">
                {/* Notes grid */}
                <div className="grid gap-4 md:grid-cols-3">
                  {notes.length === 0 ? (
                    <p className="text-xs text-muted-foreground md:col-span-3">
                      No notes yet. Use &quot;Create custom&quot; to add your
                      first notepad card.
                    </p>
                  ) : (
                    notes.map((n) => (
                      <div
                        key={n.id}
                        className="flex min-h-[260px] flex-col justify-between rounded-md border border-[#d0c7be] bg-[#f7f2ea] shadow-sm"
                      >
                        <div className="border-b border-[#d0c7be] bg-[#f0dcc5] px-4 py-2 text-sm font-semibold tracking-wide text-[#333333]">
                          {n.title || "SUBJECT NAME"}
                        </div>
                        <div className="flex-1 px-4 py-3 text-xs text-[#444444] whitespace-pre-line">
                          {n.content || "write notes from here..."}
                        </div>
                        <div className="flex items-center justify-between border-t border-[#d0c7be] px-3 py-2 text-xs">
                          <div className="flex items-center gap-2 text-[#555555]">
                            <Lock className="h-4 w-4" />
                            <Image className="h-4 w-4" />
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="rounded-full bg-[#7d0000] px-3 py-1 text-xs font-semibold text-white"
                              onClick={() => {
                                setTitle(n.title || "");
                                setContent(n.content || "");
                                setVisibility(n.visibility || "private");
                                setEditingNoteId(n.id);
                                setShowNoteForm(true);
                              }}
                            >
                              edit
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Create / edit form */}
                {showNoteForm && (
                  <form
                    onSubmit={handleCreate}
                    className="space-y-3 rounded-xl bg-background/60 p-3 md:p-4"
                  >
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">
                        Title
                      </label>
                      <Input
                        placeholder="Subject name"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">
                        Content
                      </label>
                      <textarea
                        className="min-h-[96px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="Write notes from here..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col items-start justify-between gap-3 border-t border-border pt-3 text-xs md:flex-row md:items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground">
                          Visibility
                        </span>
                        <select
                          className="h-8 rounded-lg border border-input bg-card px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={visibility}
                          onChange={(e) => setVisibility(e.target.value)}
                        >
                          <option value="private">Private</option>
                          <option value="shared">Shared</option>
                        </select>
                      </div>

                      <Button
                        type="submit"
                        size="sm"
                        className="gap-1"
                        disabled={isSavingNote}
                      >
                        <StickyNote className="h-4 w-4" />
                        {isSavingNote
                          ? "Saving..."
                          : editingNoteId
                          ? "Update note"
                          : "Add note"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {activeTab === "flashcards" && (
              <div className="space-y-6">
                {showFlashcardForm ? (
                  <form
                    onSubmit={handleCreateFlashcard}
                    className="space-y-3 rounded-xl bg-background/60 p-3 md:p-4"
                  >
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">
                        Question
                      </label>
                      <Input
                        placeholder="What do you want to remember?"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">
                        Answer
                      </label>
                      <textarea
                        className="min-h-[80px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="Explain it clearly so future-you can recall it fast..."
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col items-start justify-between gap-3 border-t border-border pt-3 text-xs md:flex-row md:items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground">
                          Difficulty
                        </span>
                        <select
                          className="h-8 rounded-lg border border-input bg-card px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={difficulty}
                          onChange={(e) => setDifficulty(e.target.value)}
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>

                      <Button
                        type="submit"
                        size="sm"
                        className="gap-1"
                        disabled={isSavingCard}
                      >
                        <Sparkles className="h-4 w-4" />
                        {isSavingCard ? "Saving..." : "Add flashcard"}
                      </Button>
                    </div>
                  </form>
                ) : flashcards.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No flashcards yet. Use &quot;Create custom&quot; to add your
                    first one.
                  </p>
                ) : (
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-center md:gap-3">
                    {/* Card */}
                    <div className="w-full max-w-xl rounded-md border border-[#d0c7be] bg-[#f7f2ea] shadow-sm">
                      <div className="flex items-center justify-between bg-[#7d0000] px-4 py-2 text-sm font-semibold text-white">
                        <span>{isFlipped ? "Answer" : "Question"}</span>
                        <button
                          type="button"
                          className="rounded-full border border-white/60 px-3 py-0.5 text-xs"
                          onClick={() => setIsFlipped((v) => !v)}
                        >
                          flip
                        </button>
                      </div>
                      <div className="px-4 py-3 text-sm text-[#333333] min-h-[150px]">
                        {isFlipped
                          ? flashcards[currentCardIndex].answer
                          : flashcards[currentCardIndex].question}
                      </div>
                      <div className="flex items-center justify-between border-t border-[#d0c7be] px-4 py-2 text-xs text-[#333333]">
                        <span>
                          card {currentCardIndex + 1} of {flashcards.length}
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="rounded bg-[#7d0000] px-2 py-1 text-white"
                            onClick={() => {
                              setIsFlipped(false);
                              setCurrentCardIndex((i) => (i > 0 ? i - 1 : i));
                            }}
                          >
                            {"<"}
                          </button>
                          <button
                            type="button"
                            className="rounded bg-[#7d0000] px-2 py-1 text-white"
                            onClick={() => {
                              setIsFlipped(false);
                              setCurrentCardIndex((i) =>
                                i < flashcards.length - 1 ? i + 1 : i,
                              );
                            }}
                          >
                            {">"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Progress dots */}
                    <div className="flex flex-col items-center gap-2 pt-1">
                      {flashcards.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setCurrentCardIndex(idx);
                            setIsFlipped(false);
                          }}
                          aria-label={`Go to flashcard ${idx + 1}`}
                          className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold transition ${
                            idx === currentCardIndex
                              ? "border-[#0b7a5c] bg-[#0b7a5c] text-white shadow-sm"
                              : "border-[#d0c7be] bg-[#f7f2ea] text-[#8b8b8b]"
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        </section>
      </main>
    </div>
  );
}

export default SubjectPage;
