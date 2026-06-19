import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Bell, Camera, FileBarChart, History, LayoutDashboard, LogOut, Settings, UploadCloud } from "lucide-react";
import { clearToken } from "../store/auth";
import { useAuth } from "../hooks/useAuth";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/detect", label: "Detection", icon: Camera },
  { to: "/history", label: "History", icon: History },
  { to: "/reports", label: "Reports", icon: FileBarChart },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings }
];

export function AppLayout() {
  const navigate = useNavigate();
  const { data: user } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-card p-4 lg:block">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-white"><UploadCloud size={20} /></div>
          <div>
            <p className="text-lg font-bold">Hawkvision</p>
            <p className="text-xs text-foreground/60">Visual intelligence</p>
          </div>
        </div>
        <nav className="space-y-1">
          {nav.map((item) => (
            <NavItem key={item.to} item={item} />
          ))}
        </nav>
      </aside>
      <main className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-card/95 px-5 backdrop-blur">
          <div>
            <p className="font-semibold">Operations Command Center</p>
            <p className="text-xs text-foreground/60">{user?.full_name ?? "Loading profile"}</p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
            onClick={() => {
              clearToken();
              navigate("/login");
            }}
          >
            <LogOut size={16} /> Sign out
          </button>
        </header>
        <div className="p-5">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function NavItem({ item }: { item: (typeof nav)[number] }) {
  const Icon = item.icon;
  return (
    <NavLink to={item.to} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? "bg-muted font-semibold" : "text-foreground/70 hover:bg-muted"}`}>
      <Icon size={18} /> {item.label}
    </NavLink>
  );
}
