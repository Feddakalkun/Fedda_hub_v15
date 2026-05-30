import { Txt2ImgPage } from '../zimage/ZImageTxt2Img';

export const FluxTxt2Img = () => {
  return (
    <Txt2ImgPage
      storageKey="flux_txt2img"
      workflowId="flux2klein-txt2img"
      familyLabel="FLUX2-KLEIN"
      promptContext="zimage"
      accent="violet"
      // Only allow LoRAs specifically trained for FLUX.2-klein.
      // FLUX.1-dev LoRAs have incompatible dimensions and will cause matmul errors.
      loraPrefixes={['flux2klein/']}
      loraPacks={['flux2klein']}
    />
  );
};
