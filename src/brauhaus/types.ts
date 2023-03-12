export type Brauhaus = {
  roomTemp: number;
  grainTemp: number;
  burnerEnergy: number;
  mashHeatLoss: number;
  ibuMethod: "tinseth" | "rager";
};

export type Fermentable = {
  name: string;
  grams: number;
  percentYield: number;
  ebc: number;
};

export type Hop = {
  name: string;
  grams: number;
  aa: number;
  use: "mash" | "boil" | "aroma" | "dry hop";
  time: number;
  form: "pellet" | "leaf" | "plug";
};

export type Misc = {
  name: string;
  time: number;
  use: "mash" | "boil" | "primary" | "secondary" | "bottling";
  amount: number;
  units: "g" | "ml" | "each" | "tsp" | "tbsp" | "mg/l";
};

export type Yeast = {
  amount: number;
  units: "g" | "ml" | "pkt";
  name: string;
  type: "ale" | "lager" | "cider" | "wine" | "other";
  form: "liquid" | "dry";
  attenuation: number;
};

export type MashStep = {
  name: string;
  waterGrainRatio: number;
  temperature: number;
  duration: number;
  rampTime: number;
};

export type WaterProfile = {
  ca: number;
  mg: number;
  na: number;
  cl: number;
  so4: number;
  hco3: number;
};

export type Recipe = {
  name: string;
  description: string;
  type: "all grain" | "extract" | "partial mash";
  boilSize: number;
  batchSize: number;
  efficiency: number;
  servingSizeMl: number;

  style: number;

  fermentables: Fermentable[];
  hops: Hop[];
  miscs: Misc[];
  yeasts: Yeast[];

  pH: number;
  mashSteps: MashStep[];

  water: WaterProfile;

  primaryDays: number;
  primaryTemp: number;
  secondaryDays: number;
  secondaryTemp: number;
  tertiaryDays: number;
  tertiaryTemp: number;
  agingDays: number;
  agingTemp: number;
};

export type RecipeStats = {
  fermentableGrams: number;
  og: number;
  fg: number;
  ogPlato: number;
  fgPlato: number;
  abv: number;
  calories: number;
};

export type HopStats = {
  grams: number;
  ibuMap: {
    [key: number]: number;
  };
  ibu: number;
};
