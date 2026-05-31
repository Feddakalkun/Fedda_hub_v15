import { useState } from 'react';
import type { DragEvent as ReactDragEvent } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Camera, Expand, Loader2, Minus, Plus, RefreshCw, Upload } from 'lucide-react';
import { BACKEND_API } from '../../config/api';
import { useToast } from '../../components/ui/Toast';
import { Lightbox } from '../../components/ui/Lightbox';
import { usePersistentState } from '../../hooks/usePersistentState';

const MAX_SHOTS = 6;

type CameraShot = {
  label: string;
  h: number;
  v: number;
  z: number;
};

const DEFAULT_SHOTS: CameraShot[] = [
  { label: 'Shot 1', h: 0, v: 0, z: 5 },
  { label: 'Shot 2', h: -45, v: 0, z: 5 },
  { label: 'Shot 3', h: 45, v: 0, z: 5 },
  { label: 'Shot 4', h: 0, v: 28, z: 5 },
  { label: 'Shot 5', h: 0, v: -28, z: 5 },
  { label: 'Shot 6', h: 180, v: 0, z: 4 },
];

const H_PRESETS = [
  { label: 'Front', value: 0 },
  { label: 'Left 30', value: -30 },
  { label: 'Right 30', value: 30 },
  { label: 'Left profile', value: -90 },
  { label: 'Right profile', value: 90 },
  { label: 'Back', value: 180 },
];

const V_PRESETS = [
  { label: 'Eye', value: 0 },
  { label: 'High', value: 30 },
  { label: 'Low', value: -30 },
  { label: 'Top', value: 55 },
  { label: 'Worm', value: -55 },
];

