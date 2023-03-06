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
export const kgToLb = (kg: number): number => kg * 2.20462;
export const lbToKg = (lb: number): number => lb / 2.20462;
export const kgToLbOz = (kg: number): { lb: number; oz: number } => {
  const lb = kgToLb(kg);
  return { lb: Math.floor(lb), oz: (lb - Math.floor(lb)) * 16.0 };
};
export const lbOzToKg = (lb: number, oz: number): number =>
  lbToKg(lb + oz / 16.0);

// Liters <=> Gallons
export const litersToGallons = (liters: number): number => liters * 0.264172;
export const gallonsToLiters = (gallons: number): number => gallons / 0.264172;
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
  const r = Math.round(Math.min(255, Math.max(0, 255 * Math.pow(0.975, srm))));
  const g = Math.round(Math.min(255, Math.max(0, 245 * Math.pow(0.88, srm))));
  const b = Math.round(Math.min(255, Math.max(0, 220 * Math.pow(0.7, srm))));
  return [r, g, b];
};
export const ebcToRgb = (ebc: number): [number, number, number] => {
  const r = Math.round(
    Math.min(255, Math.max(0, 255 * Math.pow(0.975, ebc / 1.97)))
  );
  const g = Math.round(
    Math.min(255, Math.max(0, 245 * Math.pow(0.88, ebc / 1.97)))
  );
  const b = Math.round(
    Math.min(255, Math.max(0, 220 * Math.pow(0.7, ebc / 1.97)))
  );
  return [r, g, b];
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
      mash: recipe.efficiency / 100,
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
      mash: recipe.efficiency / 100,
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

  for (let hop of recipe.hops) {
    stats.grams += hop.grams;

    if (hop.use === "boil") {
      const hopIBU = caluclateIBU(hop, bh.ibuMethod, earlyOg, recipe.batchSize);
      stats.ibuMap[hop.id] = hopIBU;
      stats.ibu += hopIBU;
    }
  }

  return stats;
}
