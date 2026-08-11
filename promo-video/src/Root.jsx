import { Composition } from 'remotion';
import { Promo } from './Promo.jsx';
import { Presentation, TOTAL_FRAMES } from './Presentation.jsx';

// 1080x1920 (TikTok / Reels / Shorts), 30 fps.
export const RemotionRoot = () => (
  <>
    {/* Video promo rythmee (~31 s, musique seule) */}
    <Composition
      id="SnapTapPromo"
      component={Promo}
      durationInFrames={925}
      fps={30}
      width={1080}
      height={1920}
    />
    {/* Video de presentation (~43 s, sous-titres + voix off ElevenLabs) */}
    <Composition
      id="SnapTapPresentation"
      component={Presentation}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1080}
      height={1920}
    />
  </>
);
