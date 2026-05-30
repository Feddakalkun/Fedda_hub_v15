import { Bot, Images, LayoutDashboard, Sparkles, Video } from 'lucide-react';

interface RichHomeProps {
  onSelect: (id: string) => void;
}

const CARDS = [
  {
    id: 'image',
    label: 'Image Studio',
    description: 'Text, reference and LoRA-driven image workflows synced with ComfyUI.',
    Icon: Sparkles,
  },
  {
    id: 'video',
    label: 'Video Studio',
    description: 'WAN and LTX motion workflows with a consistent workbench layout.',
    Icon: Video,
  },
  {
    id: 'gallery',
    label: 'Gallery',
    description: 'One unified place for generated images and videos.',
    Icon: Images,
  },
  {
    id: 'library',
    label: 'LoRA & Character',
    description: 'Install, import and manage LoRA character packs for active workflows.',
    Icon: LayoutDashboard,
  },
  {
    id: 'ollama',
    label: 'Ollama Models',
    description: 'Download and remove local text and vision models used by FEDDA tools.',
    Icon: Bot,
  },
];

export const RichHome = ({ onSelect }: RichHomeProps) => {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[#07080d]">
      <div className="mx-auto flex min-h-full w-full max-w-[1500px] flex-col px-8 py-8">
        <section className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="v14-kicker text-white/45">FEDDA Hub v15</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Workflow-first AI studio</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              A slim distribution base focused on ComfyUI workflows, output review, LoRA characters and local Ollama models.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-white/40">
            Minimal cards active. Visual assets come next.
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {CARDS.map(({ id, label, description, Icon }, index) => (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className="group min-h-[260px] rounded-xl border border-white/10 bg-[#0d0f16] p-5 text-left transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-[#11141d]"
            >
              <div className="flex h-full flex-col justify-between gap-8">
                <div>
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/55 group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-[10px] text-white/20">{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <h2 className="text-base font-semibold tracking-tight text-white">{label}</h2>
                  <p className="mt-3 text-sm leading-5 text-slate-500">{description}</p>
                </div>
                <div className="h-24 rounded-lg border border-dashed border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))]" />
              </div>
            </button>
          ))}
        </section>
      </div>
    </div>
  );
};
