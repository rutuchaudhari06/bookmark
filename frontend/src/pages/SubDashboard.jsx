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
    <div className="min-h-screen bg-[#f3eee5]">
      {/* Top navigation / header */}
      <header className="border-b border-border bg-[#7d0000] text-cream-dark">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cream-dark/90">
              <Bookmark className="h-5 w-5 text-[#7d0000]" />
            </div>
            <div>
              <p className="font-serif text-xl font-semibold text-cream-dark">
                AIMarks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user && (
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-cream-dark">{user.email}</span>
                  </div>
                  <NotificationBell userId={user.uid} />
                </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-cream-dark/40 bg-transparent text-cream-dark hover:bg-[#f7f2ea] hover:text-[#7d0000]"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
        {/* Search + actions row (outside any container) */}
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="relative w-full max-w-md">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                  <Search className="h-4 w-4" />
                </span>
                <Input
                  className="h-11 rounded-full bg-[#fbf7f0] pl-9"
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
              className="gap-2 rounded-full border-[#b34747] bg-[#f7f2ea] px-6 text-sm font-medium text-[#7d0000] hover:bg-[#7d0000] hover:text-[#f7f2ea]"
              onClick={() => setIsCreateOpen(true)}
              disabled={isCreating}
            >
              <Plus className="h-4 w-4" />
              {isCreating ? "Creating..." : "Create folder"}
            </Button>
          </div>
        </section>

        {isCreateOpen && (
          <section className="rounded-xl border border-[#cfc4b3] bg-[#fbf7f0] p-4 shadow-sm">
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
                className="h-11 bg-white"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  className="h-11"
                  disabled={!subjectName.trim() || isCreating}
                >
                  {isCreating ? "Creating..." : "Create"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11"
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
        <section className="mt-2 space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
            <p className="text-sm text-muted-foreground">
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
