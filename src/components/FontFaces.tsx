import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";

/** Load [family, file in public/, weight] font faces before the first frame renders. */
export const useFontFaces = (faces: [string, string, string][]) => {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all(
      faces.map(([family, file, weight]) =>
        new FontFace(family, `url(${staticFile(file)}) format("woff2")`, { weight }).load().then((l) => document.fonts.add(l)),
      ),
    ).then(() => continueRender(handle));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle]);
};
