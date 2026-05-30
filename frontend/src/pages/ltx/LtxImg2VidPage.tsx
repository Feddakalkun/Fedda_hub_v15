import { useState, useRef, useEffect } from 'react';
import {
  Upload, RefreshCw, Loader2, Play,
} from 'lucide-react';
import { PromptAssistant } from '../../components/ui/PromptAssistant';
import { LoraSelector } from '../../components/ui/LoraSelector';
import { useToast } from '../../components/ui/Toast';
import { BACKEND_API } from '../../config/api';
import { useComfyExecution } from '../../contexts/ComfyExecutionContext';
import { usePersistentState } from '../../hooks/usePersistentState';
import { comfyService } from '../../services/comfyService';
import { FeddaButton, FeddaSectionTitle } from '../../components/ui/FeddaPrimitives';
import { VideoOutputPanel } from '../../components/layout/VideoOutputPanel';
import { WorkflowShell } from '../../components/layout/WorkflowShell';

// ── Simple image upload slot ─────────────────────────────────────────────────
function RefImageSlot({ preview, uploading, onFile }: {
  preview: string | null; uploading: boolean; onFile: (f: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div
      onClick={() => ref.current?.click()}
      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) onFile(f); }}
      onDragOver={e => e.preventDefault()}
      className={`relative rounded-xl border border-dashed cursor-pointer transition-all overflow-hidden group ${
        preview ? 'border-violet-500/30 bg-black/40' : 'border-white/[0.08] hover:border-violet-500/25 bg-white/[0.02]'
      }`}
      style={{ height: 220 }}
    >
      {preview ? (
        <>
          <img src={preview} alt="Reference" className="w-full h-full object-cover absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
            <span className="text-[8px] font-black uppercase tracking-widest text-white/70">Replace reference</span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full gap-2">
          {uploading
            ? <Loader2 className="w-6 h-6 text-violet-400/60 animate-spin" />
            : <Upload className="w-6 h-6 text-white/15" />}
          <span className="text-[10px] font-black uppercase tracking-widest text-white/20">
            {uploading ? 'Uploading…' : 'Reference Image'}
          </span>
          <span className="text-[9px] text-white/10">Click or drop (jpg/png)</span>
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export const LtxImg2VidPage = () => {
  const [prompt, setPrompt] = usePersistentState('ltx_img2vid_prompt', '');
  const [negative, setNegative] = usePersistentState('ltx_img2vid_negative', 'blurry, low quality, deformed, jitter, artifacts');
  const [seed, setSeed] = usePersistentState('ltx_img2vid_seed', -1);
  const [loraName, setLoraName] = usePersistentState('ltx_img2vid_lora_name', '');
  const [loraStrength, setLoraStrength] = usePersistentState('ltx_img2vid_lora_strength', 0.65);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [imageFilename, setImageFilename] = usePersistentState<string | null>('ltx_img2vid_image_file', null);
  const [imageUploading, setImageUploading] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingPromptId, setPendingPromptId] = useState<string | null>(null);
  const [currentVideo, setCurrentVideo] = usePersistentState<string | null>('ltx_img2vid_current_video', null);
  const [history, setHistory] = usePersistentState<string[]>('ltx_img2vid_history', []);
  const [availableLoras, setAvailableLoras] = useState<string[]>([]);

  const imagePreview = imageFilename ? `/comfy/view?filename=${encodeURIComponent(imageFilename)}&type=input` : null;

  const sessionRef = useRef<string[]>([]);
  const prevCountRef = useRef(0);

  const { toast } = useToast();
  const { state: execState, lastOutputVideos, outputReadyCount, registerNodeMap } = useComfyExecution();

  // Load LTX-filtered LoRAs
  useEffect(() => {
    comfyService.getLoras().then((loras) => {
      const filtered = loras.filter((l) => {
        const n = l.replace(/\\/g, '/').toLowerCase();
        return n.startsWith('ltx/') || n.includes('ltx');
      });
      setAvailableLoras(filtered);
    }).catch(() => {});
  }, []);

  const uploadImage = async (file: File) => {
    setImageUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${BACKEND_API.BASE_URL}/api/upload`, { method: 'POST', body: form });
      const data = await res.json();
      if (!data.success) throw new Error(data.detail || 'Upload failed');
      setImageFilename(data.filename);
    } catch (err: any) {
      toast(err.message || 'Upload failed', 'error');
    } finally {
      setImageUploading(false);
    }
  };

  // Video result collection from execution context
  useEffect(() => {
    if (!isGenerating && !pendingPromptId) return;
    if (!lastOutputVideos?.length) return;
    const newVids = lastOutputVideos.slice(prevCountRef.current);
    if (!newVids.length) return;
    prevCountRef.current = lastOutputVideos.length;
    const urls = newVids.map(v =>
      `/comfy/view?filename=${encodeURIComponent(v.filename)}&subfolder=${encodeURIComponent(v.subfolder)}&type=${v.type}`
    );
    sessionRef.current = [...sessionRef.current, ...urls];
    setCurrentVideo(urls[0]);
    setHistory(prev => [...urls, ...prev.filter(u => !urls.includes(u))].slice(0, 40));
  }, [outputReadyCount, lastOutputVideos, isGenerating, pendingPromptId, setHistory, setCurrentVideo]);

  // Fallback status polling
  useEffect(() => {
    if (!pendingPromptId) return;
    if (execState === 'error') { setIsGenerating(false); setPendingPromptId(null); return; }
    if (execState !== 'done') return;
    const pid = pendingPromptId;
    setIsGenerating(false);
    setPendingPromptId(null);
    fetch(`${BACKEND_API.BASE_URL}/api/generate/status/${pid}`)
      .then(r => r.json())
      .then(d => {
        if (d.status === 'completed' && d.videos?.length) {
          const urls = d.videos.map((v: any) =>
            `/comfy/view?filename=${encodeURIComponent(v.filename)}&subfolder=${encodeURIComponent(v.subfolder)}&type=${v.type}`
          );
          setCurrentVideo(urls[0]);
          setHistory(prev => [...urls, ...prev.filter(u => !urls.includes(u))].slice(0, 40));
        }
        toast('Video ready', 'success');
      })
      .catch(() => toast('Video ready', 'success'));
  }, [execState, pendingPromptId, toast, setHistory, setCurrentVideo]);

  const handleGenerate = async () => {
    if (!imageFilename || !prompt.trim() || isGenerating) return;
    sessionRef.current = [];
    prevCountRef.current = lastOutputVideos?.length ?? 0;
    setCurrentVideo(null);
    setIsGenerating(true);

    // Register node map for this workflow
    fetch(`${BACKEND_API.BASE_URL}/api/workflow/node-map/ltx-img2vid`)
      .then(r => r.json()).then(d => { if (d.success) registerNodeMap(d.node_map); }).catch(() => {});

    try {
      const res = await fetch(`${BACKEND_API.BASE_URL}${BACKEND_API.ENDPOINTS.GENERATE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_id: 'ltx-img2vid',
          params: {
            image: imageFilename,
            prompt: prompt.trim(),
            negative: negative.trim(),
            seed: seed === -1 ? Math.floor(Math.random() * 10_000_000_000) : seed,
            ...(loraName ? { lora_name: loraName, lora_strength: loraStrength } : {}),
            client_id: (comfyService as any).clientId,
          },
        }),
      });
      const data = await res.json();
      if (data.success) setPendingPromptId(data.prompt_id);
      else throw new Error(data.detail || 'Failed to start generation');
    } catch (err: any) {
      toast(err.message || 'Failed to generate', 'error');
      setIsGenerating(false);
    }
  };

  const canGenerate = !!imageFilename && !!prompt.trim() && !isGenerating;

  return (
    <WorkflowShell
      title="LTX Img2Vid"
      eyebrow="LTX Video 2.3"
      description="Animate one reference image into a cinematic motion clip."
      icon={Play}
      isGenerating={isGenerating}
      canGenerate={canGenerate}
      output={(
        <VideoOutputPanel
          currentVideo={currentVideo}
          history={history}
          onSelectVideo={setCurrentVideo}
          isGenerating={isGenerating}
          title="LTX Img2Vid Output"
          emptyHint="Upload an image and generate to see cinematic motion results here."
        />
      )}
    >
        <div className="space-y-5">
          {/* Reference Image */}
          <div className="space-y-2">
            <FeddaSectionTitle className="text-white/20">Reference Image</FeddaSectionTitle>
            <RefImageSlot
              preview={imagePreview}
              uploading={imageUploading}
              onFile={uploadImage}
            />
            {imageFilename && (
              <p className="text-[8px] text-violet-400/40 font-mono truncate">{imageFilename}</p>
            )}
          </div>

          {/* Motion Prompt */}
          <PromptAssistant
            context="ltx-flf"
            value={prompt}
            onChange={setPrompt}
            placeholder="Describe the motion, camera movement, and life you want in the video…"
            minRows={4}
            accent="violet"
            label="Motion Prompt"
            enableCaption={true}
          />

          {/* Negative (basic) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[8px] font-black uppercase tracking-widest text-white/15">Negative Prompt</p>
              <button onClick={() => setNegative('blurry, low quality, deformed, jitter, artifacts')}
                className="text-[8px] text-white/30 hover:text-white/60">Reset</button>
            </div>
            <textarea
              value={negative}
              onChange={e => setNegative(e.target.value)}
              className="w-full rounded-lg bg-black/40 border border-white/10 p-3 text-sm text-white/80 font-light focus:outline-none focus:border-violet-500/40 min-h-[60px] resize-y"
              placeholder="Artifacts to avoid…"
            />
          </div>

          {/* LoRA */}
          <div className="space-y-2">
            <FeddaSectionTitle className="text-white/20">LoRA (Optional)</FeddaSectionTitle>
            <LoraSelector
              options={availableLoras}
              value={loraName}
              onChange={setLoraName}
              strength={loraStrength}
              onStrengthChange={setLoraStrength}
              accent="violet"
              label="LTX LoRA"
            />
            {loraName && (
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-white/30">Strength</span>
                <input
                  type="range" min={0} max={1.5} step={0.01}
                  value={loraStrength}
                  onChange={e => setLoraStrength(parseFloat(e.target.value))}
                  className="flex-1 accent-violet-500"
                />
                <span className="font-mono w-10 text-right text-violet-300">{loraStrength.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Seed + Advanced */}
          <div>
            <button onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-white/30 hover:text-white/60 mb-2">
              {showAdvanced ? 'Hide' : 'Show'} Advanced
              <RefreshCw className={`w-3 h-3 transition ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>

            {showAdvanced && (
              <div className="space-y-3 rounded-xl border border-white/[0.06] p-4 bg-white/[0.015]">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-white/15 mb-1">Seed (−1 = random)</p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={seed}
                      onChange={e => setSeed(parseInt(e.target.value) || -1)}
                      className="flex-1 rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm font-mono text-white/80 focus:outline-none focus:border-violet-500/40"
                    />
                    <button onClick={() => setSeed(-1)} className="px-3 py-2 rounded-lg bg-white/5 text-xs hover:bg-white/10">Random</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Generate */}
          <div className="pt-2">
            <FeddaButton
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full h-11 text-base bg-violet-600 hover:bg-violet-500 disabled:bg-white/10 disabled:text-white/30"
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Generating…</span>
              ) : (
                <span className="flex items-center justify-center gap-2"><Play className="w-4 h-4" /> Generate Video</span>
              )}
            </FeddaButton>
            {!canGenerate && (
              <p className="text-center text-[10px] text-white/20 mt-2">Upload a reference image and enter a motion prompt</p>
            )}
          </div>
        </div>
    </WorkflowShell>
  );
};
