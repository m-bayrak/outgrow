import { Composition } from "remotion";
import { Outgrow } from "./Outgrow";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Outgrow"
        component={Outgrow}
        durationInFrames={780}
        fps={60}
        width={1080}
        height={1920}
        defaultProps={{ orange: "#ff6a00", white: "#ffffff", lineWidth: 2.4 }}
      />
    </>
  );
};
