import { Composition } from "remotion";
import { SoulEscape } from "./SoulEscape";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SoulEscape"
        component={SoulEscape}
        durationInFrames={1500}
        fps={60}
        width={1080}
        height={1920}
        defaultProps={{orange: '#ff6a00', lineCount: 30, intensity: 1, cameraMotion: 1, showTrails: true}}
      />
    </>
  );
};
