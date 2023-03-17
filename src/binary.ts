import { Hop, MashStep, Misc, Recipe, Yeast } from "./brauhaus/types";

import { ByteBuf } from "bytebuf";
import { createRecipe } from "./brauhaus/partials";

const gPerKg = 1000;
const gPerOz = 28.3495;
const gPerLb = 453.592;

export function encodeBinary(r: Recipe): ArrayBuffer {
  const data = new Uint8Array(4096);
  const buf = ByteBuf.from(data);

  // 0b 000 000          00
  //        serving_size type
  let mask = 0;

  if (r.type === "partial mash") mask |= 0b000000_01;
  if (r.type === "extract") mask |= 0b000000_10;

  let customServingSize = 0;
  switch (r.servingSizeMl) {
    case 300:
      mask |= 0b000_000_00;
      break;
    case 330:
      mask |= 0b000_001_00;
      break;
    case 355: // 12oz
      mask |= 0b000_010_00;
      break;
    case 375:
      mask |= 0b000_011_00;
      break;
    case 473: // 16oz (US pint)
      mask |= 0b000_100_00;
      break;
    case 500:
      mask |= 0b000_101_00;
      break;
    case 568: // UK pint
      mask |= 0b000_110_00;
      break;
    default:
      mask |= 0b000_111_00;
      customServingSize = r.servingSizeMl;
  }

  buf.writeUint8(mask);

  // 122 styles BJCP 2021, needs 7 bits
  // 0b 0          0000000
  //    size_small style
  mask = r.style & 0b01111111;
  if (r.batchSize < 64 && r.boilSize < 64) {
    mask |= 0b10000000;
  }
  buf.writeUint8(mask);

  buf.writeVarString(r.name);
  buf.writeVarString(r.description);

  if (r.batchSize < 32 && r.boilSize - r.batchSize < 8) {
    // 0b 00000 000
    //    batch (boil - batch diff)
    // batch vs boil will usually be about ~4L/1gal difference.
    buf.writeUint8((r.batchSize << 3) | (r.boilSize - r.batchSize));
  } else {
    buf.writeVarUint(r.batchSize);
    buf.writeVarUint(r.boilSize);
  }

  if (customServingSize) {
    buf.writeVarUint(r.servingSizeMl);
  }

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

  if (r.type !== "extract") {
    // 0b 0                 0000000
    //    has_water_profile mash_steps
    let has_water_profile = false;

    let mask = 0;
    if (
      r.water.ca != 0 ||
      r.water.mg != 0 ||
      r.water.na != 0 ||
      r.water.cl != 0 ||
      r.water.so4 != 0 ||
      r.water.hco3 != 0
    ) {
      has_water_profile = true;
      mask |= 0b1_0000000;
    }
    mask |= r.mashSteps.length & 0b0_1111111;
    buf.writeUint8(mask);

    for (const ms of r.mashSteps) {
      let customDuration = 0;
      let customRampTime = 0;

      // 0b 000000 000 00000 00
      //    temp   dur ratio ramp
      // temp 6 bits: 25-88C
      // dur 3 bits: 5, 10, 15, 20, 30, 45, 60, other (adds varint)
      // ratio 5 bits single fixed decimal: 1.6 - 4.7
      // ramp time 2 bits: 0, 15, 20, other (adds varint)
      let mask = 0;
      mask |= (ms.temperature - 25) << 10;
      switch (ms.duration) {
        case 5:
          break;
        case 10:
          mask |= 0b000000_001_00000_00;
          break;
        case 15:
          mask |= 0b000000_010_00000_00;
          break;
        case 20:
          mask |= 0b000000_011_00000_00;
          break;
        case 30:
          mask |= 0b000000_100_00000_00;
          break;
        case 45:
          mask |= 0b000000_101_00000_00;
          break;
        case 60:
          mask |= 0b000000_110_00000_00;
          break;
        default:
          mask |= 0b000000_111_00000_00;
          customDuration = ms.duration;
      }
      mask |= Math.round((ms.waterGrainRatio - 1.6) * 10) << 2;
      switch (ms.rampTime) {
        case 0:
          break;
        case 15:
          mask |= 0b000000_000_00000_01;
          break;
        case 20:
          mask |= 0b000000_000_00000_10;
          break;
        default:
          mask |= 0b000000_000_00000_11;
          customRampTime = ms.rampTime;
      }
      buf.writeUint16(mask);

      buf.writeVarString(ms.name);

      if (customDuration) {
        buf.writeVarUint(customDuration);
      }
      if (customRampTime) {
        buf.writeVarUint(customRampTime);
      }
    }

    if (has_water_profile) {
      buf.writeVarUint(r.water.ca);
      buf.writeVarUint(r.water.mg);
      buf.writeVarUint(r.water.na);
      buf.writeVarUint(r.water.cl);
      buf.writeVarUint(r.water.so4);
      buf.writeVarUint(r.water.hco3);
    }
  }

  return buf.buffer.slice(0, buf.byteOffset);
}