const Z_PRESETS = [
  { label: 'Close', value: 2 },
  { label: 'Medium', value: 5 },
  { label: 'Full', value: 8 },
  { label: 'Wide', value: 10 },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeDegrees(value: number): number {
  let out = value;
  while (out > 180) out -= 360;
  while (out < -180) out += 360;
  return out;
}

function toWorkflowHorizontalAngle(angle: number): number {
  const normalized = normalizeDegrees(angle);
  return normalized < 0 ? normalized + 360 : normalized;
}

function sanitizeShots(shots: CameraShot[]): CameraShot[] {
  const source = Array.isArray(shots) && shots.length ? shots : DEFAULT_SHOTS.slice(0, 1);
  return source.slice(0, MAX_SHOTS).map((shot, index) => ({
    label: shot.label || `Shot ${index + 1}`,
    h: normalizeDegrees(Number(shot.h) || 0),
    v: clamp(Number(shot.v) || 0, -60, 60),
    z: clamp(Number(shot.z) || 5, 1, 12),
  }));
}

function padShots(shots: CameraShot[]): CameraShot[] {
  const clean = sanitizeShots(shots);
  return [...clean, ...DEFAULT_SHOTS.slice(clean.length)].slice(0, MAX_SHOTS);
}

function CameraOrbitPreview({
  shot,
  previewId,
  onChange,
}: {
  shot: CameraShot;
  previewId: string;
  onChange: (patch: Partial<CameraShot>) => void;
}) {
  const patternId = `qwen-grid-${previewId}`;
  const hRad = ((shot.h - 90) * Math.PI) / 180;
  const x = 150 + Math.cos(hRad) * 96;
  const y = 102 + Math.sin(hRad) * 34;
  const yArc = 102 - ((shot.v + 60) / 120) * 76;
  const zoomArm = 26 + ((shot.z - 1) / 11) * 42;
  const armX = x + Math.cos(hRad) * zoomArm;
  const armY = y + Math.sin(hRad) * zoomArm * 0.35;

  const getSvgPoint = (svg: SVGSVGElement, clientX: number, clientY: number) => {
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / Math.max(1, rect.width)) * 300,
      y: ((clientY - rect.top) / Math.max(1, rect.height)) * 170,
    };
  };

  const updateAxis = (axis: 'x' | 'y' | 'z', svg: SVGSVGElement, clientX: number, clientY: number) => {
    const point = getSvgPoint(svg, clientX, clientY);
    if (axis === 'x') {
      const dx = (point.x - 150) / 96;
      const dy = (point.y - 102) / 34;
      const angle = Math.round(normalizeDegrees((Math.atan2(dy, dx) * 180) / Math.PI + 90));
      onChange({ h: angle });
      return;
    }
    if (axis === 'y') {
      const t = clamp((102 - point.y) / 76, 0, 1);
      onChange({ v: Math.round(t * 120 - 60) });
      return;
    }
    const distance = Math.hypot(point.x - x, (point.y - y) / 0.35);
    const zoom = clamp(1 + ((distance - 26) / 42) * 11, 1, 12);
    onChange({ z: Number(zoom.toFixed(1)) });
  };

  const startDrag = (axis: 'x' | 'y' | 'z', ev: ReactPointerEvent<SVGElement>) => {
    ev.preventDefault();
    ev.stopPropagation();
    const svg = ev.currentTarget.ownerSVGElement;
    if (!svg) return;
    updateAxis(axis, svg, ev.clientX, ev.clientY);
    const onMove = (moveEv: PointerEvent) => updateAxis(axis, svg, moveEv.clientX, moveEv.clientY);
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div className="relative mt-3 overflow-hidden rounded-lg border border-white/10 bg-black/45">
      <svg viewBox="0 0 300 170" className="h-36 w-full" role="img" aria-label="Camera angle preview">
        <defs>
          <pattern id={patternId} width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(161,161,170,0.08)" strokeWidth="1" />
          </pattern>
        </defs>
        <path d="M0 82 L150 20 L300 82 L150 168 Z" fill={`url(#${patternId})`} opacity="0.95" />
        <ellipse
          cx="150"
          cy="102"
          rx="96"
          ry="34"
          fill="none"
          stroke="rgba(236,72,153,0.7)"
          strokeWidth="6"
          className="cursor-grab"
          onPointerDown={(ev) => startDrag('x', ev)}
        />
        <ellipse cx="150" cy="102" rx="34" ry="15" fill="none" stroke="rgba(212,212,216,0.22)" strokeWidth="2" />
        <path
          d="M76 102 C64 70 70 42 92 20"
          fill="none"
          stroke="rgba(34,211,238,0.72)"
          strokeWidth="6"
          strokeLinecap="round"
          className="cursor-grab"
          onPointerDown={(ev) => startDrag('y', ev)}
        />
        <circle
          cx="76"
          cy={yArc}
          r="12"
          fill="rgb(34,211,238)"
          stroke="rgba(250,250,250,0.65)"
          strokeWidth="2"
          className="cursor-grab"
          onPointerDown={(ev) => startDrag('y', ev)}
        />
        <line
          x1={x}
          y1={y}
          x2={armX}
          y2={armY}
          stroke="rgba(245,158,11,0.8)"
          strokeWidth="4"
          strokeLinecap="round"
          className="cursor-grab"
          onPointerDown={(ev) => startDrag('z', ev)}
        />
        <circle
          cx={armX}
          cy={armY}
          r="8"
          fill="rgb(245,158,11)"
          stroke="rgba(250,250,250,0.7)"
          strokeWidth="2"
          className="cursor-grab"
          onPointerDown={(ev) => startDrag('z', ev)}
        />
        <circle
          cx={x}
          cy={y}
          r="14"
          fill="rgb(236,72,153)"
          stroke="rgba(250,250,250,0.7)"
          strokeWidth="2"
          className="cursor-grab"
          onPointerDown={(ev) => startDrag('x', ev)}
        />
        <polygon points="132,52 186,75 186,128 132,113" fill="rgba(113,113,122,0.58)" stroke="rgba(250,250,250,0.5)" strokeWidth="1.5" />
        <line x1="150" y1="95" x2="185" y2="88" stroke="rgba(250,250,250,0.72)" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <div className="grid grid-cols-3 border-t border-white/10 bg-black/35 text-center text-[11px]">
        <div className="px-2 py-1.5 text-pink-300">X <span className="font-semibold text-pink-100">{shot.h} deg</span></div>
        <div className="px-2 py-1.5 text-cyan-300">Y <span className="font-semibold text-cyan-100">{shot.v} deg</span></div>
        <div className="px-2 py-1.5 text-amber-300">Zoom <span className="font-semibold text-amber-100">{shot.z.toFixed(1)}</span></div>
      </div>
    </div>
  );
}

