import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LogOut, History, User as UserIcon, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function UserMenu() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  if (loading) return <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />;

  if (!user) {
    return (
      <Link to="/auth" className="text-sm font-semibold text-primary hover:underline">
        Sign in
      </Link>
    );
  }

  const initial = (user.user_metadata?.full_name ?? user.email ?? "U").charAt(0).toUpperCase();

  const signOut = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    navigate({ to: "/" });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1 text-sm font-medium hover:bg-accent"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-hero text-xs font-bold text-white">
          {initial}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-card-hover">
            <div className="border-b border-border px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <UserIcon className="h-4 w-4 text-primary" />
                <span className="truncate">{user.user_metadata?.full_name ?? user.email}</span>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Link
              to="/history"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent"
            >
              <History className="h-4 w-4" /> My analyses
            </Link>
            <button
              onClick={signOut}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-accent"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}