import {
  Brauhaus,
  Fermentable,
  Hop,
  HopStats,
  Recipe,
  RecipeStats,
} from "./types";

export let COLOR_NAMES: [number, string][] = [
  [2, "pale straw"],
  [3, "straw"],
  [4, "yellow"],
  [6, "gold"],
  [9, "amber"],
  [14, "deep amber"],
  [17, "copper"],
  [18, "deep copper"],
  [22, "brown"],
  [30, "dark brown"],
  [35, "very dark brown"],
  [40, "black"],
];

export let RELATIVE_SUGAR_DENSITY = {
  cornSugar: 1.0,
  dme: 1.62,
  honey: 0.71,
  sugar: 0.88,
};

// Conversions

// Kilograms <=> Pounds / Ounces
export const gToOz = (g: number): number => g * 0.035274;
export const ozToG = (oz: number): number => oz * 28.3495;
export const kgToLb = (kg: number): number => kg * 2.20462;
export const lbToKg = (lb: number): number => lb / 2.20462;
export const kgToLbOz = (
  kg: number,
  int?: boolean
): { lb: number; oz: number } => {
  let lb = kgToLb(kg);
  let oz = (lb - Math.floor(lb)) * 16.0;
  if (int) {
    oz = Math.round(oz);
    lb += Math.floor(oz / 16.0);
    oz = oz % 16.0;
  }
  return { lb: Math.floor(lb), oz: oz };
};
export const lbOzToKg = (lb: number, oz: number): number =>
  lbToKg(lb + oz / 16.0);

// Liters <=> Gallons
export const litersToGallons = (liters: number): number => liters * 0.264172;
export const gallonsToLiters = (gallons: number): number => gallons / 0.264172;
export const mlToOz = (ml: number): number => ml / 29.5735;
export const ozToMl = (oz: number): number => oz * 29.5735;
export const litersPerKgToQuartsPerLb = (litersPerKg: number): number =>
  litersPerKg * 0.479305709;
export const quartsPerLbToLitersPerKg = (quartsPerLb: number): number =>
  quartsPerLb / 0.479305709;

// Celcius <=> Fahrenheit
export const cToF = (c: number): number => c * 1.8 + 32.0;
export const fToC = (f: number): number => (f - 32.0) / 1.8;

// Yield <=> Parts per gallon
export const yieldToPpg = (yieldPercentage: number): number =>
  yieldPercentage * 0.46214;
export const ppgToYield = (ppg: number): number => ppg / 0.46214;

// SRM <=> EBC <=> Lovibond <=> RGB
export const srmToEbc = (srm: number): number => srm * 1.97;
export const ebcToSrm = (ebc: number): number => ebc / 1.97;
export const srmToLovibond = (srm: number): number => (srm + 0.76) / 1.3546;
export const lovibondToSrm = (lovibond: number): number =>
  lovibond * 1.3546 - 0.76;
