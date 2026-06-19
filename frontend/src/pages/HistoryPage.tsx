/**
 * HistoryPage — detection history with search, filter, sort, and pagination.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, History } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Pagination } from "../components/ui/Pagination";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { listDetections, deleteDetection } from "../services/detections";
import { queryKeys } from "../services/queryKeys";

const PAGE_SIZE = 20;

const sourceTypeOptions = [
  { value: "", label: "All types" },
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "webcam", label: "Webcam" },
];

const sortOptions = [
  { value: "-created_at", label: "Newest first" },
  { value: "created_at", label: "Oldest first" },
  { value: "-total_objects", label: "Most objects" },
  { value: "total_objects", label: "Fewest objects" },
];

function buildParams(search: string, sourceType: string, sort: string, page: number) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (sourceType) params.set("source_type", sourceType);
  if (sort) params.set("sort", sort);
  params.set("page", String(page));
  params.set("page_size", String(PAGE_SIZE));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function HistoryPage() {
  const [search, setSearch] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [sort, setSort] = useState("-created_at");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const params = buildParams(search, sourceType, sort, page);
  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.detections(params),
    queryFn: () => listDetections(params),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDetection,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["detections"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.analytics });
    },
  });

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleSourceType(value: string) {
    setSourceType(value);
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Detection History</h1>
        <p className="text-sm text-foreground/60">
          Browse, filter, and manage all detection records.
        </p>
      </div>

      <Card>
        {/* Filters bar */}
        <div className="mb-5 flex flex-wrap gap-3">
          <Input
            className="min-w-[200px] flex-1"
            placeholder="Search by source name…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            id="history-search"
          />
          <Select
            id="source-type-filter"
            className="w-44"
            value={sourceType}
            options={sourceTypeOptions}
            onChange={(e) => handleSourceType(e.target.value)}
          />
          <Select
            id="sort-order"
            className="w-48"
            value={sort}
            options={sortOptions}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
          />
          {isFetching && !isLoading && <Spinner size={20} className="self-center" />}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size={32} />
          </div>
        ) : !data?.items.length ? (
          <EmptyState
            icon={History}
            title="No detections found"
            description="Try adjusting your filters, or run a detection to see results here."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs font-semibold uppercase text-foreground/50">
                  <tr>
                    <th className="pb-3 pr-4">Source</th>
                    <th className="pb-3 pr-4">Type</th>
                    <th className="pb-3 pr-4">Objects</th>
                    <th className="pb-3 pr-4">Confidence</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Created</th>
                    <th className="pb-3" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition">
                      <td className="py-3 pr-4 font-medium">
                        <span className="block max-w-[200px] truncate" title={item.source_name}>
                          {item.source_name}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="info">{item.source_type}</Badge>
                      </td>
                      <td className="py-3 pr-4 font-semibold">{item.total_objects}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${item.average_confidence * 100}%` }}
                            />
                          </div>
                          <span>{Math.round(item.average_confidence * 100)}%</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={item.status === "completed" ? "success" : "warning"}>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-foreground/60">
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                      <td className="py-3">
                        <button
                          title="Delete detection"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (confirm(`Delete detection #${item.id}?`)) {
                              deleteMutation.mutate(item.id);
                            }
                          }}
                          className="rounded-md p-1.5 text-foreground/40 transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              className="mt-4 border-t border-border pt-4"
              page={page}
              pageSize={PAGE_SIZE}
              total={data.total}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>
    </div>
  );
}
