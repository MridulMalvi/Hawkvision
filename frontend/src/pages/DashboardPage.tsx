/**
 * DashboardPage — analytics overview with KPI metrics and charts.
 */
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Box, Cpu, TrendingUp } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { getAnalytics } from "../services/analytics";
import { queryKeys } from "../services/queryKeys";
import type { AnalyticsSummary } from "../types";

export function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.analytics,
    queryFn: getAnalytics,
  });

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="h-28 animate-pulse" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="h-80 animate-pulse" />
          <Card className="h-80 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/40 bg-destructive/5 text-destructive">
        Unable to load analytics. Check that the backend is running.
      </Card>
    );
  }

  if (!data) {
    return (
      <EmptyState
        icon={Activity}
        title="No analytics yet"
        description="Run your first detection to see data here."
      />
    );
  }

  return <DashboardContent data={data} />;
}

function DashboardContent({ data }: { data: AnalyticsSummary }) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-foreground/60">Visual intelligence at a glance.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Activity}
          label="Total detections"
          value={data.total_detections.toLocaleString()}
          accent="text-primary"
        />
        <MetricCard
          icon={Box}
          label="Objects tracked"
          value={data.total_objects.toLocaleString()}
          accent="text-emerald-500"
        />
        <MetricCard
          icon={TrendingUp}
          label="Avg. confidence"
          value={`${Math.round(data.average_confidence * 100)}%`}
          accent="text-amber-500"
        />
        <MetricCard
          icon={Cpu}
          label="Active models"
          value="3"
          accent="text-violet-500"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Detection trend (14 days)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(v: string) => v.slice(5)} // MM-DD
              />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="detections"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">Most detected classes</h2>
          {data.most_detected_classes.length === 0 ? (
            <EmptyState
              icon={Box}
              title="No class data yet"
              description="Detections will appear here once you run some."
              className="border-0 py-8"
            />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.most_detected_classes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="class_name" tick={{ fontSize: 11 }} width={70} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <Card className="flex items-center gap-4">
      <div className={`rounded-lg bg-muted p-3 ${accent}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs text-foreground/55">{label}</p>
        <p className="mt-0.5 text-2xl font-bold">{value}</p>
      </div>
    </Card>
  );
}
