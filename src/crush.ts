import { Inflate, deflateRaw } from "pako";
import { decodeBinary, encodeBinary } from "./binary";

import { Base64 } from "js-base64";
import { Recipe } from "./brauhaus/types";
import { dictionary } from "./dict";

export function crush(r: Recipe): string {
  let b = encodeBinary(r);
  const defBin = deflateRaw(b, {
    level: 9,
    dictionary,
  });
  return Base64.fromUint8Array(defBin, true);
}

export function load(binary: string): Recipe {
  const base64 = Base64.toUint8Array(binary);
  const i = new Inflate({ raw: true, dictionary });
  i.push(base64, true);
  return decodeBinary(i.result as Uint8Array);
}
