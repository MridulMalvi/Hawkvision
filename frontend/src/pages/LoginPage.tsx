/**
 * LoginPage — sign-in and registration in a single tabbed card.
 */
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { login, register } from "../services/auth";
import { setToken } from "../store/auth";
import { cn } from "../lib/utils";

type Tab = "login" | "register";

export function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("login");

  // Shared fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Register-only field
  const [fullName, setFullName] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function switchTab(next: Tab) {
    setTab(next);
    setError("");
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (tab === "login") {
        const response = await login(email, password);
        setToken(response.access_token);
        navigate("/");
      } else {
        if (fullName.trim().length < 2) {
          setError("Full name must be at least 2 characters.");
          return;
        }
        await register(email, fullName.trim(), password);
        // Auto-login after successful registration
        const response = await login(email, password);
        setToken(response.access_token);
        navigate("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <Card className="w-full max-w-md">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-md bg-primary p-2 text-white">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Hawkvision</h1>
            <p className="text-sm text-foreground/60">Enterprise visual intelligence</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-md bg-muted p-1">
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => switchTab(t)}
              className={cn(
                "rounded-md py-2 text-sm font-medium transition",
                tab === t ? "bg-card shadow-sm" : "text-foreground/60 hover:text-foreground"
              )}
            >
              {t === "login" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          {tab === "register" && (
            <Input
              id="full-name"
              label="Full name"
              type="text"
              autoComplete="name"
              placeholder="Jane Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              minLength={2}
            />
          )}

          <Input
            id="email"
            label="Email address"
            type="email"
            autoComplete={tab === "login" ? "username" : "email"}
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-foreground/80">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete={tab === "login" ? "current-password" : "new-password"}
                placeholder={tab === "register" ? "Minimum 8 characters" : "••••••••"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className={cn(
                  "h-10 w-full rounded-md border border-border bg-background px-3 pr-10 text-sm",
                  "placeholder:text-foreground/40",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                  "transition"
                )}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? tab === "login"
                ? "Signing in…"
                : "Creating account…"
              : tab === "login"
              ? "Sign in"
              : "Create account"}
          </Button>
        </form>

        {tab === "login" && (
          <p className="mt-4 text-center text-xs text-foreground/50">
            No account?{" "}
            <button
              type="button"
              className="text-primary underline-offset-2 hover:underline"
              onClick={() => switchTab("register")}
            >
              Create one for free
            </button>
          </p>
        )}
      </Card>
    </div>
  );
}
