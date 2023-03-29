import { Component, For, Show, createEffect } from "solid-js";

import { Brauhaus } from "./brauhaus/types";
import { RecipeCard } from "./RecipeCard";
import { load } from "./crush";

export const Home: Component<{
  bh: Brauhaus;
}> = (props) => {
  const recipes = [
    "47jG5Q9ZbJBfWsSg5Cj0gp2JOSCzOAeofgUbCxvEzctZmeTAx2ACGcxgZwiwKbOAwjEBQh1gFBGAniALP3e1hSmAC7HmFsjjA2bgJMT4H-NhGwH0Ay8B",
    "49jB41qRmAvqI4EkGJYaSL7g5WBGUbSCW4IfyV9Lu9n8YB4HligC2rqc8GgokEHiNCCxGYK4YRUXMJIZD9sIoJ91CQA",
    "49jJ5wY0NATURAYfvs7jFOkPOuwcdHKTwTIHyRccXBwwLS94GPmQA2MJO4cn9NQ_Ve61jFcYYeEBzPgC3HlsIaDTH0sK-Iy4EMlvsZEQRggXM3jIYjSaIcMekKZz0-E9GvzQ_f-w05i_7OGAHWXLz8zBw2wCAA",
    "42IQhbTgIGMWkPQLlBUOTwQd9AQeeXJx1gGd42QkzB0ouLQzixMSEMDgf9rDyAjRoQHyiubbTkaoJDDOVgjxOEJLWaRQWtTDYY2cXj7oahvxIod28QNGXXZIwio-rMvEBjl5msGDH9YKSwGmD6AXFomyh_IBAA",
  ];

  return (
    <article style="padding: 12px">
      <h1 style="text-align: center; font-size: 1000%; margin: 12px; margin-bottom: -28px;">
        Malt<span class="slightly-muted">.io</span>
      </h1>
      <div style="text-align: center; font-size: 240%; margin-bottom: 32px;">
        Recipe Design & Sharing
      </div>
      <div class="recipe-cards">
        <For each={recipes}>
          {(recipe) => <RecipeCard bh={props.bh} recipe={load(recipe)} />}
        </For>
      </div>
    </article>
  );
};
