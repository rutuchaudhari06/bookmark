import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LogOut, X } from "lucide-react";

function getInitials(user) {
  const name = user?.displayName?.trim();

  if (name) {
    const parts = name.split(/\s+/);

    return parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }

  const email = user?.email || "";
  return email.slice(0, 2).toUpperCase() || "?";
}

export default function ProfileMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!open) return;

    const handleKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", handleKey);

    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  // Lock page scroll while drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!user) return null;

  const initials = getInitials(user);
  const displayName = user.displayName || user.email;

  const drawer = (
    <div
      className={`fixed inset-0 z-[1000] transition-opacity duration-300 ${
        open
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Drawer */}
      <div
        className={`absolute right-0 top-0 flex h-full w-full max-w-sm flex-col rounded-l-2xl bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.25)] transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#ECE3D1] px-6 py-4">
          <p className="text-sm font-semibold text-[#2F2F2F]">
            Account
          </p>

          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#8B8478] hover:bg-[#F7F4ED]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Profile */}
        <div className="flex flex-col items-center gap-3 px-6 py-8">
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#7A0912]/20 bg-[#F7F4ED] text-xl font-semibold text-[#7A0912]">
            {initials}
          </span>

          <div className="text-center">
            <p className="text-base font-semibold text-[#2F2F2F]">
              {displayName}
            </p>

            <p className="text-sm text-[#8B8478]">
              {user.email}
            </p>
          </div>
        </div>

        {/* Personal Information */}
        <div className="border-t border-[#ECE3D1] px-6 py-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#8B8478]">
            Personal Information
          </p>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[#8B8478]">Name</span>

              <span className="font-medium text-[#2F2F2F] truncate">
                {displayName}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-[#8B8478]">Email</span>

              <span className="font-medium text-[#2F2F2F] truncate">
                {user.email}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-[#8B8478]">Account type</span>

              <span className="font-medium text-[#2F2F2F]">
                Free
              </span>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="border-t border-[#ECE3D1] px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8B8478]">
            Settings
          </p>

          <p className="mt-2 text-xs text-[#8B8478]">
            More options coming soon.
          </p>
        </div>

        {/* Logout */}
        <div className="mt-auto border-t border-[#ECE3D1] px-6 py-5">
          <button
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-[#B3453F]/30 py-2.5 text-sm font-medium text-[#B3453F] hover:bg-[#B3453F]/10"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full transition-opacity hover:opacity-80"
      >
        <span className="hidden max-w-[160px] truncate text-[13px] font-medium text-[#F7F4ED]/90 sm:inline">
          {user.email}
        </span>

        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#F7F4ED]/30 bg-[#F7F4ED] text-[12px] font-semibold text-[#7A0912]">
          {initials}
        </span>
      </button>

      {createPortal(drawer, document.body)}
    </>
  );
}