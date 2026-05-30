import { ArrowLeft, Box, Camera, Sparkles, Wand2 } from 'lucide-react';

interface ImageSectionCardsProps {
  onSelect: (tab: string) => void;
  onBack?: () => void;
}

const WORKFLOWS = [
  { tab: 'z-image-txt2img', label: 'Z-Image Txt2Img', description: 'Fast core text-to-image generation.', Icon: Sparkles },
  { tab: 'z-image-dual-lora', label: 'Z-Image Dual LoRA', description: 'Two-LoRA character/detail workflow.', Icon: Box },
  { tab: 'flux-txt2img', label: 'FLUX2-KLEIN', description: 'FLUX2-KLEIN 9B image generation.', Icon: Wand2 },
  { tab: 'qwen-txt2img', label: 'Qwen Txt2Img', description: 'Qwen image generation workspace.', Icon: Sparkles },
  { tab: 'qwen-image-ref', label: 'Qwen Reference', description: 'Image-reference generation and edits.', Icon: Camera },
  { tab: 'qwen-multi-angle', label: 'Qwen Multi Angle', description: 'Generate angle variants from one input.', Icon: Camera },
];

export const ImageSectionCards = ({ onSelect, onBack }: ImageSectionCardsProps) => {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[#07080d] px-8 py-8">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="v14-kicker text-white/45">Image Studio</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Choose an image workflow</h1>
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
