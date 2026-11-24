import { Composition } from "remotion";
import { FRAMES } from "./scene";
import { Visitor } from "./Visitor";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Key frames only: frame n shows still n + 1. */}
      <Composition
        id="VisitorFrames"
        component={Visitor}
        durationInFrames={FRAMES}
        fps={60}
        width={1080}
        height={1920}
      />
    </>
  );
};
