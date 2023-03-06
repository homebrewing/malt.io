import { Hop, Misc, Recipe, Yeast } from "./brauhaus/types";

import { ByteBuf } from "bytebuf";
import { createRecipe } from "./brauhaus/partials";

export function encodeBinary(r: Recipe): ArrayBuffer {
  const data = new Uint8Array(2048);
  const buf = ByteBuf.from(data);

  buf.writeVarString(r.name);
  buf.writeVarString(r.description);
  buf.writeVarUint(r.batchSize);
  buf.writeVarUint(r.boilSize);
  buf.writeUint8(r.efficiency);
  buf.writeVarUint(r.servingSizeMl);
  buf.writeUint8(r.style);

  // Counts of fermentables (0-15), hops (0-31), miscs (0-15), yeasts (0-7)
  // 0b0000         0000
  //   fermentables miscs
  buf.writeUint8((r.fermentables.length << 4) | r.miscs.length);
  // 0b00000 000
  //   hops  yeasts
  buf.writeUint8((r.hops.length << 3) | r.yeasts.length);

  for (const f of r.fermentables) {
    buf.writeVarString(f.name);
    buf.writeVarUint(f.grams);
    buf.writeVarUint(Math.round(f.ebc * 10));
    buf.writeUint8(f.percentYield);
  }

  for (const h of r.hops) {
    buf.writeVarString(h.name);
    buf.writeVarUint(h.grams);
    buf.writeVarUint(Math.round(h.aa * 10));

    // 0b 000    0        00   00
    //    unused has_time form use
    let mask = 0;
    if (h.use === "dry hop") mask |= 0b00000001;
    if (h.use === "mash") mask |= 0b00000010;
    if (h.use === "aroma") mask |= 0b00000011;

    if (h.form === "leaf") mask |= 0b00000100;
    if (h.form === "plug") mask |= 0b00001000;

    if (h.time !== 60) mask |= 0b00010000;
    buf.writeUint8(mask);

    if (h.time !== 60) {
      buf.writeVarUint(h.time);
    }
  }

  for (const m of r.miscs) {
    buf.writeVarString(m.name);
    buf.writeVarUint(m.time);
    buf.writeVarUint(m.amount);

    // 0b 00       000 000
    //    unused   use units
    let mask = 0;

    mask |= { g: 0, ml: 1, each: 2, tsp: 3, tbsp: 4, "mg/l": 5 }[m.units];
    mask |=
      { boil: 0, mash: 1, primary: 2, secondary: 3, bottling: 4 }[m.use] << 3;
    buf.writeUint8(mask);
  }

  for (const y of r.yeasts) {
    buf.writeVarString(y.name);
    buf.writeUint8(y.attenuation);

    // 0b 0          000  00    00
    //   	has_amount type units form
    let mask = 0;
    if (y.form === "liquid") mask |= 0b00000001;
    if (y.units === "g") mask |= 0b00000100;
    if (y.units === "ml") mask |= 0b00001000;
    if (y.type === "lager") mask |= 0b00010000;
    if (y.type === "cider") mask |= 0b00100000;
    if (y.type === "wine") mask |= 0b00110000;
    if (y.type === "other") mask |= 0b01000000;
    if (y.amount !== 1) mask |= 0b10000000;
    buf.writeUint8(mask);

    if (y.amount !== 1) {
      buf.writeVarUint(y.amount);
    }
  }

  return buf.buffer.slice(0, buf.byteOffset);
}

export function decodeBinary(data: Uint8Array): Recipe {
  const buf = ByteBuf.from(data);
  const r: Recipe = createRecipe({
    name: buf.readVarString(),
    description: buf.readVarString(),
    batchSize: buf.readVarUint(),
    boilSize: buf.readVarUint(),
    efficiency: buf.readUint8(),
    servingSizeMl: buf.readVarUint(),
    style: buf.readUint8(),
  });

  let id = 1;

  const counts1 = buf.readUint8();
  const counts2 = buf.readUint8();

  const fermentableCount = counts1 >> 4;
  const miscCount = counts1 & 0b00001111;
  const hopCount = counts2 >> 3;
  const yeastCount = counts2 & 0b00000111;

  for (let i = 0; i < fermentableCount; i++) {
    r.fermentables.push({
      id: id++,
      name: buf.readVarString(),
      grams: buf.readVarUint(),
      ebc: buf.readVarUint() / 10,
      percentYield: buf.readUint8(),
    });
  }

  for (let i = 0; i < hopCount; i++) {
    const h: Hop = {
      id: id++,
      name: buf.readVarString(),
      grams: buf.readVarUint(),
      aa: buf.readVarUint() / 10,
      use: "boil",
      form: "pellet",
      time: 60,
    };
    const mask = buf.readUint8();
    if (mask & 0b00000001) h.use = "dry hop";
    if (mask & 0b00000010) h.use = "mash";
    if (mask & 0b00000011) h.use = "aroma";
    if (mask & 0b00000100) h.form = "leaf";
    if (mask & 0b00001000) h.form = "plug";
    if (mask & 0b00010000) h.time = buf.readVarUint();
    r.hops.push(h);
  }

  for (let i = 0; i < miscCount; i++) {
    const m: Misc = {
      id: id++,
      name: buf.readVarString(),
      time: buf.readVarUint(),
      amount: buf.readVarUint(),
      use: "boil",
      units: "g",
    };
    const mask = buf.readUint8();
    m.use = ["boil", "mash", "primary", "secondary", "bottling"][
      (mask & 0b00111000) >> 3
    ] as any;
    m.units = ["g", "ml", "each", "tsp", "tbsp", "mg/l"][
      mask & 0b00000111
    ] as any;
    r.miscs.push(m);
  }

  for (let i = 0; i < yeastCount; i++) {
    const y: Yeast = {
      id: id++,
      name: buf.readVarString(),
      attenuation: buf.readUint8(),
      form: "dry",
      units: "pkt",
      type: "ale",
      amount: 1,
    };
    const mask = buf.readUint8();
    if (mask & 0b00000001) y.form = "liquid";
    if (mask & 0b00000100) y.units = "g";
    if (mask & 0b00001000) y.units = "ml";
    if (mask & 0b00010000) y.type = "lager";
    if (mask & 0b00100000) y.type = "cider";
    if (mask & 0b00110000) y.type = "wine";
    if (mask & 0b01000000) y.type = "other";
    if (mask & 0b10000000) y.amount = buf.readVarUint();
    r.yeasts.push(y);
  }

  return r;
}
