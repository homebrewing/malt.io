import jarGlass from "./assets/jar.svg";
import pilsnerGlass from "./assets/pilsner.svg";
import pintGlass from "./assets/pint.svg";
import tulipGlass from "./assets/tulip.svg";
import weizenGlass from "./assets/weizen.svg";

export const names = ["pint", "weizen", "tulip", "pilsner", "jar"];

export const glasses: { [key: string]: string } = {
  pint: pintGlass,
  weizen: weizenGlass,
  tulip: tulipGlass,
  pilsner: pilsnerGlass,
  jar: jarGlass,
  // mug: mugGlass,
};
