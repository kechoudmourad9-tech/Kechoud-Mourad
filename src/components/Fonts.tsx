import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import { theme } from "../theme";

const faces: [string, string, string][] = [
  [theme.fonts.display, "fonts/anton.woff2", "400"],
  [theme.fonts.body, "fonts/inter-600.woff2", "600"],
  [theme.fonts.body, "fonts/inter-800.woff2", "800"],
];

export const useFonts = () => {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all(
      faces.map(([family, file, weight]) => {
        const f = new FontFace(family, `url(${staticFile(file)}) format("woff2")`, { weight });
        return f.load().then((l) => document.fonts.add(l));
      }),
    ).then(() => continueRender(handle));
  }, [handle]);
};
