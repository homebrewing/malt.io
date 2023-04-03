import { Component, For, createEffect, createSignal } from "solid-js";

import { Brauhaus } from "./brauhaus/types";
import { RecipeCard } from "./RecipeCard";
import { load } from "./crush";
import origRecipes from "./assets/recipes-crushed.json";

const recipes = origRecipes
  .sort(() => (Math.random() > 0.5 ? 1 : -1))
  .map((r) => ({ crushed: r, recipe: load(r) }));

export const Home: Component<{
  bh: Brauhaus;
}> = (props) => {
  const [search, setSearch] = createSignal("");
  const [filteredRecipes, setFilteredRecipes] = createSignal([...recipes]);

  createEffect(() => {
    setFilteredRecipes(
      search()
        ? recipes.filter(
            (i) =>
              i.recipe.name.toLowerCase().indexOf(search().toLowerCase()) !==
                -1 ||
              i.recipe.description
                .toLowerCase()
                .indexOf(search().toLowerCase()) !== -1
          )
        : [...recipes]
    );
  });

  return (
    <article style="padding: 12px">
      <h1
        class="hero"
        style="text-align: center; font-size: 1000%; margin: 12px; margin-bottom: -28px;"
      >
        Malt<span class="slightly-muted">.io</span>
      </h1>
      <div style="text-align: center; font-size: 240%; margin-bottom: 32px;">
        Recipe Design & Sharing
      </div>
      <div class="row center">
        <input
          type="search"
          placeholder="Search..."
          autofocus
          value={search()}
          oninput={(e) => setSearch(e.currentTarget.value)}
        ></input>
      </div>
      <div class="recipe-cards">
        <For each={filteredRecipes()} fallback={"No matches"}>
          {(entry) => (
            <RecipeCard
              bh={props.bh}
              crushed={entry.crushed}
              recipe={entry.recipe}
            />
          )}
        </For>
      </div>
    </article>
  );
};
