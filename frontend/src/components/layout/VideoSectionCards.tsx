import { ArrowLeft, Film, Video } from 'lucide-react';

interface VideoSectionCardsProps {
  onSelect: (tab: string) => void;
  onBack?: () => void;
}

const WORKFLOWS = [
  { tab: 'wan22-img2vid', label: 'WAN 2.2 Img2Vid', description: 'Animate a still image with WAN 2.2.', Icon: Video },
  { tab: 'wan22-vid2vid', label: 'WAN 2.2 Vid2Vid', description: 'Transform and extend a video clip.', Icon: Video },
  { tab: 'wan22-img2vid-6frames', label: 'WAN Story', description: 'Build video from a six-frame story sequence.', Icon: Film },
  { tab: 'wan21-steady-dancer', label: 'Steady Dancer', description: 'Transfer dance motion from reference video.', Icon: Video },
  { tab: 'ltx-img2vid', label: 'LTX Img2Vid', description: 'Animate one reference image with LTX.', Icon: Film },
  { tab: 'ltx-flf', label: 'LTX First / Last', description: 'Interpolate motion between two keyframes.', Icon: Film },
];

export const VideoSectionCards = ({ onSelect, onBack }: VideoSectionCardsProps) => {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[#07080d] px-8 py-8">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="v14-kicker text-white/45">Video Studio</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Choose a video workflow</h1>
          </div>
          {onBack && (
            <button onClick={onBack} className="v15-home-btn inline-flex items-center gap-2">
              <ArrowLeft className="h-3.5 w-3.5" /> Home
            </button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {WORKFLOWS.map(({ tab, label, description, Icon }) => (
            <button
              key={tab}
              onClick={() => onSelect(tab)}
              className="group rounded-xl border border-white/10 bg-[#0d0f16] p-5 text-left transition hover:border-white/20 hover:bg-[#11141d]"
            >
              <div className="mb-6 flex h-28 items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.02] text-white/25 group-hover:text-white/60">
                <Icon className="h-8 w-8" />
              </div>
              <h2 className="text-base font-semibold text-white">{label}</h2>
              <p className="mt-2 text-sm leading-5 text-slate-500">{description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

