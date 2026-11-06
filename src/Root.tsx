import { Composition } from "remotion";
import { Edit } from "./Edit";
import { VIDEO } from "./theme";
import { DarijaEdit } from "./darija/DarijaEdit";
import { TOTAL } from "./darija/timeline";

export const RemotionRoot: React.FC = () => (
  <>
  <Composition
    id="Edit"
    component={Edit}
    durationInFrames={VIDEO.durationInFrames}
    fps={VIDEO.fps}
    width={VIDEO.width}
    height={VIDEO.height}
  />
  <Composition id="Darija" component={DarijaEdit} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
  </>
);
