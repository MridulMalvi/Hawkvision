/**
 * SettingsPage — user profile and application preferences.
 */
import type { ReactNode } from "react";
import { Moon, Sun, User, Shield, Mail, Calendar } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";

export function SettingsPage() {
  const { data: user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-foreground/60">Manage your profile and preferences.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ── Profile ──────────────────────────────────────────────────── */}
        <Card>
          <h2 className="mb-4 font-semibold">Profile</h2>
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User size={28} />
                </div>
                <div>
                  <p className="text-lg font-bold">{user.full_name}</p>
                  <Badge variant={user.role === "admin" ? "info" : "default"}>
                    <Shield size={10} className="mr-1 inline" />
                    {user.role}
                  </Badge>
                </div>
              </div>

              <div className="divide-y divide-border rounded-md border border-border">
                <Row icon={<Mail size={15} />} label="Email" value={user.email} />
                <Row
                  icon={<Calendar size={15} />}
                  label="Member since"
                  value={new Date(user.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                />
                <Row
                  icon={<Shield size={15} />}
                  label="Account status"
                  value={
                    <Badge variant={user.is_active ? "success" : "danger"}>
                      {user.is_active ? "Active" : "Suspended"}
                    </Badge>
                  }
                />
              </div>
            </div>
          ) : (
            <div className="h-32 animate-pulse rounded-md bg-muted" />
          )}
        </Card>

        {/* ── Preferences ──────────────────────────────────────────────── */}
        <Card>
          <h2 className="mb-4 font-semibold">Appearance</h2>
          <div className="flex items-center justify-between rounded-md border border-border p-4">
            <div>
              <p className="font-medium">Color scheme</p>
              <p className="text-sm text-foreground/60">
                Currently: <span className="font-semibold capitalize">{theme}</span> mode
              </p>
            </div>
            <button
              id="theme-toggle"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              {theme === "dark" ? "Switch to light" : "Switch to dark"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="text-foreground/40">{icon}</span>
      <span className="w-28 shrink-0 text-sm text-foreground/60">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
