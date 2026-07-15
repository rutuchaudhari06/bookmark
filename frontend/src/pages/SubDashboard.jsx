import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Plus, Search } from "lucide-react";

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
import ProfileMenu from "../components/ProfileMenu";
import Toast from "../components/Toast";

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
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const [activePanel, setActivePanel] = useState(null);
// null | "notification" | "profile"

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3000);
  };

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
    try {
      const token = await generateShareToken(subjectId);
      const shareLink = `${window.location.origin}/join/${token}`;
      await navigator.clipboard.writeText(shareLink);
      showToast("Folder link copied to clipboard", "success");
    } catch (error) {
      console.error("Failed to share folder:", error);
      showToast("Unable to copy link. Please try again.", "error");
    }
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
      {/* Top of page — the header IS the cover of one large master folder,
          lying flush against the top of the page (not a floating card).
          A single tab pokes up on the left, the wide flap below sweeps into
          the cream page with an uneven, hand-cut curve, and every folder
          card beneath it reads as what's stored inside. */}
      <header className="relative w-full">
        {/* cream folder lip (matches page background) */}
              <svg
                className="absolute left-0 top-0 z-10 h-[121.75px] w-[260px]"
                viewBox="0 0 260 111"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="fadeToCream" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F7F4ED" stopOpacity="1"/>
                    <stop offset="90%" stopColor="#F7F4ED" stopOpacity="1"/>
                    <stop offset="100%" stopColor="#F7F4ED" stopOpacity="0" />
                  </linearGradient>
                </defs>

                <path
                  d="M0,0
                    L180,0
                    Q220,0 220,34
                    L220,80
                    Q220,111 260,111
                    L0,111
                    Z"
                  fill="url(#fadeToCream)"
                />
              </svg>

        {/* burgundy header flap */}
        <div className="relative z-0 flex h-[110px] w-full items-center rounded-br-[0px] bg-[#7A0912] shadow-[0_10px_18px_-8px_rgba(0,0,0,0.18)]">
          <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between pl-6 pr-6 md:pl-10 md:pr-10">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-[#F7F4ED]/25">
                <BookOpen className="h-4 w-4 text-[#F7F4ED]" />
              </span>
              <p className="text-[16px] font-semibold tracking-tight text-[#F7F4ED]">
                AIMarks
              </p>
            </div>

            <div className="ml-auto flex items-center gap-2.5 md:gap-4">
              
              <div className="relative z-0 flex h-[100px] w-full items-center justify-end gap-5">
                        {user && <ProfileMenu user={user} onLogout={handleLogout} open={activePanel === "profile"} onOpen={() => setActivePanel("profile")} onClose={() => setActivePanel(null)}/>}
                        {user && <NotificationBell userId={user.uid} open={activePanel === "notification"} onOpen={() => setActivePanel("notification")} onClose={() => setActivePanel(null)}/>}
              </div>
            </div>
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

      <Toast toast={toast} />
    </div>
  );
}

export default SubDashboard;