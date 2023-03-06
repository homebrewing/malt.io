import { Inflate, deflateRaw } from "pako";
import { decodeBinary, encodeBinary } from "./binary";

import { Base64 } from "js-base64";
import { Recipe } from "./brauhaus/types";
import { dictionary } from "./dict";

export function crush(r: Recipe): string {
  let b = encodeBinary(r);
  console.log("binary", Base64.fromUint8Array(new Uint8Array(b), true));
  const defBin = deflateRaw(b, {
    level: 9,
    dictionary,
  });
  const base64 = Base64.fromUint8Array(defBin, true);
  console.log("defbin", base64);

  const start = performance.now();
  const i = new Inflate({ raw: true, dictionary });
  i.push(defBin, true);
  decodeBinary(i.result as Uint8Array);
  console.log("inflate perf", performance.now() - start, "ms");
  console.log(JSON.stringify(decodeBinary(i.result as Uint8Array)));

  return base64;
}

export function load(binary: string): Recipe {
  const base64 = Base64.toUint8Array(binary);
  const i = new Inflate({ raw: true, dictionary });
  i.push(base64, true);
  return decodeBinary(i.result as Uint8Array);
}