export const QwenMultiAnglesPage = () => {
  const { toast } = useToast();
  const [shots, setShots] = usePersistentState<CameraShot[]>('qwen_multiangle_shots_v2', DEFAULT_SHOTS.slice(0, 1));
  const [history, setHistory] = usePersistentState<string[]>('qwen_multiangle_history', []);
  const [seed, setSeed] = usePersistentState('qwen_multiangle_seed', -1);
  const [steps, setSteps] = usePersistentState('qwen_multiangle_steps', 4);
  const [cfg, setCfg] = usePersistentState('qwen_multiangle_cfg', 1);
  const [denoise, setDenoise] = usePersistentState('qwen_multiangle_denoise', 1);
  const [defaultPrompts, setDefaultPrompts] = usePersistentState('qwen_multiangle_default_prompts', false);
  const [cameraView, setCameraView] = usePersistentState('qwen_multiangle_camera_view', false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedImageName, setUploadedImageName] = useState('');
  const [uploadedPreview, setUploadedPreview] = useState('');
  const [generationError, setGenerationError] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const activeShots = sanitizeShots(shots);
  const previewItems = [...results, ...history.filter((url) => !results.includes(url))].slice(0, 12);
  const workflowId = activeShots.length === 1 ? 'qwen-multi-angles-fast' : 'qwen-multi-angles';

  const setShot = (index: number, patch: Partial<CameraShot>) => {
    setShots((prev) => {
      const next = sanitizeShots(prev);
      next[index] = {
        ...next[index],
        ...patch,
        h: patch.h !== undefined ? normalizeDegrees(patch.h) : next[index].h,
        v: patch.v !== undefined ? clamp(patch.v, -60, 60) : next[index].v,
        z: patch.z !== undefined ? clamp(patch.z, 1, 12) : next[index].z,
      };
      return next;
    });
  };

  const addShot = () => {
    setShots((prev) => {
      const next = sanitizeShots(prev);
      if (next.length >= MAX_SHOTS) return next;
      return [...next, { ...DEFAULT_SHOTS[next.length], label: `Shot ${next.length + 1}` }];
    });
  };

  const removeShot = (index: number) => {
    setShots((prev) => sanitizeShots(prev).filter((_, i) => i !== index).map((shot, i) => ({ ...shot, label: `Shot ${i + 1}` })));
  };

  const uploadReference = async (file: File) => {
    setIsUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch(`${BACKEND_API.BASE_URL}/api/upload`, { method: 'POST', body });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.detail || data?.error || 'Upload failed');
      setUploadedImageName(String(data.filename ?? ''));
      if (uploadedPreview.startsWith('blob:')) URL.revokeObjectURL(uploadedPreview);
      setUploadedPreview(URL.createObjectURL(file));
      toast('Reference image uploaded', 'success');
    } catch (err: any) {
      toast(err?.message || 'Upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileDrop = async (ev: ReactDragEvent<HTMLDivElement>) => {
    ev.preventDefault();
    ev.stopPropagation();
    setIsDragOver(false);
    const file = ev.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      toast('Drop an image file', 'error');
      return;
    }
    await uploadReference(file);
  };

  const pollResults = async (promptId: string, expectedCount: number) => {
    const started = Date.now();
    while (Date.now() - started < 240_000) {
      const res = await fetch(`${BACKEND_API.BASE_URL}/api/generate/status/${encodeURIComponent(promptId)}`);
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.detail || data?.error || 'Status check failed');

      const state = String(data.status ?? '');
      if (state === 'completed') {
        const imgs = Array.isArray(data.images) ? data.images : [];
        const urls = imgs.map(
          (img: any) =>
            `/comfy/view?filename=${encodeURIComponent(img.filename)}&subfolder=${encodeURIComponent(img.subfolder ?? '')}&type=${encodeURIComponent(img.type ?? 'output')}`,
        );
        if (urls.length === 0) {
          throw new Error('ComfyUI completed the workflow, but did not return an image file.');
        }
        const nextResults = urls.slice(0, expectedCount);
        setResults(nextResults);
        setHistory((prev) => [...nextResults, ...prev.filter((url) => !nextResults.includes(url))].slice(0, 40));
        if (urls.length < expectedCount) toast(`Workflow returned ${urls.length} of ${expectedCount} expected outputs.`, 'info');
        return;
      }
      if (state === 'not_found' || state === 'pending' || state === 'running') {
        await new Promise((r) => setTimeout(r, 900));
        continue;
      }
      throw new Error(`Unexpected status: ${state}`);
    }
    throw new Error(`Generation timed out (${expectedCount} shot${expectedCount === 1 ? '' : 's'})`);
  };

  const generate = async () => {
    if (!uploadedImageName) {
      toast('Upload one image first', 'error');
      return;
    }
    const shotPayload = padShots(activeShots);
    const expectedCount = activeShots.length;
    setIsGenerating(true);
    setGenerationError('');
    setResults([]);
    try {
      const chosenSeed = seed < 0 ? Math.floor(Math.random() * 2_147_483_000) : seed;
      const isMultiShot = expectedCount > 1;
      const payload = {
        workflow_id: workflowId,
        params: {
          image: uploadedImageName,
          horizontal_angle: isMultiShot
            ? shotPayload.map((shot) => toWorkflowHorizontalAngle(shot.h))
            : toWorkflowHorizontalAngle(activeShots[0].h),
          vertical_angle: isMultiShot ? shotPayload.map((shot) => shot.v) : activeShots[0].v,
          zoom: isMultiShot ? shotPayload.map((shot) => shot.z) : activeShots[0].z,
          default_prompts: isMultiShot ? shotPayload.map(() => defaultPrompts) : defaultPrompts,
          camera_view: isMultiShot ? shotPayload.map(() => cameraView) : cameraView,
          seed: chosenSeed,
          steps,
          cfg,
          denoise,
          shot_count: expectedCount,
        },
      };
      const res = await fetch(`${BACKEND_API.BASE_URL}${BACKEND_API.ENDPOINTS.GENERATE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data?.success || !data?.prompt_id) {
        throw new Error(data?.detail || data?.error || 'Failed to start generation');
      }
      await pollResults(String(data.prompt_id), expectedCount);
      toast(`Multi-angle generation complete (${expectedCount} shot${expectedCount === 1 ? '' : 's'})`, 'success');
    } catch (err: any) {
      const message = err?.message || 'Generation failed';
      setGenerationError(message);
      toast(message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar px-6 py-5">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-xl border border-white/10 bg-black/25 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold tracking-wide text-zinc-100">Qwen Multi Angle</h3>
              <p className="text-xs text-zinc-500 mt-1">Recent outputs</p>
            </div>
            <span className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">{previewItems.length} previews</span>
          </div>
          {previewItems.length === 0 ? (
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[11px] text-zinc-500">
              Generate angles to fill this preview bar.
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {previewItems.map((url, idx) => (
                <button
                  key={`${url}-${idx}`}
                  type="button"
                  onClick={() => setLightboxImage(url)}
                  className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-white/15 bg-black/40 hover:border-white/40"
                >
                  <img src={url} alt={`Preview ${idx + 1}`} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/30" />
                  <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-0.5 text-white/80 opacity-0 transition-opacity group-hover:opacity-100">
                    <Expand className="h-2.5 w-2.5" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-xl border border-white/10 bg-zinc-950 p-4">
          <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
            <div className="overflow-hidden rounded-lg border border-white/10 bg-black/40">
              {uploadedPreview ? (
                <img src={uploadedPreview} alt="Reference" className="h-52 w-full object-cover" />
              ) : (
                <div className="flex h-52 items-center justify-center text-[11px] text-zinc-600">No reference loaded</div>
              )}
            </div>
            <div className="rounded-lg border border-white/10 bg-black/35 p-3">
              <label className="text-[11px] uppercase tracking-[0.12em] text-zinc-500 block mb-2">Reference Image</label>
              <div
                onDragOver={(ev) => {
                  ev.preventDefault();
                  ev.stopPropagation();
                  setIsDragOver(true);
                }}
                onDragLeave={(ev) => {
                  ev.preventDefault();
                  ev.stopPropagation();
                  setIsDragOver(false);
                }}
                onDrop={(ev) => void handleFileDrop(ev)}
                className={`flex min-h-28 items-center justify-center rounded-lg border border-dashed p-3 transition-colors ${
                  isDragOver ? 'border-white/45 bg-white/10' : 'border-white/15 bg-white/[0.03]'
                }`}
              >
                <label className="w-full cursor-pointer flex items-center justify-center gap-2 text-sm text-zinc-300 hover:text-white">
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {isUploading ? 'Uploading...' : 'Drop Image Here or Click Upload'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void uploadReference(file);
                    }}
                  />
                </label>
              </div>
              {uploadedImageName && <p className="mt-2 text-[11px] text-zinc-400">Loaded: {uploadedImageName}</p>}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-300">Camera Angles</div>
                <p className="mt-1 text-[10px] text-zinc-600">Add one card per angle. Adjust X, Y and Zoom manually on each card.</p>
              </div>
              <button
                type="button"
                onClick={addShot}
                disabled={activeShots.length >= MAX_SHOTS}
                className="inline-flex items-center gap-2 rounded border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-zinc-200 hover:bg-white/[0.08] disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Angle
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {activeShots.map((shot, idx) => (
                <div key={`${shot.label}-${idx}`} className="rounded-lg border border-white/10 bg-zinc-950/80 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-xs font-semibold text-zinc-100">{shot.label}</div>
                    {activeShots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeShot(idx)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded border border-white/10 text-zinc-500 hover:text-zinc-100"
                        title="Remove angle"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <CameraOrbitPreview previewId={`${idx}`} shot={shot} onChange={(patch) => setShot(idx, patch)} />

                  <div className="grid grid-cols-3 gap-2">
                    <label className="text-[10px] text-zinc-500">
                      X
                      <select
                        value={H_PRESETS.some((p) => p.value === shot.h) ? shot.h : 'custom'}
                        onChange={(e) => {
                          if (e.target.value !== 'custom') setShot(idx, { h: Number(e.target.value) });
                        }}
                        className="mt-1 w-full rounded border border-white/10 bg-black px-2 py-1.5 text-[11px] text-zinc-200"
                      >
                        {H_PRESETS.map((preset) => <option key={preset.label} value={preset.value}>{preset.label}</option>)}
                        <option value="custom">Custom</option>
                      </select>
                    </label>
                    <label className="text-[10px] text-zinc-500">
                      Y
                      <select
                        value={V_PRESETS.some((p) => p.value === shot.v) ? shot.v : 'custom'}
                        onChange={(e) => {
                          if (e.target.value !== 'custom') setShot(idx, { v: Number(e.target.value) });
                        }}
                        className="mt-1 w-full rounded border border-white/10 bg-black px-2 py-1.5 text-[11px] text-zinc-200"
                      >
                        {V_PRESETS.map((preset) => <option key={preset.label} value={preset.value}>{preset.label}</option>)}
                        <option value="custom">Custom</option>
                      </select>
                    </label>
                    <label className="text-[10px] text-zinc-500">
                      Zoom
                      <select
                        value={Z_PRESETS.some((p) => p.value === shot.z) ? shot.z : 'custom'}
                        onChange={(e) => {
                          if (e.target.value !== 'custom') setShot(idx, { z: Number(e.target.value) });
                        }}
                        className="mt-1 w-full rounded border border-white/10 bg-black px-2 py-1.5 text-[11px] text-zinc-200"
                      >
                        {Z_PRESETS.map((preset) => <option key={preset.label} value={preset.value}>{preset.label}</option>)}
                        <option value="custom">Custom</option>
                      </select>
                    </label>
                  </div>

                  <div className="mt-3 space-y-2.5">
                    <label className="grid grid-cols-[38px_1fr_52px] items-center gap-2 text-[10px] text-zinc-500">
                      <span>X</span>
                      <input
                        type="range"
                        min={-180}
                        max={180}
                        step={1}
                        value={shot.h}
                        onChange={(e) => setShot(idx, { h: Number(e.target.value) })}
                        className="h-1.5 w-full accent-zinc-300"
                      />
                      <input
                        type="number"
                        value={shot.h}
                        min={-180}
                        max={180}
                        onChange={(e) => setShot(idx, { h: Number(e.target.value) })}
                        className="rounded border border-white/10 bg-black px-1.5 py-1 text-center text-[10px] text-zinc-300"
                      />
                    </label>
                    <label className="grid grid-cols-[38px_1fr_52px] items-center gap-2 text-[10px] text-zinc-500">
                      <span>Y</span>
                      <input
                        type="range"
                        min={-60}
                        max={60}
                        step={1}
                        value={shot.v}
                        onChange={(e) => setShot(idx, { v: Number(e.target.value) })}
                        className="h-1.5 w-full accent-zinc-300"
                      />
                      <input
                        type="number"
                        value={shot.v}
                        min={-60}
                        max={60}
                        onChange={(e) => setShot(idx, { v: Number(e.target.value) })}
                        className="rounded border border-white/10 bg-black px-1.5 py-1 text-center text-[10px] text-zinc-300"
                      />
                    </label>
                    <label className="grid grid-cols-[38px_1fr_52px] items-center gap-2 text-[10px] text-zinc-500">
                      <span>Zoom</span>
                      <input
                        type="range"
                        min={1}
                        max={12}
                        step={0.1}
                        value={shot.z}
                        onChange={(e) => setShot(idx, { z: Number(e.target.value) })}
                        className="h-1.5 w-full accent-zinc-300"
                      />
                      <input
                        type="number"
                        value={shot.z}
                        min={1}
                        max={12}
                        step={0.1}
                        onChange={(e) => setShot(idx, { z: Number(e.target.value) })}
                        className="rounded border border-white/10 bg-black px-1.5 py-1 text-center text-[10px] text-zinc-300"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[11px] flex items-center justify-between rounded border border-white/10 bg-black/30 px-3 py-2 text-zinc-400">
                <span>default_prompts</span>
                <input type="checkbox" checked={defaultPrompts} onChange={(e) => setDefaultPrompts(e.target.checked)} />
              </label>
              <label className="text-[11px] flex items-center justify-between rounded border border-white/10 bg-black/30 px-3 py-2 text-zinc-400">
                <span>camera_view</span>
                <input type="checkbox" checked={cameraView} onChange={(e) => setCameraView(e.target.checked)} />
              </label>
            </div>
            <label className="text-[11px] text-zinc-500">
              Seed
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                className="mt-1 w-full rounded border border-white/10 bg-black px-2 py-2 text-zinc-200"
              />
            </label>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-300">Quality</div>
                <p className="mt-1 text-[10px] text-zinc-600">Keep CFG near 1.0 for best angle consistency.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSteps(4);
                  setCfg(1);
                  setDenoise(1);
                }}
                className="rounded border border-white/10 bg-white/[0.04] px-2 py-1.5 text-[11px] text-zinc-300 hover:bg-white/[0.08]"
              >
                Reset
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="text-[11px] text-zinc-500">
                Steps <span className="font-mono text-zinc-200">{steps}</span>
                <input
                  type="range"
                  min={2}
                  max={8}
                  step={1}
                  value={steps}
                  onChange={(e) => setSteps(Number(e.target.value))}
                  className="mt-2 w-full accent-zinc-300"
                />
              </label>
              <label className="text-[11px] text-zinc-500">
                CFG <span className="font-mono text-zinc-200">{cfg.toFixed(1)}</span>
                <input
                  type="range"
                  min={0.8}
                  max={1.6}
                  step={0.1}
                  value={cfg}
                  onChange={(e) => setCfg(Number(e.target.value))}
                  className="mt-2 w-full accent-zinc-300"
                />
              </label>
              <label className="text-[11px] text-zinc-500">
                Denoise <span className="font-mono text-zinc-200">{denoise.toFixed(2)}</span>
                <input
                  type="range"
                  min={0.75}
                  max={1}
                  step={0.05}
                  value={denoise}
                  onChange={(e) => setDenoise(Number(e.target.value))}
                  className="mt-2 w-full accent-zinc-300"
                />
              </label>
            </div>
          </div>

          <button
            onClick={() => void generate()}
            disabled={isGenerating || !uploadedImageName}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 border border-white/10 bg-white/[0.06] text-zinc-100 hover:bg-white/[0.1] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            {isGenerating ? 'Generating...' : `Generate ${activeShots.length} Angle${activeShots.length === 1 ? '' : 's'}`}
          </button>
        </section>

        <section className="rounded-xl border border-white/10 bg-black/30 p-4 min-h-[360px]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-zinc-100">Output</h4>
            <button
              onClick={() => setResults([])}
              className="inline-flex items-center gap-1 text-[11px] text-zinc-400 border border-white/10 rounded px-2 py-1 hover:text-zinc-100"
            >
              <RefreshCw className="w-3 h-3" />
              Clear
            </button>
          </div>

          {results.length === 0 ? (
            <div
              className={`h-[280px] rounded-lg border border-dashed flex items-center justify-center px-6 text-center text-sm ${
                generationError ? 'border-red-400/30 bg-red-500/5 text-red-200' : 'border-white/10 text-zinc-600'
              }`}
            >
              {generationError || (isGenerating ? 'Running workflow...' : 'No outputs yet')}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {results.map((url, idx) => (
                <button key={`${url}-${idx}`} type="button" onClick={() => setLightboxImage(url)} className="block group text-left">
                  <img
                    src={url}
                    alt={`Result ${idx + 1}`}
                    className="w-full aspect-square object-cover rounded-lg border border-white/10 group-hover:border-white/40"
                  />
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
      {lightboxImage && <Lightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />}
    </div>
  );
};
