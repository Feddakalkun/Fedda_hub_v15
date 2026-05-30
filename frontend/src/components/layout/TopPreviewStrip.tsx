import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Expand, Loader2 } from 'lucide-react';
import { useComfyExecution } from '../../contexts/ComfyExecutionContext';
import { comfyService } from '../../services/comfyService';
import { usePersistentState } from '../../hooks/usePersistentState';
import { Lightbox } from '../ui/Lightbox';

interface TopPreviewStripProps {
  maxItems?: number;
  storageKey?: string;
}

export const TopPreviewStrip = ({ maxItems = 8, storageKey = 'global' }: TopPreviewStripProps) => {
  const { state, previewUrl, lastOutputImages, outputReadyCount } = useComfyExecution();

  const [history, setHistory] = usePersistentState<string[]>(`${storageKey}_preview_history`, []);
  const [previewCollapsed, setPreviewCollapsed] = usePersistentState(`${storageKey}_preview_collapsed`, false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Merge live preview + history
  const stripImages = [
    ...(previewUrl ? [previewUrl] : []),
    ...history.filter((h) => h !== previewUrl),
  ].slice(0, maxItems);

  // Sync new outputs into history
  useEffect(() => {
    if (state !== 'executing' || lastOutputImages.length === 0) return;

    const newUrls = lastOutputImages.map((img) => comfyService.getImageUrl(img));

    setHistory((prev) => {
      const updated = [...newUrls, ...prev.filter((p) => !newUrls.includes(p))];
      return updated.slice(0, 30);
    });
  }, [outputReadyCount, lastOutputImages, state, setHistory]);

  const openImage = (url: string) => {
    const idx = stripImages.indexOf(url);
    if (idx !== -1) {
      setLightboxIndex(idx);
      setLightboxOpen(true);
    }
  };

  return (
    <>
      <div className="space-y-2 px-8 pt-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPreviewCollapsed((v) => !v)}
            className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.2em] text-white/30 hover:text-white/60 transition-colors"
          >
            {previewCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            Recent Generations
          </button>
          <span className="text-[8px] font-mono text-white/20">
            {previewUrl ? 'Live' : 'Recent'} · {stripImages.length}
          </span>
        </div>

        {!previewCollapsed && (
          <>
            {stripImages.length === 0 ? (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[11px] text-white/40">
                Generate something to see previews here.
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {stripImages.map((url, idx) => {
                  const isLive = !!previewUrl && idx === 0;
                  return (
                    <button
                      key={`global-preview-${idx}`}
                      onClick={() => openImage(url)}
                      className={`group relative h-20 w-20 shrink-0 rounded-xl border overflow-hidden transition-all ${
                        isLive
                          ? 'ring-1 ring-emerald-400/50 border-emerald-400/40'
                          : 'border-white/15 bg-black/40 hover:border-white/40'
                      }`}
                    >
                      <img src={url} alt={`Preview ${idx + 1}`} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                      <div className="absolute bottom-1 right-1 rounded bg-black/60 px-1 py-0.5 text-[7px] font-bold text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Expand className="h-2.5 w-2.5" />
                      </div>
                      {isLive && (
                        <div className="absolute left-1 top-1 inline-flex items-center gap-1 rounded bg-emerald-500/90 px-1 py-0.5 text-[6px] font-black uppercase tracking-wider text-black">
                          <Loader2 className="h-2 w-2 animate-spin" /> LIVE
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {lightboxOpen && stripImages[lightboxIndex] && (
        <Lightbox
          imageUrl={stripImages[lightboxIndex]}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
};
