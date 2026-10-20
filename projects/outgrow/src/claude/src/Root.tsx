import { Composition } from "remotion";
import { Outgrow } from "./Outgrow";
import { DURATION } from "./timeline";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Outgrow"
        component={Outgrow}
        durationInFrames={Math.round(DURATION * 60)}
        fps={60}
        width={1080}
        height={1920}
        defaultProps={{ orange: "#ff6a00", white: "#ffffff", lineWidth: 2.4 }}
      />
    </>
  );
};
