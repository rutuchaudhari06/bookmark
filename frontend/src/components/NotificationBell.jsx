import { useEffect, useRef, useState } from "react";
import { Bell, UserPlus, CheckCircle2, XCircle, Share2 } from "lucide-react";
import { getNotifications, markAllAsRead } from "../services/notificationService";

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

export default function NotificationBell({ userId }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  const load = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      setNotifications(await getNotifications(userId));
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [userId]);

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
    setOpen(next);
    if (next && unreadCount > 0) {
      await markAllAsRead(userId, notifications);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-cream-dark hover:bg-cream-dark/10"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-[#7d0000]" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 max-h-96 w-80 overflow-y-auto rounded-xl border border-[#cfc4b3] bg-[#fbf7f0] shadow-lg">
          <div className="border-b border-[#d0c7be] px-4 py-2 text-sm font-semibold text-foreground">
            Notifications
          </div>
          {loading ? (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-[#e2d8c8]">
              {notifications.map((n) => {
                const Icon = ICONS[n.type] || Bell;
                return (
                  <li key={n.id} className={`flex gap-3 px-4 py-3 ${!n.read ? "bg-[#f0e6d2]" : ""}`}>
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4b6478]/10 text-[#4b6478]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{n.description}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{timeAgo(n.createdAt)}</p>
                    </div>
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