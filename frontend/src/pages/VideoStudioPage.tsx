import { Wan22Vid2Vid } from './wan22/Wan22Vid2Vid';
import { Wan22Img2Vid } from './wan22/Wan22Img2Vid';
import { Wan226FramesPage } from './wan22/Wan226FramesPage';
import { Wan21SteadyDancerPage } from './wan21/Wan21SteadyDancerPage';
import { LtxFlfPage } from './ltx/LtxFlfPage';
import { LtxImg2VidPage } from './ltx/LtxImg2VidPage';

interface VideoStudioPageProps {
  activeTab?: string;
}

export const VideoStudioPage = ({ activeTab = 'wan22-vid2vid' }: VideoStudioPageProps) => {
  if (activeTab === 'video' || activeTab === 'wan22-vid2vid') return <Wan22Vid2Vid />;
  if (activeTab === 'wan22-img2vid') return <Wan22Img2Vid />;
  if (activeTab === 'wan22-img2vid-6frames') return <Wan226FramesPage />;
  if (activeTab === 'wan21-steady-dancer') return <Wan21SteadyDancerPage />;
  if (activeTab === 'ltx' || activeTab === 'ltx-flf') return <LtxFlfPage />;
  if (activeTab === 'ltx-img2vid') return <LtxImg2VidPage />;
  return <Wan22Vid2Vid />;
};

