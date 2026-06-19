/**
 * ReportsPage — download detection history in CSV, Excel, or PDF format.
 */
import { useState } from "react";
import { Download, FileSpreadsheet, FileText, FileType } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { downloadFile } from "../services/api";

type ReportFormat = "csv" | "xlsx" | "pdf";

const reports: { format: ReportFormat; label: string; description: string; icon: typeof Download }[] = [
  {
    format: "csv",
    label: "CSV",
    description: "Comma-separated values — import into Excel, Google Sheets, or Python.",
    icon: FileText,
  },
  {
    format: "xlsx",
    label: "Excel",
    description: "Native Excel workbook with formatted columns.",
    icon: FileSpreadsheet,
  },
  {
    format: "pdf",
    label: "PDF",
    description: "Printable detection report with all records.",
    icon: FileType,
  },
];

export function ReportsPage() {
  const [loading, setLoading] = useState<ReportFormat | null>(null);
  const [error, setError] = useState("");

  async function download(format: ReportFormat) {
    setLoading(format);
    setError("");
    try {
      await downloadFile(`/reports/detections.${format}`, `hawkvision-report.${format}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-foreground/60">
          Export your detection history in your preferred format.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {reports.map(({ format, label, description, icon: Icon }) => (
          <button
            key={format}
            id={`download-${format}`}
            disabled={loading !== null}
            onClick={() => void download(format)}
            className="group flex flex-col gap-3 rounded-lg border border-border p-5 text-left transition hover:border-primary hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-md bg-primary/10 p-2.5 text-primary group-hover:bg-primary/15 transition">
                <Icon size={22} />
              </div>
              {loading === format ? (
                <Spinner size={18} />
              ) : (
                <Download
                  size={18}
                  className="text-foreground/30 transition group-hover:text-primary"
                />
              )}
            </div>
            <div>
              <p className="font-semibold">{label}</p>
              <p className="mt-0.5 text-sm text-foreground/60">{description}</p>
            </div>
          </button>
        ))}
      </div>

      <Card className="text-sm text-foreground/60">
        <p>
          Reports include all detection records you have access to. Admins see data
          from all users; regular users see only their own.
        </p>
      </Card>
    </div>
  );
}
