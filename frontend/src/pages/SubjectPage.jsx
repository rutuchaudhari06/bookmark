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
  Share2, Check, X,
  LogOut,
  BookOpen,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import {
  createNote,
  getNotesBySubject,
  deleteNote,
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

import { getBookmarks , deleteBookmark } from "../services/bookmarkService";
import { generateShareToken } from "../services/subjectService";
import { logout } from "../config/Auth";
import NotificationBell from "../components/NotificationBell";

import {
  getPendingRequests,
  approveJoinRequest,
  rejectJoinRequest,
} from "../services/joinRequestService";

import { createNotification } from "../services/notificationService";

function SubjectPage() {
  const { user } = useAuth();
  const { subjectId } = useParams();
  const navigate = useNavigate();

  const [subject, setSubject] = useState(null);

  // notes
  const [notes, setNotes] = useState([]);
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

  //bookmark

  const [bookmarks,setBookmarks]=useState([]);

  const [shareLink, setShareLink] = useState("");
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [requestActionId, setRequestActionId] = useState(null);

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
        if (!subject || !user) return;

        try {
          const data = await getBookmarks(subject.id);
          setBookmarks(data);
        } catch (error) {
          console.error("Failed to load bookmarks:", error);
          setErrorMessage(
            "You do not have permission to read bookmarks."
          );
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

  useEffect(() => {
        if (subject && user && subject.ownerId === user.uid) {
          loadPendingRequests();
        }
  }, [subject, user]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!subject) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F4ED]">
        <div className="rounded-xl border border-[#ECE3D1] bg-white px-6 py-4 text-sm text-[#8B8478] shadow-sm">
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

  const loadPendingRequests = async () => {
  if (!subject) return;
  setIsLoadingRequests(true);
  try {
    const requests = await getPendingRequests(subject.id);
    setPendingRequests(requests);
  } catch (error) {
    console.error("Failed to load join requests:", error);
  } finally {
    setIsLoadingRequests(false);
  }
};

//runs when owner clicks on share button to generate share link for that subject
const handleOpenShare = async () => {
  if (!subject) return;
  setIsShareOpen(true);
  setIsGeneratingLink(true);
  try {
    const token = await generateShareToken(subject.id);
    setShareLink(`${window.location.origin}/join/${token}`);

    await createNotification(user.uid, {
      type: "folder_shared",
      title: "Folder shared successfully",
      description: `Share link ready for "${subject.subjectName}"`,
      subjectId: subject.id,
    });

  } catch (error) {
    console.error("Failed to generate share link:", error);
  } finally {
    setIsGeneratingLink(false);
  }
};

//runs when user clicks on copy button to copy the share link to clipboard
const handleCopyShareLink = () => {
  navigator.clipboard
    ?.writeText(shareLink)
    .then(() => alert("Share link copied to clipboard!"))
    .catch(() => alert(`Share this link: ${shareLink}`));
};

const handleApproveRequest = async (request) => {
  if (!subject) return;
  setRequestActionId(request.id);
  try {
    await approveJoinRequest(subject.id, request.id, request.userId);
    await loadPendingRequests();
    await loadSubject(); // refresh collaborators list
  } catch (error) {
    console.error("Failed to approve request:", error);
  } finally {
    setRequestActionId(null);
  }
};

const handleRejectRequest = async (request) => {
  if (!subject) return;
  setRequestActionId(request.id);
  try {
    await rejectJoinRequest(subject.id, request.id);
    await loadPendingRequests();
  } catch (error) {
    console.error("Failed to reject request:", error);
  } finally {
    setRequestActionId(null);
  }
};

  return (
    <div className="min-h-screen bg-[#F7F4ED]">
      {/* Header — burgundy cover with a cream folder-flap corner that
          blends into the page, exactly like the master dashboard header */}
      <header className="relative h-[104px] w-full">
        <div className="absolute inset-0 bg-[#7A0912]" />
        <div className="absolute left-0 top-0 h-[104px] w-[120px] rounded-br-[104px] bg-[#F7F4ED] md:w-[150px]" />

        <div className="relative z-10 mx-auto flex h-full max-w-6xl items-center justify-between pl-[136px] pr-6 md:pl-[166px] md:pr-10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-[#F7F4ED]/25">
              <BookOpen className="h-4 w-4 text-[#F7F4ED]" />
            </span>
            <p className="text-[16px] font-semibold tracking-tight text-[#F7F4ED]">
              AIMarks
            </p>
          </div>

          <div className="flex items-center gap-2.5 md:gap-4">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-[10px] border-[#F7F4ED]/25 bg-transparent text-[#F7F4ED] transition-colors duration-200 hover:border-[#F7F4ED]/40 hover:bg-[#F7F4ED]/10"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </Button>

            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-[10px] border-[#F7F4ED]/25 bg-transparent text-[#F7F4ED] transition-colors duration-200 hover:border-[#F7F4ED]/40 hover:bg-[#F7F4ED]/10"
                onClick={handleOpenShare}
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            )}

            {user && (
              <span className="hidden max-w-[160px] truncate text-[13px] font-medium text-[#F7F4ED]/85 lg:inline">
                {user.email}
              </span>
            )}
            {user && <NotificationBell userId={user.uid} />}

            <button
              type="button"
              onClick={handleLogout}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#F7F4ED]/85 transition-colors duration-200 hover:bg-[#F7F4ED]/10"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {isOwner && isShareOpen && (
                        <div className="mx-6 mt-4 rounded-xl border border-[#ECE3D1] bg-white p-4 shadow-[0_1px_6px_rgba(47,47,47,0.05)]">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-[#2F2F2F]">Share this folder</span>
                            <button
                              type="button"
                              className="text-xs text-[#8B8478]"
                              onClick={() => setIsShareOpen(false)}
                            >
                              Close
                            </button>
                          </div>
                          <div className="mt-2 flex flex-col gap-2 md:flex-row">
                            <Input
                              readOnly
                              value={isGeneratingLink ? "Generating link..." : shareLink}
                              className="h-10 rounded-full bg-[#F7F4ED]"
                            />
                            <Button
                              type="button"
                              size="sm"
                              className="rounded-full"
                              onClick={handleCopyShareLink}
                              disabled={isGeneratingLink || !shareLink}
                            >
                              Copy Link
                            </Button>
                          </div>
                        </div>
                      )}

                      {isOwner && pendingRequests.length > 0 && (
                        <div className="mx-6 mt-4 rounded-xl border border-[#ECE3D1] bg-white p-4 shadow-[0_1px_6px_rgba(47,47,47,0.05)]">
                          <p className="text-sm font-medium text-[#2F2F2F]">
                            Pending Requests ({pendingRequests.length})
                          </p>
                          <div className="mt-3 space-y-2">
                            {pendingRequests.map((request) => (
                              <div
                                key={request.id}
                                className="flex items-center justify-between rounded-lg border border-[#ECE3D1] bg-[#F7F4ED] px-3 py-2 text-sm"
                              >
                                <div>
                                  <p className="font-medium text-[#2F2F2F]">
                                    {request.displayName || request.email || "Unknown user"}
                                  </p>
                                  {request.email && (
                                    <p className="text-xs text-[#8B8478]">{request.email}</p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    className="gap-1 rounded-full"
                                    disabled={requestActionId === request.id}
                                    onClick={() => handleApproveRequest(request)}
                                  >
                                    <Check className="h-4 w-4" />
                                    Approve
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="gap-1 rounded-full"
                                    disabled={requestActionId === request.id}
                                    onClick={() => handleRejectRequest(request)}
                                  >
                                    <X className="h-4 w-4" />
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
      )}

      <main className="flex flex-col gap-0 pb-10">
        {/* Folder tab + strip — one continuous folder cover, like the
            master header, holding the subject name */}
        <section className="pt-8">
          <div className="relative mx-6">
            <svg
              className="absolute left-2 top-0 z-10 h-14 w-[300px]"
              viewBox="0 0 300 56"
              preserveAspectRatio="none"
              style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.08))" }}
              aria-hidden="true"
            >
              <path
                d="M0,56 L0,16 Q0,0 16,0 L220,0 Q238,0 248,10 L262,26 Q272,36 288,36 L300,36 L300,56 Z"
                fill="#4b6478"
              />
            </svg>
            <span className="absolute left-9 top-0 z-20 flex h-14 items-center text-xl font-semibold leading-none text-white">
              {subject.subjectName}
            </span>

            <div className="relative z-0 mt-[40px] h-16 w-full rounded-tl-[22px] rounded-tr-[22px] bg-[#4b6478] shadow-[0_6px_16px_rgba(47,47,47,0.10)]" />
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap items-center gap-2.5 px-8 pt-6">
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
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? "border-[#4b6478] bg-[#4b6478] text-white"
                        : "border-[#ECE3D1] bg-white text-[#2F2F2F] hover:border-[#4b6478]/40"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[11px] leading-none ${
                        isActive ? "bg-white/20 text-white" : "bg-[#F7F4ED] text-[#8B8478]"
                      }`}
                    >
                      {tab.count.toString().padStart(2, "0")}
                    </span>
                  </button>
                );
              })}
            </div>

        {/* Content area */}
        <div className="border-t border-[#ECE3D1] px-8 pb-8 pt-5">
          <div className="space-y-5">
            {/* Search + create row */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-start md:gap-6">
              <div className="relative w-full md:w-[260px]">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#8B8478]">
                  <Search className="h-4 w-4" />
                </span>
                <Input
                  className="h-10 rounded-full border-[#ECE3D1] bg-white pl-9"
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
                className="gap-2 rounded-full border-[#7A0912]/30 bg-white px-5 text-sm font-medium text-[#7A0912] transition-colors duration-200 hover:bg-[#7A0912] hover:text-white md:ml-auto"
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
                  <p className="text-xs text-[#8B8478]">
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
                    <p className="text-xs text-[#8B8478] md:col-span-3">
                      No notes yet. Use &quot;Create custom&quot; to add your
                      first notepad card.
                    </p>
                  ) : (
                    notes.map((n) => (
                      <div
                        key={n.id}
                        className="flex min-h-[260px] flex-col justify-between rounded-2xl border border-[#ECE3D1] bg-white shadow-[0_1px_4px_rgba(47,47,47,0.05)]"
                      >
                        <div className="rounded-t-2xl border-b border-[#ECE3D1] bg-[#F7F4ED] px-4 py-2 text-sm font-semibold tracking-wide text-[#2F2F2F]">
                          {n.title || "SUBJECT NAME"}
                        </div>
                        <div className="flex-1 whitespace-pre-line px-4 py-3 text-xs text-[#5C584F]">
                          {n.content || "write notes from here..."}
                        </div>
                        <div className="flex items-center justify-between border-t border-[#ECE3D1] px-3 py-2 text-xs">
                          <div className="flex items-center gap-2 text-[#8B8478]">
                            <Lock className="h-4 w-4" />
                            <Image className="h-4 w-4" />
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="rounded-full bg-[#7A0912] px-3 py-1 text-xs font-semibold text-white transition-opacity duration-200 hover:opacity-90"
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
                    className="space-y-3 rounded-2xl border border-[#ECE3D1] bg-white p-3 shadow-[0_1px_4px_rgba(47,47,47,0.05)] md:p-4"
                  >
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#2F2F2F]">
                        Title
                      </label>
                      <Input
                        placeholder="Subject name"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#2F2F2F]">
                        Content
                      </label>
                      <textarea
                        className="min-h-[96px] w-full rounded-lg border border-[#ECE3D1] bg-white px-3 py-2 text-sm text-[#2F2F2F] outline-none ring-offset-background placeholder:text-[#8B8478] focus-visible:ring-2 focus-visible:ring-[#7A0912]/30 focus-visible:ring-offset-2"
                        placeholder="Write notes from here..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col items-start justify-between gap-3 border-t border-[#ECE3D1] pt-3 text-xs md:flex-row md:items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[#2F2F2F]">
                          Visibility
                        </span>
                        <select
                          className="h-8 rounded-lg border border-[#ECE3D1] bg-white px-2 text-xs text-[#2F2F2F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0912]/30"
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
                        className="gap-1 rounded-full"
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
                    className="space-y-3 rounded-2xl border border-[#ECE3D1] bg-white p-3 shadow-[0_1px_4px_rgba(47,47,47,0.05)] md:p-4"
                  >
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#2F2F2F]">
                        Question
                      </label>
                      <Input
                        placeholder="What do you want to remember?"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#2F2F2F]">
                        Answer
                      </label>
                      <textarea
                        className="min-h-[80px] w-full rounded-lg border border-[#ECE3D1] bg-white px-3 py-2 text-sm text-[#2F2F2F] outline-none ring-offset-background placeholder:text-[#8B8478] focus-visible:ring-2 focus-visible:ring-[#7A0912]/30 focus-visible:ring-offset-2"
                        placeholder="Explain it clearly so future-you can recall it fast..."
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col items-start justify-between gap-3 border-t border-[#ECE3D1] pt-3 text-xs md:flex-row md:items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[#2F2F2F]">
                          Difficulty
                        </span>
                        <select
                          className="h-8 rounded-lg border border-[#ECE3D1] bg-white px-2 text-xs text-[#2F2F2F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0912]/30"
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
                        className="gap-1 rounded-full"
                        disabled={isSavingCard}
                      >
                        <Sparkles className="h-4 w-4" />
                        {isSavingCard ? "Saving..." : "Add flashcard"}
                      </Button>
                    </div>
                  </form>
                ) : flashcards.length === 0 ? (
                  <p className="text-xs text-[#8B8478]">
                    No flashcards yet. Use &quot;Create custom&quot; to add your
                    first one.
                  </p>
                ) : (
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-center md:gap-3">
                    {/* Card */}
                    <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#ECE3D1] bg-white shadow-[0_2px_10px_rgba(47,47,47,0.06)]">
                      <div className="flex items-center justify-between bg-[#7A0912] px-4 py-2 text-sm font-semibold text-white">
                        <span>{isFlipped ? "Answer" : "Question"}</span>
                        <button
                          type="button"
                          className="rounded-full border border-white/50 px-3 py-0.5 text-xs transition-colors duration-200 hover:bg-white/10"
                          onClick={() => setIsFlipped((v) => !v)}
                        >
                          flip
                        </button>
                      </div>
                      <div className="min-h-[150px] px-4 py-3 text-sm text-[#2F2F2F]">
                        {isFlipped
                          ? flashcards[currentCardIndex].answer
                          : flashcards[currentCardIndex].question}
                      </div>
                      <div className="flex items-center justify-between border-t border-[#ECE3D1] px-4 py-2 text-xs text-[#5C584F]">
                        <span>
                          card {currentCardIndex + 1} of {flashcards.length}
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="rounded-full bg-[#7A0912] px-2.5 py-1 text-white transition-opacity duration-200 hover:opacity-90"
                            onClick={() => {
                              setIsFlipped(false);
                              setCurrentCardIndex((i) => (i > 0 ? i - 1 : i));
                            }}
                          >
                            {"<"}
                          </button>
                          <button
                            type="button"
                            className="rounded-full bg-[#7A0912] px-2.5 py-1 text-white transition-opacity duration-200 hover:opacity-90"
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
                          className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold transition-colors duration-200 ${
                            idx === currentCardIndex
                              ? "border-[#0b7a5c] bg-[#0b7a5c] text-white shadow-sm"
                              : "border-[#ECE3D1] bg-white text-[#8B8478]"
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