import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, Plus, LogOut, Search } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import SubjectCard from "../components/SubjectCard";
import {
  createSubject,
  getUserSubject,
  deleteSubjectCascade,
  updateSubjectName,
  generateShareToken,
  getSubjectCounts,
} from "../services/subjectService";
import { logout } from "../config/Auth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

import NotificationBell from "../components/NotificationBell";
import ConfirmDialog from "../components/ConfirmDialog";

function SubDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [subjectName, setSubjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [counts, setCounts] = useState({}); // { [subjectId]: {notes, flashcards, bookmarks} }
  const [deleteTarget, setDeleteTarget] = useState(null); // subject object to delete 
  const [isDeleting, setIsDeleting] = useState(false);

  const loadSubjects = async () => {
    if (!user) return;

    const data = await getUserSubject(user.uid);
    setSubjects(data);

    const entries = await Promise.all(
      data.map(async (s) => [s.id, await getSubjectCounts(s.id)])
    );
    
    setCounts(Object.fromEntries(entries));
  };

  const handleCreate = async (e) => {
    e?.preventDefault();

    if (!subjectName.trim() || !user) return false;

    setIsCreating(true);
    try {
      await createSubject(subjectName, user.uid);
      setSubjectName("");
      await loadSubjects();
      return true;
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadSubjects();
    }
  }, [user]);

  const handleDelete = async (id) => {
    await deleteSubject(id);
    loadSubjects();
  };

  const handleDeleteConfirmed = async () => {
      if (!deleteTarget) return;
      setIsDeleting(true);
      try {
        await deleteSubjectCascade(deleteTarget.id);
        setDeleteTarget(null);
        await loadSubjects();
      } catch (error) {
        console.error("Failed to delete folder:", error);
      } finally {
        setIsDeleting(false);
      }
  };

  const handleUpdate = async (id, newName) => {
    if (!newName.trim()) return;

    await updateSubjectName(id, newName);
    loadSubjects();
  };

  const handleShare = async (subjectId) => {
    const token = await generateShareToken(subjectId);
    const shareLink = `${window.location.origin}/join/${token}`;
    navigator.clipboard
      ?.writeText(shareLink)
      .then(() => alert("Share link copied to clipboard!"))
      .catch(() => alert(`Share this link: ${shareLink}`));
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const filteredSubjects = subjects.filter((s) =>
    s.subjectName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      className="relative min-h-screen bg-[#F7F3EC]"
      style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* Very faint paper grain, CSS only */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.3]"
        style={{
          backgroundImage: "radial-gradient(rgba(90,75,50,0.08) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />

      {/* Decorative notebook-cover header — a floating rounded card, not a full-bleed navbar */}
      <header className="relative mx-4 mt-4 h-32 overflow-hidden rounded-[28px] bg-[#F7F3EC] shadow-[0_18px_40px_-22px_rgba(46,30,25,0.35)] sm:mx-6 sm:mt-6 md:h-36">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 400 100"
          preserveAspectRatio="none"
        >
          <path d="M170,0 C90,25 90,75 170,100 H400 V0 Z" fill="#7A0A12" />
        </svg>

        {/* Left cream zone — brand mark */}
        <div className="absolute left-6 top-1/2 flex -translate-y-1/2 items-center gap-2 sm:left-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7A0A12]">
            <Bookmark className="h-4 w-4 text-[#F7F3EC]" />
          </div>
          <span className="hidden text-lg font-semibold tracking-tight text-[#2E2E2E] sm:inline">
            AIMarks
          </span>
        </div>

        {/* Right burgundy zone — account controls */}
        <div className="absolute right-6 top-1/2 flex -translate-y-1/2 items-center gap-3 sm:right-8">
          {user && (
            <div className="flex items-center gap-3">
              <span className="hidden text-sm font-medium text-[#F7F3EC] md:inline">
                {user.email}
              </span>
              <NotificationBell userId={user.uid} />
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-full border-[#F7F3EC]/40 bg-transparent font-medium text-[#F7F3EC] transition-colors duration-200 hover:bg-[#F7F3EC] hover:text-[#7A0A12]"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
        {/* Search + actions row */}
        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative w-full max-w-md">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[#8A8175]">
                <Search className="h-4 w-4" />
              </span>
              <Input
                className="h-12 rounded-full border-0 bg-[#FBF8F3] pl-11 text-sm text-[#2E2E2E] shadow-[0_2px_10px_-4px_rgba(46,46,46,0.12)] transition-shadow duration-200 placeholder:text-[#8A8175] focus-visible:shadow-[0_0_0_3px_rgba(122,10,18,0.12)] focus-visible:ring-0"
                placeholder="Search folders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="h-10 shrink-0 rounded-full border border-[#E6DED2] bg-[#FBF8F3] px-4 text-sm font-medium text-[#2E2E2E] shadow-[0_2px_8px_-4px_rgba(46,46,46,0.10)] transition-colors duration-200 hover:bg-white"
            >
              Stickers
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-12 w-fit gap-2 rounded-full border-[#7A0A12] bg-transparent px-6 text-sm font-medium text-[#7A0A12] transition-colors duration-200 hover:bg-[#7A0A12] hover:text-white"
            onClick={() => setIsCreateOpen(true)}
            disabled={isCreating}
          >
            <Plus className="h-4 w-4" />
            {isCreating ? "Creating..." : "Create folder"}
          </Button>
        </section>

        {isCreateOpen && (
          <section className="rounded-2xl border border-[#E6DED2] bg-[#FBF8F3] p-5 shadow-[0_2px_10px_-4px_rgba(46,46,46,0.10)]">
            <form
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
              onSubmit={async (e) => {
                const isCreated = await handleCreate(e);
                if (isCreated) {
                  setIsCreateOpen(false);
                }
              }}
            >
              <Input
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="Folder name"
                className="h-11 rounded-xl border-[#E6DED2] bg-white text-sm"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  className="h-11 rounded-full bg-[#7A0A12] text-sm font-medium hover:bg-[#5f0810]"
                  disabled={!subjectName.trim() || isCreating}
                >
                  {isCreating ? "Creating..." : "Create"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-full border-[#E6DED2] text-sm font-medium"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setSubjectName("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </section>
        )}

        {/* Subjects grid */}
        <section className="space-y-4">
          <div className="grid grid-cols-1 gap-6 min-[640px]:grid-cols-2 lg:grid-cols-3">
                  {filteredSubjects.map((subject) => (
                        <SubjectCard
                          key={subject.id}
                          subject={subject}
                          isOwner={subject.ownerId === user?.uid}
                          counts={counts[subject.id]}
                          onDeleteRequest={setDeleteTarget}
                          onShare={handleShare}
                          onClick={() => navigate(`/subject/${subject.id}`)}
                        />
                  ))}
          </div>

          {filteredSubjects.length === 0 && (
            <p className="text-sm text-[#8A8175]">
              {subjects.length === 0
                ? "No folders yet. Use “Create folder” to start organizing your subjects."
                : "No folders match your search."}
            </p>
          )}
        </section>
      </main>

      <ConfirmDialog
            open={!!deleteTarget}
            title={`Delete "${deleteTarget?.subjectName || "this folder"}"?`}
            description="This permanently deletes the folder along with all its notes, flashcards, bookmarks, and pending join requests. This cannot be undone."
            onConfirm={handleDeleteConfirmed}
            onCancel={() => setDeleteTarget(null)}
            isLoading={isDeleting}
      />
      
    </div>
  );
}

export default SubDashboard;