export const srmToRgb = (srm: number): [number, number, number] => {
  let r = 0,
    g = 0,
    b = 0;

  // The following formulas are based on Wolfram Alpha regression analysis of
  // the sRGB values in the BJCP beer color chart at:
  // https://www.bjcp.org/education-training/education-resources/color-guide/
  // R^2 is around 0.999 for red/green while blue is closer to 0.95 due to
  // its nonlinear and nonperiodic nature, though in practice that just
  // means +/- around 3 on the blue channel. Good enough 😁
  if (srm <= 17) {
    r = Math.round(
      Math.min(
        255,
        Math.max(0, 0.108328 * Math.pow(srm, 2) - 7.51456 * srm + 247.646)
      )
    );
  } else {
    r = Math.round(
      Math.min(
        255,
        Math.max(
          0,
          -0.000244245 * Math.pow(srm, 3) +
            0.0732848 * Math.pow(srm, 2) -
            7.46959 * srm +
            258.417
        )
      )
    );
  }

  if (srm <= 35) {
    g = Math.round(
      Math.min(
        250,
        Math.max(
          0,
          0.000326545 * Math.pow(srm, 4) -
            0.0329897 * Math.pow(srm, 3) +
            1.26377 * Math.pow(srm, 2) -
            24.8129 * srm +
            260.181
        )
      )
    );
  } else {
    g = Math.max(0, Math.round(34 - 0.5 * srm));
  }

  if (srm <= 4) {
    b = Math.round(
      Math.min(220, Math.max(0, 189.333 - 96.6606 * Math.log(srm)))
    );
  } else if (srm >= 100) {
    b = 0;
  } else {
    b = Math.round(
      Math.min(
        255,
        Math.max(0, 0.00417922 * Math.pow(srm, 2) - 1.27523 * srm + 58.7472)
      )
    );
  }

  return [r, g, b];
};
export const ebcToRgb = (ebc: number): [number, number, number] => {
  return srmToRgb(ebc / 1.97);
};
export const ebcToCss = (srm: number): string => {
  const [r, g, b] = ebcToRgb(srm);
  return `rgb(${r}, ${g}, ${b})`;
};
export const srmToName = (srm: number): string => {
  let color = COLOR_NAMES[0][1];

  for (let item of COLOR_NAMES) {
    if (item[0] <= srm) {
      color = item[1];
    }
  }

  return color;
};
export const sgToPlato = (sg: number) =>
  -616.868 +
  1111.14 * sg -
  630.272 * Math.pow(sg, 2) +
  135.997 * Math.pow(sg, 3);

// Other
export const timeToHeat = (
  energy: number,
  liters: number,
  degrees: number = 80
): number => {
  const kj = 4.19 * liters * degrees;
  const minutes = (kj / energy) * 60;
  return minutes;
};

export function getAddition(f: Fermentable): "boil" | "mash" | "late" {
  if (f.name.indexOf("(late)") !== -1) {
    return "late";
  }
  if (f.name.indexOf("(boil)") !== -1) {
    return "boil";
  }
  if (f.name.indexOf("(mash)") !== -1) {
    return "mash";
  }
  if (
    /candi|candy|dme|dry|extract|honey|lme|liquid|sugar|syrup|turbinado/i.exec(
      f.name
    )
  ) {
    return "boil";
  }
  return "mash";
}

export function calculateColor(recipe: Recipe): number {
  let mcu = 0.0;

  for (let fermentable of recipe.fermentables) {
    // Malt color units
    mcu +=
      (ebcToSrm(fermentable.ebc) * kgToLb(fermentable.grams / 1000)) /
      litersToGallons(recipe.batchSize);
  }

  // Morey equation
  return srmToEbc(1.4922 * Math.pow(mcu, 0.6859));
}

