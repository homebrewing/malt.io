import { load } from "./crush";
import recipes from "./assets/recipes-crushed.json";

console.log(
  JSON.stringify(
    recipes.map((r) => load(r)).sort((a, b) => a.name.localeCompare(b.name)),
    null,
    2
  )
);
