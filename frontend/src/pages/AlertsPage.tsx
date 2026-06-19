/**
 * AlertsPage — manage alert rules and view recent alert events.
 */
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Trash2 } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { createAlertRule, deleteAlertRule, listAlertEvents, listAlertRules } from "../services/alerts";
import { queryKeys } from "../services/queryKeys";

export function AlertsPage() {
  const [name, setName] = useState("");
  const [className, setClassName] = useState("person");
  const [minConfidence, setMinConfidence] = useState(75);
  const [recipients, setRecipients] = useState("");
  const [formError, setFormError] = useState("");
  const queryClient = useQueryClient();

  const rules = useQuery({ queryKey: queryKeys.alertRules, queryFn: listAlertRules });
  const events = useQuery({ queryKey: queryKeys.alertEvents, queryFn: listAlertEvents });

  const createMutation = useMutation({
    mutationFn: () =>
      createAlertRule({
        name,
        class_name: className,
        min_confidence: minConfidence / 100,
        email_recipients: recipients
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
        is_active: true,
      }),
    onSuccess: () => {
      setName("");
      setRecipients("");
      setFormError("");
      void queryClient.invalidateQueries({ queryKey: queryKeys.alertRules });
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : "Failed to create rule");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAlertRule,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.alertRules });
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setFormError("Rule name is required.");
      return;
    }
    setFormError("");
    createMutation.mutate();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Alerts</h1>
        <p className="text-sm text-foreground/60">
          Configure detection-triggered alert rules and view recent events.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        {/* ── Rule management ──────────────────────────────────────────── */}
        <div className="space-y-4">
          <Card>
            <h2 className="mb-4 font-semibold">Create alert rule</h2>
            <form className="space-y-3" onSubmit={onSubmit}>
              <Input
                id="rule-name"
                label="Rule name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Person detected"
                required
              />
              <Input
                id="class-name"
                label="Object class"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g. person, car, helmet"
                required
              />
              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <label className="text-sm font-medium text-foreground/80" htmlFor="min-confidence">
                    Min. confidence
                  </label>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-bold">
                    {minConfidence}%
                  </span>
                </div>
                <input
                  id="min-confidence"
                  type="range"
                  min={10}
                  max={99}
                  step={1}
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(Number(e.target.value))}
                  className="w-full accent-[hsl(var(--primary))]"
                />
              </div>
              <Input
                id="recipients"
                label="Email recipients (comma-separated)"
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                placeholder="alice@co.com, bob@co.com"
                type="text"
              />
              {formError && (
                <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                  {formError}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating…" : "Create rule"}
              </Button>
            </form>
          </Card>

          {/* Existing rules */}
          <Card>
            <h2 className="mb-3 font-semibold">Active rules</h2>
            {rules.isLoading && (
              <div className="flex justify-center py-6">
                <Spinner />
              </div>
            )}
            {!rules.isLoading && !rules.data?.length && (
              <EmptyState
                icon={Bell}
                title="No rules yet"
                description="Create a rule above to start receiving alerts."
              />
            )}
            <div className="space-y-2">
              {rules.data?.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between rounded-md border border-border p-3"
                >
                  <div>
                    <p className="font-semibold">{rule.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge variant="info">{rule.class_name}</Badge>
                      <Badge variant="default">
                        ≥{Math.round(rule.min_confidence * 100)}%
                      </Badge>
                      <Badge variant={rule.is_active ? "success" : "warning"}>
                        {rule.is_active ? "active" : "paused"}
                      </Badge>
                    </div>
                  </div>
                  <button
                    title="Delete rule"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (confirm(`Delete rule "${rule.name}"?`)) {
                        deleteMutation.mutate(rule.id);
                      }
                    }}
                    className="ml-3 rounded-md p-1.5 text-foreground/40 transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Recent events ─────────────────────────────────────────────── */}
        <Card>
          <h2 className="mb-4 font-semibold">Recent alert events</h2>
          {events.isLoading && (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          )}
          {!events.isLoading && !events.data?.length && (
            <EmptyState
              icon={Bell}
              title="No events yet"
              description="Alert events appear here when detection rules are triggered."
            />
          )}
          <div className="space-y-3">
            {events.data?.map((event) => (
              <div key={event.id} className="rounded-md border border-border p-3">
                <p className="text-sm font-medium">{event.message}</p>
                <p className="mt-1 text-xs text-foreground/50">
                  {new Date(event.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