export function calculateFermentables(
  bh: Brauhaus,
  recipe: Recipe
): RecipeStats {
  let og = 1.0;

  let attenuation = 0.0;

  let fermentableGrams = 0.0;

  for (let fermentable of recipe.fermentables) {
    fermentableGrams += fermentable.grams;

    const addition = getAddition(fermentable);
    // console.log(`${fermentable.name} is ${addition} addition`);
    const efficiency = {
      mash: 75 / 100,
      boil: 1.0,
      late: 1.0,
    }[addition];

    // gu = parts per gallon * weight in pounds / gallons
    const ppg = yieldToPpg(fermentable.percentYield);
    const weightLb = kgToLb(fermentable.grams / 1000);
    const gu = (ppg * weightLb) / litersToGallons(recipe.batchSize);
    const gravity = (gu * efficiency) / 1000.0;
    og += gravity;
  }

  for (let yeast of recipe.yeasts) {
    if (yeast.attenuation > attenuation) {
      attenuation = yeast.attenuation;
    }
  }

  if (attenuation === 0) {
    attenuation = 75;
  }

  // Adjust attenuation for mash temp, if possible. From:
  // http://www.woodlandbrew.com/2013/01/measured-mash-temperature-effects.html
  // See also https://braukaiser.com/wiki/index.php/Understanding_Attenuation
  let mashTemp = 0;
  for (let step of recipe.mashSteps) {
    // No support for step mashes for now, if a low saccharification temp is
    // found then it'll just use that. Need to do some experiments at some
    // point to determine the impact of two-part saccharification resting on
    // attenuation as I can't find anything online about it.
    if (step.temperature >= 60 && step.temperature <= 72) {
      mashTemp = cToF(step.temperature);
    }
  }
  if (mashTemp > 0 && (mashTemp < 145 || mashTemp > 151)) {
    // Quadratic function generated from the tabular data at the link above.
    const adjust = Math.min(
      10,
      0.0540504 * Math.pow(mashTemp, 2) - 15.9457 * mashTemp + 1175.94
    );
    attenuation -= adjust;
  }

  const fg = og - ((og - 1.0) * attenuation) / 100.0;
  const abv = ((1.05 * (og - fg)) / fg / 0.79) * 100.0;

  const ogPlato = sgToPlato(og);
  const fgPlato = sgToPlato(fg);

  // Update calories
  const realExtract = 0.1808 * ogPlato + 0.8192 * fgPlato;
  const abw = (0.79 * abv) / fg;
  const calories = Math.max(
    0,
    (6.9 * abw + 4.0 * (realExtract - 0.1)) *
      fg *
      (recipe.servingSizeMl / 1000) *
      10
  );

  return {
    fermentableGrams,
    og,
    fg,
    ogPlato,
    fgPlato,
    abv,
    calories,
  };
}

export function caluclateIBU(
  hop: Hop,
  ibuMethod: "tinseth" | "rager",
  earlyOg: number,
  batchSize: number
): number {
  // Calculate bitterness based on chosen method
  const utilizationFactor = hop.form === "pellet" ? 1.15 : 1.0;
  switch (ibuMethod) {
    case "tinseth":
      return (
        1.65 *
        Math.pow(0.000125, earlyOg - 1.0) *
        ((1 - Math.pow(Math.E, -0.04 * hop.time)) / 4.15) *
        (((hop.aa / 100.0) * (hop.grams / 1000) * 1000000) / batchSize) *
        utilizationFactor
      );
    case "rager":
      const utilization = 18.11 + 13.86 * Math.tanh((hop.time - 31.32) / 18.27);
      const adjustment = Math.max(0, (earlyOg - 1.05) / 0.2);
      return (
        ((hop.grams / 1000) * 100 * utilization * utilizationFactor * hop.aa) /
        (batchSize * (1 + adjustment))
      );
  }
}

export function calculateHops(bh: Brauhaus, recipe: Recipe): HopStats {
  const stats: HopStats = {
    grams: 0,
    ibuMap: {},
    ibu: 0,
  };

  let earlyOg = 1;
  for (let fermentable of recipe.fermentables) {
    // TODO: prevent calculating this twice...
    const addition = getAddition(fermentable);
    const efficiency = {
      mash: 75 / 100,
      boil: 1,
      late: 1,
    }[addition];

    if (addition !== "late") {
      // gu = parts per gallon * weight in pounds / gallons
      const ppg = yieldToPpg(fermentable.percentYield);
      const weightLb = kgToLb(fermentable.grams / 1000);
      const boilGal = litersToGallons(recipe.boilSize);

      earlyOg += (((ppg * weightLb) / boilGal) * efficiency) / 1000;
    }
  }

  for (let [i, hop] of recipe.hops.entries()) {
    stats.grams += hop.grams;

    if (hop.use === "boil") {
      const hopIBU = caluclateIBU(hop, bh.ibuMethod, earlyOg, recipe.batchSize);
      stats.ibuMap[i] = hopIBU;
      stats.ibu += hopIBU;
    }
  }

  return stats;
}
