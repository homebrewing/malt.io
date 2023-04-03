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
import { glasses } from "./glasses";

const styleNames = [
  "No style",
  "1A. American Light Lager",
  "1B. American Lager",
  "1C. Cream Ale",
  "1D. American Wheat Beer",
  "2A. International Pale Lager",
  "2B. International Amber Lager",
  "2C. International Dark Lager",
  "3A. Czech Pale Lager",
  "3B. Czech Premium Pale Lager",
  "3C. Czech Amber Lager",
  "3D. Czech Dark Lager",
  "4A. Munich Helles",
  "4B. Festbier",
  "4C. Helles Bock",
  "5A. German Leichtbier",
  "5B. Kölsch",
  "5C. German Helles Exportbier",
  "5D. German Pils",
  "6A. Märzen",
  "6B. Rauchbier",
  "6C. Dunkles Bock",
  "7A. Vienna Lager",
  "7B. Altbier",
  "8A. Munich Dunkel",
  "8B. Schwarzbier",
  "9A. Doppelbock",
  "9B. Eisbock",
  "9C. Baltic Porter",
  "10A. Weissbier",
  "10B. Dunkles Weissbier",
  "10C. Weizenbock",
  "11A. Ordinary Bitter",
  "11B. Best Bitter",
  "11C. Strong Bitter",
  "12A. British Golden Ale",
  "12B. Australian Sparkling Ale",
  "12C. English IPA",
  "13A. Dark Mild",
  "13B. British Brown Ale",
  "13C. English Porter",
  "14A. Scottish Light",
  "14B. Scottish Heavy",
  "14C. Scottish Export",
  "15A. Irish Red Ale",
  "15B. Irish Stout",
  "15C. Irish Extra Stout",
  "16A. Sweet Stout",
  "16B. Oatmeal Stout",
  "16C. Tropical Stout",
  "16D. Foreign Extra Stout",
  "17A. British Strong Ale",
  "17B. Old Ale",
  "17C. Wee Heavy",
  "17D. English Barley Wine",
  "18A. Blonde Ale",
  "18B. American Pale Ale",
  "19A. American Amber Ale",
  "19B. California Common",
  "19C. American Brown Ale",
  "20A. American Porter",
  "20B. American Stout",
  "20C. Imperial Stout",
  "21A. American IPA",
  "Specialty IPA: Belgian IPA",
  "Specialty IPA: Black IPA",
  "Specialty IPA: Brown IPA",
  "Specialty IPA: Red IPA",
  "Specialty IPA: Rye IPA",
  "Specialty IPA: White IPA",
  "Specialty IPA: Brut IPA",
  "21C. Hazy IPA",
  "22A. Double IPA",
  "22B. American Strong Ale",
  "22C. American Barleywine",
  "22D. Wheatwine",
  "23A. Berliner Weisse",
  "23B. Flanders Red Ale",
  "23C. Oud Bruin",
  "23D. Lambic",
  "23E. Gueuze",
  "23F. Fruit Lambic",
  "23G. Gose",
  "24A. Witbier",
  "24B. Belgian Pale Ale",
  "24C. Bière de Garde",
  "25A. Belgian Blond Ale",
  "25B. Saison",
  "25C. Belgian Golden Strong Ale",
  "26A. Belgian Single",
  "26B. Belgian Dubbel",
  "26C. Belgian Tripel",
  "26D. Belgian Dark Strong Ale",
  "Historical Beer: Kellerbier",
  "Historical Beer: Kentucky Common",
  "Historical Beer: Lichtenhainer",
  "Historical Beer: London Brown Ale",
  "Historical Beer: Piwo Grodziskie",
  "Historical Beer: Pre-Prohibition Lager",
  "Historical Beer: Pre-Prohibition Porter",
  "Historical Beer: Roggenbier",
  "Historical Beer: Sahti",
  "28A. Brett Beer",
  "28B. Mixed-Fermentation Sour Beer",
  "28C. Wild Specialty Beer",
  "28D. Straight Sour Beer",
  "29A. Fruit Beer",
  "29B. Fruit and Spice Beer",
  "29C. Specialty Fruit Beer",
  "29D. Grape Ale",
  "30A. Spice, Herb, or Vegetable Beer",
  "30B. Autumn Seasonal Beer",
  "30C. Winter Seasonal Beer",
  "30D. Specialty Spice Beer",
  "31A. Alternative Grain Beer",
  "31B. Alternative Sugar Beer",
  "32A. Classic Style Smoked Beer",
  "32B. Specialty Smoked Beer",
  "33A. Wood-Aged Beer",
  "33B. Specialty Wood-Aged Beer",
  "34A. Commercial Specialty Beer",
  "34B. Mixed-Style Beer",
  "34C. Experimental Beer",
];

export const RecipeCard: Component<{
  bh: Brauhaus;
  recipe: Recipe;
  crushed: string;
}> = (props) => {
  let stats = calculateFermentables(props.bh, props.recipe);
  let ebc = calculateColor(props.recipe);
  let hops = calculateHops(props.bh, props.recipe);

  createEffect(() => {
    stats = calculateFermentables(props.bh, props.recipe);
    ebc = calculateColor(props.recipe);
    hops = calculateHops(props.bh, props.recipe);
  });

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
            <use href={glasses[props.recipe.glass] + "#img"} />
          </svg>
        </div>
        <div class="col gap grow">
          <h2>
            <A href={"/r/" + props.crushed}>{props.recipe.name}</A>
          </h2>
          <div>{props.recipe.description || "No description"}</div>
          <div>{styleNames[props.recipe.style]}</div>
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
            <a class="btn" href={"/r/" + props.crushed + ".json"}>
              JSON
            </a>
            <a class="btn" href={"/r/" + props.crushed + ".xml"}>
              XML
            </a>
            <A class="btn primary" href={"/r/" + props.crushed}>
              View
            </A>
          </div>
        </div>
      </div>
    </div>
  );
};
