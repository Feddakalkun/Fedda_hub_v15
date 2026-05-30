import { ZImageTxt2Img } from './zimage/ZImageTxt2Img';
import { FluxTxt2Img } from './flux/FluxTxt2Img';
import { QwenTxt2Img } from './qwen/QwenTxt2Img';
import { QwenImageReferencePage } from './qwen/QwenImageReferencePage';
import { QwenMultiAnglesPage } from './qwen/QwenMultiAnglesPage';
import { ZImageDualLoraPage } from './zimage/ZImageDualLoraPage';

interface ImageStudioPageProps {
  activeTab?: string;
}

export const ImageStudioPage = ({ activeTab = 'z-image-txt2img' }: ImageStudioPageProps) => {
  if (activeTab === 'z-image-dual-lora') return <ZImageDualLoraPage />;
  if (activeTab === 'flux' || activeTab === 'flux-txt2img') return <FluxTxt2Img />;
  if (activeTab === 'qwen' || activeTab === 'qwen-txt2img') return <QwenTxt2Img />;
  if (activeTab === 'qwen-image-ref') return <QwenImageReferencePage />;
  if (activeTab === 'qwen-multi-angle') return <QwenMultiAnglesPage />;
  return <ZImageTxt2Img />;
};
