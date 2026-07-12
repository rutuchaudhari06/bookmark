import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Plus, LogOut, Search } from "lucide-react";

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
    <div className="min-h-screen bg-[#F7F4ED]">
      {/* Top navigation / header — burgundy panel, with only the tab in cream */}
      <header className="relative h-[104px] px-4 pt-4 sm:px-8">
        {/* Folder tab — the ONLY cream part, peeking above the burgundy panel */}
        <div
          className="absolute left-8 top-0 z-0 h-8 w-36 rounded-t-xl sm:left-12 sm:w-44"
          style={{ backgroundColor: "#F6F1E8" }}
          aria-hidden="true"
        />

        {/* Burgundy header panel — everything else in the header */}
        <div
          className="relative z-10 flex h-full items-center justify-between rounded-2xl px-6 sm:px-10"
          style={{
            backgroundColor: "#7D0A0A",
            boxShadow: "0 6px 16px -8px rgba(30,4,4,0.45)",
          }}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-md border border-[#F8F4ED]/25">
              <BookOpen className="h-4 w-4 text-[#F8F4ED]" />
            </span>
            <div className="leading-tight">
              <p className="text-[17px] font-semibold tracking-tight text-[#F8F4ED]">
                AIMarks
              </p>
              <p className="text-[12px] text-[#F8F4ED]/60">
                Your saved knowledge
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <>
                <span className="hidden text-sm text-[#F8F4ED]/85 sm:inline">
                  {user.email}
                </span>
                <span className="hidden h-5 w-px bg-[#F8F4ED]/20 sm:inline-block" aria-hidden="true" />
                <NotificationBell userId={user.uid} />
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-md border-[#F8F4ED]/25 bg-transparent text-[#F8F4ED] transition-colors duration-200 hover:bg-[#F8F4ED] hover:text-[#7D0A0A]"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-8 py-12">
        {/* Search + actions row (outside any container) */}
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="relative w-full max-w-md">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[#8B8478]">
                  <Search className="h-4 w-4" />
                </span>
                <Input
                  className="h-12 rounded-full border-[#ECE3D1] bg-[#FCFAF6] pl-10 shadow-[0_1px_4px_rgba(47,47,47,0.05)]"
                  placeholder="Search your folder"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="mt-2 flex justify-end md:mt-0">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="gap-2 rounded-full border-[#7A0912]/25 bg-[#FCFAF6] px-6 text-sm font-medium text-[#7A0912] shadow-[0_1px_4px_rgba(47,47,47,0.05)] transition-all duration-200 hover:bg-[#7A0912] hover:text-[#FCFAF6] hover:shadow-md"
              onClick={() => setIsCreateOpen(true)}
              disabled={isCreating}
            >
              <Plus className="h-4 w-4" />
              {isCreating ? "Creating..." : "Create folder"}
            </Button>
          </div>
        </section>

        {isCreateOpen && (
          <section className="rounded-2xl border border-[#ECE3D1] bg-[#FCFAF6] p-5 shadow-[0_1px_6px_rgba(47,47,47,0.05)]">
            <form
              className="flex flex-col gap-3 md:flex-row md:items-center"
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
                className="h-11 rounded-full bg-white"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  className="h-11 rounded-full"
                  disabled={!subjectName.trim() || isCreating}
                >
                  {isCreating ? "Creating..." : "Create"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-full"
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

        {/* Subjects grid (cards sit on page background, not in container) */}
        <section className="space-y-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
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
            <p className="text-sm text-[#8B8478]">
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