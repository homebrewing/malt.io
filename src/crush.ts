import { decodeBinary, encodeBinary } from "./binary";
import { fromUint8Array, toUint8Array } from "js-base64";

import { Recipe } from "./brauhaus/types";
import { deflateRaw } from "pako";
import { dictionary } from "./dict";
import { finflate } from "./uzip.js";

export function crush(r: Recipe): string {
  let b = encodeBinary(r);
  const defBin = deflateRaw(b, {
    level: 9,
    dictionary,
  });
  return fromUint8Array(defBin, true);
}

export function load(encoded: string): Recipe {
  // let start = performance.now();
  let deflated: Uint8Array;
  deflated = toUint8Array(encoded);
  // console.log(performance.now() - start + "ms for base64");

  // start = performance.now();
  const bytes = finflate(deflated, null, new TextEncoder().encode(dictionary));
  // console.log(performance.now() - start + "ms for uzip+dict");

  // start = performance.now();
  const recipe = decodeBinary(bytes);
  // console.log(performance.now() - start + "ms for decode");
  // console.log(performance.now() - start + "ms for load");
  return recipe;
}
