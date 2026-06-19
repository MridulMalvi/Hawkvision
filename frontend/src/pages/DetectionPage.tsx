import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  CheckCircle2,
  FileImage,
  FileVideo,
  Gauge,
  LoaderCircle,
  ScanSearch,
  Upload,
  Video
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { cn } from "../lib/utils";
import { uploadDetection } from "../services/detections";
import { queryKeys } from "../services/queryKeys";
import type { Detection, TrackedObject } from "../types";

type SourceType = "image" | "video" | "webcam";

const sourceOptions = [
  { value: "image" as const, label: "Image", icon: FileImage },
  { value: "video" as const, label: "Video", icon: FileVideo },
  { value: "webcam" as const, label: "Camera", icon: Camera }
];

const modelOptions = [
  { value: "yolov8n", label: "Nano", detail: "Fastest" },
  { value: "yolov8s", label: "Small", detail: "Recommended" },
  { value: "yolov8m", label: "Medium", detail: "Most accurate" }
];

export function DetectionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [confidence, setConfidence] = useState(0.45);
  const [model, setModel] = useState("yolov8s");
  const [source, setSource] = useState<SourceType>("image");
  const [dragging, setDragging] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const media = source === "webcam" ? await captureFrame() : file;
      if (!media) throw new Error("Choose a file before starting analysis.");
      return uploadDetection(media, confidence, model, source);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["detections"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.analytics });
    }
  });

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [previewUrl]);

  function selectFile(nextFile: File | null) {
    mutation.reset();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(nextFile);
    setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : "");
  }

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0] ?? null);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files[0] ?? null);
  }

  function changeSource(nextSource: SourceType) {
    setSource(nextSource);
    selectFile(null);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraError("");
  }

  async function startCamera() {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCameraError("Camera access was denied or no camera is available.");
    }
  }

  async function captureFrame() {
    if (!videoRef.current?.videoWidth) throw new Error("Start the camera and wait for the preview.");
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("Unable to capture frame"))), "image/jpeg", 0.92)
    );
    const captured = new File([blob], "webcam-frame.jpg", { type: "image/jpeg" });
    selectFile(captured);
    return captured;
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Detection workspace</h1>
        <p className="mt-1 text-sm text-foreground/60">Analyze media with a pretrained YOLOv8 model and inspect every prediction.</p>
      </header>

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="h-fit">
          <div className="grid grid-cols-3 gap-1 rounded-md bg-muted p-1">
            {sourceOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  className={cn(
                    "flex h-10 items-center justify-center gap-2 rounded-md text-sm font-medium transition",
                    source === option.value ? "bg-card shadow-sm" : "text-foreground/60 hover:text-foreground"
                  )}
                  onClick={() => changeSource(option.value)}
                >
                  <Icon size={16} /> {option.label}
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold">Model</p>
            <div className="grid grid-cols-3 gap-2">
              {modelOptions.map((option) => (
                <button
                  key={option.value}
                  className={cn(
                    "min-h-16 rounded-md border p-2 text-left transition",
                    model === option.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                  )}
                  onClick={() => setModel(option.value)}
                >
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span className="block text-xs text-foreground/55">{option.detail}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold" htmlFor="confidence">Confidence threshold</label>
              <span className="rounded-md bg-muted px-2 py-1 text-xs font-bold">{Math.round(confidence * 100)}%</span>
            </div>
            <input
              id="confidence"
              className="mt-3 w-full accent-[hsl(var(--primary))]"
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={confidence}
              onChange={(event) => setConfidence(Number(event.target.value))}
            />
            <div className="flex justify-between text-xs text-foreground/45"><span>More results</span><span>Higher precision</span></div>
          </div>

          <div className="mt-6">
            {source === "webcam" ? (
              <div className="space-y-3">
                <video ref={videoRef} autoPlay muted playsInline className="aspect-video w-full rounded-md bg-black object-cover" />
                <Button type="button" className="w-full bg-foreground text-background" onClick={() => void startCamera()}>
                  <Video className="mr-2" size={17} /> Start camera
                </Button>
                {cameraError ? <p className="text-sm text-red-600">{cameraError}</p> : null}
              </div>
            ) : (
              <label
                className={cn(
                  "flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed p-5 text-center transition",
                  dragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                )}
                onDragEnter={() => setDragging(true)}
                onDragLeave={() => setDragging(false)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={onDrop}
              >
                <Upload className="mb-3 text-primary" size={26} />
                <span className="text-sm font-semibold">{file ? file.name : `Drop ${source} here`}</span>
                <span className="mt-1 text-xs text-foreground/55">
                  {file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : "or click to browse, up to 200 MB"}
                </span>
                <input className="hidden" type="file" accept={source === "image" ? "image/*" : "video/*"} onChange={onFile} />
              </label>
            )}
          </div>

          <Button
            className="mt-4 w-full"
            disabled={(source !== "webcam" && !file) || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? <LoaderCircle className="mr-2 animate-spin" size={17} /> : <ScanSearch className="mr-2" size={17} />}
            {mutation.isPending ? "Running inference..." : source === "webcam" ? "Capture and analyze" : "Analyze media"}
          </Button>
          {mutation.isPending ? <p className="mt-2 text-center text-xs text-foreground/55">The first model run can take a few seconds.</p> : null}
        </Card>

        <ResultPanel source={source} previewUrl={previewUrl} result={mutation.data} error={mutation.error} />
      </div>
    </div>
  );
}

function ResultPanel({
  source,
  previewUrl,
  result,
  error
}: {
  source: SourceType;
  previewUrl: string;
  result?: Detection;
  error: Error | null;
}) {
  const classCounts = useMemo(() => {
    const counts = new Map<string, number>();
    result?.tracked_objects.forEach((object) => counts.set(object.class_name, (counts.get(object.class_name) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [result]);

  return (
    <div className="min-w-0 space-y-5">
      <Card className="overflow-hidden p-0">
        <div className="flex min-h-12 items-center justify-between border-b border-border px-4">
          <p className="font-semibold">Media preview</p>
          {result ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <CheckCircle2 size={15} /> Inference complete
            </span>
          ) : null}
        </div>
        <div className="grid min-h-[420px] place-items-center bg-black/95 p-4">
          {previewUrl ? (
            source === "video" ? (
              <video src={previewUrl} controls className="max-h-[620px] max-w-full" />
            ) : (
              <DetectionImage src={previewUrl} result={result} />
            )
          ) : (
            <div className="text-center text-white/55">
              <ScanSearch className="mx-auto mb-3" size={38} />
              <p className="font-medium">Your media will appear here</p>
              <p className="mt-1 text-sm">Choose an image, video, or live camera feed.</p>
            </div>
          )}
        </div>
      </Card>

      {error ? <Card className="border-red-500/40 bg-red-500/5 text-sm text-red-600">{error.message}</Card> : null}

      {result ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <ResultMetric icon={ScanSearch} label="Objects" value={result.total_objects} />
            <ResultMetric icon={Gauge} label="Avg. confidence" value={`${Math.round(result.average_confidence * 100)}%`} />
            <ResultMetric icon={LoaderCircle} label="Inference time" value={`${result.duration_ms} ms`} />
          </div>

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Predictions</h2>
                <p className="text-sm text-foreground/55">{result.model_name.toUpperCase()} · COCO pretrained weights</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {classCounts.map(([className, count]) => (
                  <span key={className} className="rounded-md bg-muted px-2.5 py-1 text-xs font-semibold">{className} · {count}</span>
                ))}
              </div>
            </div>

            {result.tracked_objects.length ? (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-xs uppercase text-foreground/50">
                    <tr><th className="pb-3">Object</th><th className="pb-3">Track ID</th><th className="pb-3">Confidence</th></tr>
                  </thead>
                  <tbody>
                    {result.tracked_objects.map((object) => (
                      <tr key={object.id} className="border-b border-border last:border-0">
                        <td className="py-3 font-semibold capitalize">{object.class_name}</td>
                        <td className="py-3 font-mono text-xs">{object.track_id}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                              <div className="h-full bg-primary" style={{ width: `${object.confidence * 100}%` }} />
                            </div>
                            <span>{Math.round(object.confidence * 100)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-5 rounded-md border border-dashed border-border p-6 text-center text-sm text-foreground/60">
                No objects exceeded the current confidence threshold. Try lowering it and run again.
              </div>
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}

function DetectionImage({ src, result }: { src: string; result?: Detection }) {
  const width = result?.metadata_json.image_width ?? 0;
  const height = result?.metadata_json.image_height ?? 0;
  const boxes = result?.tracked_objects ?? [];

  return (
    <div className="relative inline-block max-w-full">
      <img src={src} alt="Detection source" className="block max-h-[620px] max-w-full" />
      {width && height ? boxes.map((object, index) => <BoundingBox key={object.id} object={object} index={index} width={width} height={height} />) : null}
    </div>
  );
}

function BoundingBox({
  object,
  index,
  width,
  height
}: {
  object: TrackedObject;
  index: number;
  width: number;
  height: number;
}) {
  const colors = ["#22d3ee", "#facc15", "#34d399", "#fb7185", "#a78bfa", "#fb923c"];
  const color = colors[index % colors.length];
  const { x1, y1, x2, y2 } = object.bbox;
  return (
    <div
      className="pointer-events-none absolute border-2"
      style={{
        borderColor: color,
        left: `${(x1 / width) * 100}%`,
        top: `${(y1 / height) * 100}%`,
        width: `${((x2 - x1) / width) * 100}%`,
        height: `${((y2 - y1) / height) * 100}%`
      }}
    >
      <span className="absolute bottom-full left-[-2px] whitespace-nowrap px-1.5 py-0.5 text-xs font-bold text-black" style={{ backgroundColor: color }}>
        {object.class_name} {Math.round(object.confidence * 100)}%
      </span>
    </div>
  );
}

function ResultMetric({
  icon: Icon,
  label,
  value
}: {
  icon: typeof ScanSearch;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="flex items-center gap-3">
      <div className="rounded-md bg-primary/10 p-2 text-primary"><Icon size={20} /></div>
      <div><p className="text-xs text-foreground/55">{label}</p><p className="text-xl font-bold">{value}</p></div>
    </Card>
  );
}
