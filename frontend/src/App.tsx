import { useEffect, useState } from 'react';
import { Film, Images, LayoutDashboard, Sparkles, Video, Bot } from 'lucide-react';
import { RichHome } from './components/layout/RichHome';
import { ImageSectionCards } from './components/layout/ImageSectionCards';
import { VideoSectionCards } from './components/layout/VideoSectionCards';
import { TopSystemStrip } from './components/ui/TopSystemStrip';
import { ToastProvider } from './components/ui/Toast';
import { ComfyExecutionProvider } from './contexts/ComfyExecutionContext';
import { ImageStudioPage } from './pages/ImageStudioPage';
import { VideoStudioPage } from './pages/VideoStudioPage';
import { GalleryPage } from './pages/GalleryPage';
import { LibraryPage } from './pages/LibraryPage';
import { OllamaModelsPage } from './pages/OllamaModelsPage';

const VALID_TABS = new Set([
  'image', 'z-image', 'z-image-txt2img', 'z-image-dual-lora', 'flux', 'flux-txt2img',
  'qwen', 'qwen-txt2img', 'qwen-image-ref', 'qwen-multi-angle',
  'video', 'wan21-steady-dancer', 'wan22-vid2vid', 'wan22-img2vid', 'wan22-img2vid-6frames',
  'ltx', 'ltx-flf', 'ltx-img2vid',
  'gallery', 'library', 'ollama',
]);

const PAGE_META: Record<string, { label: string; Icon: any }> = {
  image: { label: 'Image Studio', Icon: Sparkles },
  'z-image': { label: 'Z-Image', Icon: Sparkles },
  'z-image-txt2img': { label: 'Z-Image Txt2Img', Icon: Sparkles },
  'z-image-dual-lora': { label: 'Z-Image Dual LoRA', Icon: Sparkles },
  flux: { label: 'FLUX2-KLEIN', Icon: Sparkles },
  'flux-txt2img': { label: 'FLUX2-KLEIN Txt2Img', Icon: Sparkles },
  qwen: { label: 'Qwen', Icon: Sparkles },
  'qwen-txt2img': { label: 'Qwen Txt2Img', Icon: Sparkles },
  'qwen-image-ref': { label: 'Qwen Image Reference', Icon: Sparkles },
  'qwen-multi-angle': { label: 'Qwen Multi Angle', Icon: Sparkles },
  video: { label: 'Video Studio', Icon: Video },
  'wan21-steady-dancer': { label: 'WAN 2.1 Steady Dancer', Icon: Video },
  'wan22-vid2vid': { label: 'WAN 2.2 Vid2Vid', Icon: Video },
  'wan22-img2vid': { label: 'WAN 2.2 Img2Vid', Icon: Video },
  'wan22-img2vid-6frames': { label: 'WAN 2.2 Story', Icon: Video },
  ltx: { label: 'LTX Video', Icon: Film },
  'ltx-flf': { label: 'LTX First / Last', Icon: Film },
  'ltx-img2vid': { label: 'LTX Img2Vid', Icon: Film },
  gallery: { label: 'Gallery', Icon: Images },
  library: { label: 'LoRA & Character', Icon: LayoutDashboard },
  ollama: { label: 'Ollama Models', Icon: Bot },
};

const TAB_KEY = 'fedda_v15_active_tab';
type ViewMode = 'home' | 'image-section' | 'video-section' | 'workspace';

function readActiveTab(): string {
  try {
    const raw = localStorage.getItem(TAB_KEY);
    if (raw && VALID_TABS.has(raw)) return raw;
  } catch {}
  return 'image';
}

function FeddaApp() {
  const [view, setView] = useState<ViewMode>('home');
  const [activeTab, setActiveTab] = useState(readActiveTab);

  useEffect(() => {
    try { localStorage.setItem(TAB_KEY, activeTab); } catch {}
  }, [activeTab]);

  const openTab = (tab: string) => {
    if (!VALID_TABS.has(tab)) return;
    setActiveTab(tab);
    setView('workspace');
  };

  const openHomeCard = (id: string) => {
    if (id === 'image') return setView('image-section');
    if (id === 'video') return setView('video-section');
    openTab(id);
  };

  const goHome = () => setView('home');
  const meta = PAGE_META[activeTab] ?? PAGE_META.image;
  const Icon = view === 'image-section' ? Sparkles : view === 'video-section' ? Video : meta.Icon;
  const title = view === 'home' ? 'FEDDA Hub v15' : view === 'image-section' ? 'Image Studio' : view === 'video-section' ? 'Video Studio' : meta.label;

  const renderWorkspace = () => {
    if (activeTab === 'gallery') return <GalleryPage />;
    if (activeTab === 'library') return <LibraryPage />;
    if (activeTab === 'ollama') return <OllamaModelsPage />;
    if (activeTab === 'image' || activeTab.startsWith('z-image') || activeTab.startsWith('flux') || activeTab.startsWith('qwen')) {
      return <ImageStudioPage activeTab={activeTab} />;
    }
    return <VideoStudioPage activeTab={activeTab} />;
  };

  return (
    <div className="flex h-screen theme-bg-app text-white overflow-hidden font-sans selection:bg-white/20">
      <main className="flex-1 flex flex-col overflow-hidden theme-bg-main">
        <header className="h-14 border-b border-white/5 flex items-center px-6 shrink-0 z-10 justify-between backdrop-blur-sm bg-black/20">
          <div className="flex items-center gap-3">
            {view !== 'home' && (
              <button onClick={goHome} className="v15-home-btn" title="Back to Home">Home</button>
            )}
            <Icon className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-white tracking-tight">{title}</h2>
          </div>
          <TopSystemStrip />
        </header>

        <div className="flex-1 min-h-0 overflow-hidden">
          {view === 'home' ? (
            <RichHome onSelect={openHomeCard} />
          ) : view === 'image-section' ? (
            <ImageSectionCards onSelect={openTab} onBack={goHome} />
          ) : view === 'video-section' ? (
            <VideoSectionCards onSelect={openTab} onBack={goHome} />
          ) : (
            renderWorkspace()
          )}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ComfyExecutionProvider>
      <ToastProvider>
        <FeddaApp />
      </ToastProvider>
    </ComfyExecutionProvider>
  );
}

