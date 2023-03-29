import { Brauhaus, Recipe } from "./brauhaus/types";
import { Component, createEffect, createResource } from "solid-js";
import {
  calculateColor,
  calculateFermentables,
  calculateHops,
  ebcToCss,
  litersToGallons,
} from "./brauhaus/calculate";

import { A } from "@solidjs/router";
import bjcp2021 from "./assets/bjcp2021.json?url";
import { crush } from "./crush";
import tulip from "./assets/tulip.svg";

type StyleCategory = {
  title: string;
  styles: Array<Style>;
};

type Style = {
  title: string;
  stats?: {
    OG: [number, number];
    FG: [number, number];
    IBUs: [number, number];
    ABV: [number, number];
    SRM: [number, number];
  };
};

export const RecipeCard: Component<{
  bh: Brauhaus;
  recipe: Recipe;
}> = (props) => {
  let stats = calculateFermentables(props.bh, props.recipe);
  let ebc = calculateColor(props.recipe);
  let hops = calculateHops(props.bh, props.recipe);
  let crushed = crush(props.recipe);

  createEffect(() => {
    stats = calculateFermentables(props.bh, props.recipe);
    ebc = calculateColor(props.recipe);
    hops = calculateHops(props.bh, props.recipe);
    crushed = crush(props.recipe);
  });

  const [styles] = createResource(bjcp2021, async (url: string) => {
    const json = (await (await fetch(url)).json()) as StyleCategory[];
    json.unshift({ title: "None", styles: [{ title: "No style" }] });
    return json;
  });

  const findStyle = (i: number): string => {
    let pos = 0;
    for (let category of styles() || []) {
      for (let style of category.styles) {
        if (i == pos) {
          return style.title;
        }
        pos++;
      }
    }
    return "No style";
  };

  return (
    <div class="recipe-card">
      <div class="row">
        <div>
          <svg
            class="glass"
            width="160px"
            height="160px"
            style={
              "margin: 0 -24px 0 -38px; --color-beer: " + ebcToCss(ebc) + ";"
            }
          >
            <use href={tulip + "#img"} />
          </svg>
        </div>
        <div class="col gap grow">
          <h2>
            <A href={"/r/" + crushed}>{props.recipe.name}</A>
          </h2>
          <div>{props.recipe.description || "No description"}</div>
          <div>{findStyle(props.recipe.style)}</div>
          <div class="row gap">
            <div class="col">
              <strong>AMT</strong>
              {props.bh.units.volume === "liters"
                ? props.recipe.batchSize + "L"
                : Math.round(litersToGallons(props.recipe.batchSize) * 2) / 2 +
                  "G"}
            </div>
            <div class="col">
              <strong>OG</strong>
              {stats.og.toFixed(3)}
            </div>
            <div class="col">
              <strong>FG</strong> {stats.fg.toFixed(3)}
            </div>
            <div class="col">
              <strong>ABV</strong> {stats.abv.toFixed(1)}%
            </div>
            <div class="col">
              <strong>IBU</strong> {Math.round(hops.ibu)}
            </div>
          </div>
          <div class="row gap right">
            <a class="btn" href={"/r/" + crushed + ".json"}>
              JSON
            </a>
            <a class="btn" href={"/r/" + crushed + ".xml"}>
              XML
            </a>
            <A class="btn primary" href={"/r/" + crushed}>
              View
            </A>
          </div>
        </div>
      </div>
    </div>
  );
};
