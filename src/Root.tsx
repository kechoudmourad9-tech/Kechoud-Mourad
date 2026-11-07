import { Composition } from "remotion";
import { Edit } from "./Edit";
import { VIDEO } from "./theme";
import { DarijaEdit } from "./darija/DarijaEdit";
import { TOTAL } from "./darija/timeline";
import { MATHS_FRAMES, MathsEdit } from "./maths/MathsEdit";
import { POMME_FRAMES, PommeEdit } from "./pomme/PommeEdit";
import { ENSEMBLES_FRAMES, EnsemblesEdit } from "./pomme/EnsemblesEdit";
import { MEDIAS_FRAMES, MediasEdit } from "./pomme/MediasEdit";
import { GALATIA_FRAMES, GalatiaTrailer } from "./galatia/GalatiaTrailer";

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
  <Composition id="Ensembles" component={EnsemblesEdit} durationInFrames={ENSEMBLES_FRAMES} fps={30} width={1080} height={1920} />
  <Composition id="Medias" component={MediasEdit} durationInFrames={MEDIAS_FRAMES} fps={30} width={1080} height={1920} />
  <Composition id="Galatia" component={GalatiaTrailer} durationInFrames={GALATIA_FRAMES} fps={30} width={1920} height={1080} />
  </>
);
