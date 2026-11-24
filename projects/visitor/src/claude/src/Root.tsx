import { Composition } from "remotion";
import { FRAMES } from "./scene";
import { DURATION } from "./timeline";
import { Visitor, VisitorFilm } from "./Visitor";

const size = { fps: 60, width: 1080, height: 1920 };

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Visitor"
        component={VisitorFilm}
        durationInFrames={DURATION * 60}
        {...size}
      />
      {/* Key frames only: frame n shows still n + 1. */}
      <Composition
        id="VisitorFrames"
        component={Visitor}
        durationInFrames={FRAMES}
        {...size}
      />
    </>
  );
};