export function decodeBinary(data: Uint8Array): Recipe {
  const buf = ByteBuf.from(data);

  const mask1 = buf.readUint8();
  const mask2 = buf.readUint8();

  const r: Recipe = createRecipe({
    type: "all grain",
    name: buf.readVarString(),
    description: buf.readVarString(),
    style: mask2 & 0b01111111,
  });

  if (mask1 & 0b000_000_01) r.type = "partial mash";
  if (mask1 & 0b000_000_10) r.type = "extract";

  if (mask2 & 0b1_0000000) {
    const size = buf.readUint8();
    r.batchSize = size >> 3;
    r.boilSize = (size & 0b00000_111) + r.batchSize;
  } else {
    r.batchSize = buf.readVarUint();
    r.boilSize = buf.readVarUint();
  }

  const servingSize = (mask1 & 0b000_111_00) >> 2;
  if (servingSize === 7) {
    r.servingSizeMl = buf.readVarUint();
  } else {
    r.servingSizeMl = [300, 330, 355, 375, 473, 500, 568][servingSize];
  }

  const counts1 = buf.readUint8();
  const counts2 = buf.readUint8();

  const fermentableCount = counts1 >> 4;
  const miscCount = counts1 & 0b0000_1111;
  const hopCount = counts2 >> 3;
  const yeastCount = counts2 & 0b00000_111;

  for (let i = 0; i < fermentableCount; i++) {
    r.fermentables.push({
      name: buf.readVarString(),
      grams: buf.readVarUint(),
      ebc: buf.readVarUint() / 10,
      percentYield: buf.readUint8(),
    });
  }

  for (let i = 0; i < hopCount; i++) {
    const h: Hop = {
      name: buf.readVarString(),
      grams: buf.readVarUint(),
      aa: buf.readVarUint() / 10,
      use: "boil",
      form: "pellet",
      time: 60,
    };
    const mask = buf.readUint8();
    if (mask & 0b000_0_00_01) h.use = "dry hop";
    if (mask & 0b000_0_00_10) h.use = "mash";
    if (mask & 0b000_0_00_11) h.use = "aroma";
    if (mask & 0b000_0_01_00) h.form = "leaf";
    if (mask & 0b000_0_10_00) h.form = "plug";
    if (mask & 0b000_1_00_00) h.time = buf.readVarUint();
    r.hops.push(h);
  }

  for (let i = 0; i < miscCount; i++) {
    const m: Misc = {
      name: buf.readVarString(),
      time: buf.readVarUint(),
      amount: buf.readVarUint(),
      use: "boil",
      units: "g",
    };
    const mask = buf.readUint8();
    m.use = ["boil", "mash", "primary", "secondary", "bottling"][
      (mask & 0b00_111_000) >> 3
    ] as any;
    m.units = ["g", "ml", "each", "tsp", "tbsp", "mg/l"][
      mask & 0b00_000_111
    ] as any;
    r.miscs.push(m);
  }

  for (let i = 0; i < yeastCount; i++) {
    const y: Yeast = {
      name: buf.readVarString(),
      attenuation: buf.readUint8(),
      form: "dry",
      units: "pkt",
      type: "ale",
      amount: 1,
    };
    const mask = buf.readUint8();
    if (mask & 0b0_0000_00_1) y.form = "liquid";
    if (mask & 0b0_0000_10_0) y.units = "g";
    if (mask & 0b0_0001_00_0) y.units = "ml";
    if (mask & 0b0_0010_00_0) y.type = "lager";
    if (mask & 0b0_0100_00_0) y.type = "cider";
    if (mask & 0b0_0110_00_0) y.type = "wine";
    if (mask & 0b0_1000_00_0) y.type = "other";
    if (mask & 0b1_0000_00_0) y.amount = buf.readVarUint();
    r.yeasts.push(y);
  }

  if (r.type !== "extract") {
    let mask = buf.readUint8();
    const has_water_profile = mask & 0b1_0000000;
    const mashStepCount = mask & 0b0_1111111;
    for (let i = 0; i < mashStepCount; i++) {
      const mask = buf.readUint16();
      const ms: MashStep = {
        name: buf.readVarString(),
        temperature: 68,
        duration: 60,
        waterGrainRatio: 3,
        rampTime: 0,
      };

      ms.temperature = (mask >> 10) + 25;

      const dur = [5, 10, 15, 20, 30, 45, 60, -1][
        (mask & 0b000000_111_00000_00) >> 7
      ];
      if (dur === -1) {
        ms.duration = buf.readVarUint();
      } else {
        ms.duration = dur;
      }

      ms.waterGrainRatio = ((mask & 0b000000_000_11111_00) >> 2) / 10 + 1.6;

      const ramp = [0, 15, 20, -1][mask & 0b000000_000_00000_11];
      if (ramp === -1) {
        ms.rampTime = buf.readVarUint();
      } else {
        ms.rampTime = ramp;
      }

      r.mashSteps.push(ms);
    }

    if (has_water_profile) {
      r.water = {
        ca: buf.readVarUint(),
        mg: buf.readVarUint(),
        na: buf.readVarUint(),
        cl: buf.readVarUint(),
        so4: buf.readVarUint(),
        hco3: buf.readVarUint(),
      };
    }
  }

  return r;
}
