import { Recipe } from "./brauhaus/types";
import { crush } from "./crush";
import recipes from "./assets/recipes.json";

console.log(
  JSON.stringify(
    recipes.map((r) => crush(r as Recipe)),
    null,
    2
  )
);
