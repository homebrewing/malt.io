import {
  Brauhaus,
  Fermentable,
  Hop,
  MashStep,
  Misc,
  Recipe,
  Yeast,
} from "./types";

export function createBrauhaus(props: Partial<Brauhaus>): Brauhaus {
  return {
    roomTemp: props.roomTemp ?? 23,
    grainTemp: props.grainTemp ?? 23,
    burnerEnergy: props.burnerEnergy ?? 9000,
    mashHeatLoss: props.mashHeatLoss ?? 5.0,
    ibuMethod: props.ibuMethod ?? "tinseth",
  };
}

export function createFermentable(props: Partial<Fermentable>): Fermentable {
  return {
    name: props.name ?? "New Fermentable",
    grams: props.grams ?? 1000,
    percentYield: props.percentYield ?? 75,
    ebc: props.ebc ?? 3,
  };
}

export function createMisc(props: Partial<Misc>): Misc {
  return {
    name: props.name ?? "New Hop",
    time: props.time ?? 5,
    use: props.use ?? "boil",
    amount: props.amount ?? 1,
    units: props.units ?? "g",
  };
}

export function createHop(props: Partial<Hop>): Hop {
  return {
    name: props.name ?? "New Hop",
    grams: props.grams ?? 28,
    aa: props.aa ?? 5,
    use: props.use ?? "boil",
    time: props.time ?? 60,
    form: props.form ?? "pellet",
  };
}

export function createYeast(props: Partial<Yeast>): Yeast {
  return {
    name: props.name ?? "New Yeast",
    amount: props.amount ?? 1,
    units: props.units ?? "pkt",
    type: props.type ?? "ale",
    form: props.form ?? "dry",
    attenuation: props.attenuation ?? 75,
  };
}

export function createMashStep(props: Partial<MashStep>): MashStep {
  return {
    name: props.name ?? "Saccharification",
    waterGrainRatio: props.waterGrainRatio ?? 3,
    temperature: props.temperature ?? 68,
    duration: props.duration ?? 60,
    rampTime: props.rampTime ?? 0,
  };
}

export function createRecipe(props: Partial<Recipe>): Recipe {
  return {
    name: props.name ?? "New Recipe",
    description: props.description ?? "",
    type: props.type ?? "all grain",
    batchSize: props.batchSize ?? 20,
    boilSize: props.boilSize ?? 25,
    servingSizeMl: props.servingSizeMl ?? 355,
    style: props.style ?? 0,
    fermentables: props.fermentables ?? [],
    hops: props.hops ?? [],
    miscs: props.miscs ?? [],
    yeasts: props.yeasts ?? [],
    water: props.water ?? {
      ca: 0,
      mg: 0,
      na: 0,
      cl: 0,
      so4: 0,
      hco3: 0,
    },
    mashSteps: props.mashSteps ?? [],
    fermentationSteps: props.fermentationSteps ?? [],
    carbonation: props.carbonation ?? 2.4,
  };
}
