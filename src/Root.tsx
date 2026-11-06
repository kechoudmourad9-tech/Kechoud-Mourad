import { Composition } from "remotion";
import { Edit } from "./Edit";
import { VIDEO } from "./theme";
import { DarijaEdit } from "./darija/DarijaEdit";
import { TOTAL } from "./darija/timeline";
import { MATHS_FRAMES, MathsEdit } from "./maths/MathsEdit";
import { POMME_FRAMES, PommeEdit } from "./pomme/PommeEdit";

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
  <Composition id="Maths" component={MathsEdit} durationInFrames={MATHS_FRAMES} fps={30} width={1080} height={1920} />
  <Composition id="Pomme" component={PommeEdit} durationInFrames={POMME_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
