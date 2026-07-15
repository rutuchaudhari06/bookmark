import { useEffect, useRef, useState } from "react";
import { Bell, UserPlus, CheckCircle2, XCircle, Share2, Folder } from "lucide-react";
import {
  subscribeToNotifications,
  markAllAsRead,
  deleteNotification,
} from "../services/notificationService";
import { approveJoinRequest, rejectJoinRequest } from "../services/joinRequestService";

const ICONS = {
  join_request: UserPlus,
  request_approved: CheckCircle2,
  request_rejected: XCircle,
  folder_shared: Share2,
};

function timeAgo(ts) {
  if (!ts?.toDate) return "";
  const diffMs = Date.now() - ts.toDate().getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell({ userId, open, onOpen, onClose}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const wrapperRef = useRef(null);

  // Live subscription — this is the single notification center for the whole
  // app (dashboard + subject page both mount this same component), so every
  // access request, approval, and rejection lands here in real time.
  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeToNotifications(userId, (list) => {
      setNotifications(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleToggle = async () => {
    const next = !open;
    next ? onOpen() : onClose();
    if (next && unreadCount > 0) {
      // Optimistic update; the live listener will confirm it moments later.
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      await markAllAsRead(userId, notifications);
    }
  };

  const handleApprove = async (n) => {
    if (!n.subjectId || !n.requestId || !n.requesterId) return;
    setActionId(n.id);
    try {
      await approveJoinRequest(n.subjectId, n.requestId, n.requesterId);
      await deleteNotification(userId, n.id);
    } catch (error) {
      console.error("Failed to approve request:", error);
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (n) => {
    if (!n.subjectId || !n.requestId || !n.requesterId) return;
    setActionId(n.id);
    try {
      await rejectJoinRequest(n.subjectId, n.requestId, n.requesterId);
      await deleteNotification(userId, n.id);
    } catch (error) {
      console.error("Failed to reject request:", error);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#F7F4ED] hover:bg-[#F7F4ED]/10"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-[#7A0912]" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 max-h-[28rem] w-96 overflow-y-auto rounded-xl border border-[#ECE3D1] bg-white shadow-lg">
          <div className="border-b border-[#ECE3D1] px-4 py-2 text-sm font-semibold text-[#2F2F2F]">
            Notifications
          </div>
          {loading ? (
            <p className="px-4 py-6 text-center text-xs text-[#8B8478]">Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-[#8B8478]">No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-[#ECE3D1]">
              {notifications.map((n) => {
                const isPendingRequest = n.type === "join_request" && n.requestId;
                const Icon = ICONS[n.type] || Bell;
                return (
                  <li key={n.id} className={`px-4 py-3 ${!n.read ? "bg-[#F7F4ED]" : ""}`}>
                    {isPendingRequest ? (
                      <div className="flex flex-col gap-2.5">
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7A0912]/10 text-[#7A0912]">
                            <UserPlus className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-[#2F2F2F]">
                              <span className="font-semibold">{n.requesterName || "Someone"}</span>{" "}
                              requested access to{" "}
                              <span className="inline-flex items-center gap-1 font-semibold">
                                <Folder className="h-3.5 w-3.5 text-[#8B8478]" />
                                {n.subjectName || "your folder"}
                              </span>
                            </p>
                            <p className="mt-0.5 text-[10px] text-[#8B8478]">{timeAgo(n.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pl-11">
                          <button
                            type="button"
                            disabled={actionId === n.id}
                            onClick={() => handleReject(n)}
                            className="rounded-full border border-[#ECE3D1] px-3 py-1 text-xs font-medium text-[#5C584F] transition-colors duration-200 hover:bg-[#F7F4ED] disabled:opacity-50"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            disabled={actionId === n.id}
                            onClick={() => handleApprove(n)}
                            className="rounded-full bg-[#7A0912] px-3 py-1 text-xs font-medium text-white transition-opacity duration-200 hover:opacity-90 disabled:opacity-50"
                          >
                            {actionId === n.id ? "…" : "Approve"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7A0912]/10 text-[#7A0912]">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[#2F2F2F]">{n.title}</p>
                          <p className="truncate text-xs text-[#8B8478]">{n.description}</p>
                          <p className="mt-0.5 text-[10px] text-[#8B8478]">{timeAgo(n.createdAt)}</p>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}