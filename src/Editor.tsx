import {
  For,
  Show,
  createEffect,
  createMemo,
  createResource,
  createSignal,
  on,
  onCleanup,
} from "solid-js";
import { Outlet, useNavigate, useParams } from "@solidjs/router";
import {
  calculateColor,
  calculateFermentables,
  calculateHops,
  ebcToCss,
  ebcToRgb,
  ebcToSrm,
  lovibondToSrm,
  ppgToYield,
  sgToPlato,
  srmToEbc,
} from "./brauhaus/calculate";
import {
  createBrauhaus,
  createFermentable,
  createHop,
  createMashStep,
  createMisc,
  createRecipe,
  createYeast,
} from "./brauhaus/partials";
import { crush, load } from "./crush";

import type { Component } from "solid-js";
import { Editable } from "./Editable";
import { StylePicker } from "./StylePicker";
import { StyleValue } from "./StyleValue";
import bjcp2021 from "./assets/bjcp2021.json?url";
import { createStore } from "solid-js/store";
import createURLStore from "./urlstore";
import { debounce } from "@solid-primitives/scheduled";
import { removeIndex } from "./utils";
import tulip from "./assets/tulip.svg";

type StyleCategory = {
  title: string;
  styles: Array<Style>;
};

type Style = {
  title: string;
  stats: {
    OG: [number, number];
    FG: [number, number];
    IBUs: [number, number];
    ABV: [number, number];
    SRM: [number, number];
  };
};

const EMPTY_STYLE: Style = {
  title: "None",
  stats: {
    OG: [1, 1.12],
    FG: [0.992, 1.035],
    IBUs: [0, 120],
    ABV: [2, 15],
    SRM: [0, 50],
  },
};

function contrast([r, b, g]: [number, number, number]): string {
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000" : "#fff";
}

async function fetchJSON(url: string) {
  return (await fetch(url)).json();
}

const Editor: Component = () => {
  const params = useParams();
  const navigate = useNavigate();

  const [styles] = createResource(bjcp2021, async (url: string) => {
    const json = (await (await fetch(url)).json()) as StyleCategory[];
    json.unshift({ title: "None", styles: [EMPTY_STYLE] });
    return json;
  });

  const [selectedStyle, setSelectedStyle] = createSignal(EMPTY_STYLE);

  const lookup: { [key: number]: any } = {};

  createEffect(() => {
    const s = styles();
    if (s) {
      let i = 0;
      s.forEach((category) => {
        category.styles.forEach((style) => {
          lookup[i] = style;
          if (i == recipe.style) {
            setSelectedStyle(style);
          }
          i++;
        });
      });
    }
  });

  const [edit, setEdit] = createSignal(true);

  createEffect(
    on(
      edit,
      () => {
        console.log(`Edit mode: ${edit()}`);
      },
      { defer: true }
    )
  );

  // TODO: Load from local storage
  const [bh, setBh] = createStore(createBrauhaus({}));

  const [recipe, setRecipeNow] = createURLStore(
    "/r/",
    "encoded",
    () =>
      createRecipe({
        name: "My Beer",
        fermentables: [
          createFermentable({
            name: "Pale Ale Malt",
            grams: 4000,
            percentYield: Math.round(ppgToYield(37)),
            ebc: Math.round(srmToEbc(lovibondToSrm(1.8))),
          }),
          createFermentable({
            name: "Munich Malt",
            grams: 1000,
            percentYield: Math.round(ppgToYield(37)),
            ebc: Math.round(srmToEbc(lovibondToSrm(6))),
          }),
        ],
        hops: [
          createHop({ name: "Hallertau", grams: 28, aa: 4.5, time: 60 }),
          createHop({ name: "Hallertau", grams: 28, aa: 4.5, time: 10 }),
        ],
        yeasts: [createYeast({ name: "Safale S-33", attenuation: 72 })],
        mashSteps: [
          createMashStep({
            name: "Saccharification",
            temperature: 68,
            duration: 60,
          }),
        ],
      }),
    load,
    crush
  );

  // Put a small delay between updates to avoid thrashing and enable typing
  // or holding down numberical input adjustment buttons.
  const setRecipe = debounce(setRecipeNow as any, 200);

  const ebc = createMemo(() => {
    console.log("Calculating color...");
    const ebc = calculateColor(recipe);
    document.documentElement.style.setProperty("--color-beer", ebcToCss(ebc));
    return ebc;
  });

  const stats = createMemo(() => {
    console.log("Calculating stats...");
    return calculateFermentables(bh, recipe);
  });

  const hopStats = createMemo(() => {
    console.log("Calculating hops...");
    return calculateHops(bh, recipe);
  });

  // Set up a random bubble animation
  const animateBubble = () => {
    document.getElementById("bubble")?.classList.toggle("animated", true);
    bubbleTimeout = setTimeout(animateBubble, Math.random() * 25000 + 5000);
  };
  let bubbleTimeout = setTimeout(animateBubble, 5000);
  onCleanup(() => {
    console.log("cleaning up timeout");
    clearTimeout(bubbleTimeout);
  });

  const addFermentable = () => {
    setRecipeNow("fermentables", [
      ...recipe.fermentables,
      createFermentable({ name: "New Fermentable" }),
    ]);
  };

  const addHop = () => {
    setRecipeNow("hops", [...recipe.hops, createHop({ name: "New Hop" })]);
  };

  const addMisc = () => {
    setRecipeNow("miscs", [...recipe.miscs, createMisc({ name: "New Misc" })]);
  };

  const addYeast = () => {
    setRecipeNow("yeasts", [
      ...recipe.yeasts,
      createYeast({ name: "New Yeast" }),
    ]);
  };

  const addMashStep = () => {
    setRecipeNow("mashSteps", [
      ...recipe.mashSteps,
      createMashStep({ name: "New Mash Step" }),
    ]);
  };

  const addFermentationStep = () => {
    setRecipeNow("fermentationSteps", [
      ...recipe.fermentationSteps,
      { type: "primary", temperature: 20, duration: 7 },
    ]);
  };

  return (
    <article class="col gap">
      <header>
        <div class="glass-container col gap">
          <div
            id="bubble"
            onanimationend={(e) => e.currentTarget.classList.remove("animated")}
          ></div>
          <svg
            class="glass"
            width="160px"
            height="160px"
            style="margin: 0 -26px"
          >
            <use href={tulip + "#img"} />
          </svg>
        </div>
        <div class="recipe-info col gap">
          <div class="col">
            <label>Recipe Name</label>
            <Editable
              class="germania large"
              show={edit()}
              type="text"
              value={recipe.name}
              placeholder="Untitled Brew"
              oninput={(e) => setRecipe("name", e.currentTarget.value)}
            />
          </div>
          <div class="col">
            <label>Description &amp; Notes</label>
            <Editable
              show={edit()}
              type="text"
              value={recipe.description}
              placeholder="No description"
              oninput={(e) => setRecipe("description", e.currentTarget.value)}
            />
          </div>
          <div class="recipe-settings row gap">
            <div class="col">
              <label>&nbsp;</label>
              <div class="row">
                <input
                  id="edit"
                  type="checkbox"
                  checked={edit()}
                  onInput={() => setEdit(!edit())}
                  hidden
                />
                <label
                  class="btn"
                  classList={{
                    secondary: !edit(),
                    primary: edit(),
                  }}
                  for="edit"
                  style="padding: 6px 6px; margin: 0"
                >
                  <Show when={edit()} fallback="🗂 Edit">
                    💾 Save
                  </Show>
                </label>
              </div>
            </div>
            <div class="col">
              <label>&nbsp;</label>
              <button
                class="share"
                onclick={(e) => {
                  const share = {
                    title: recipe.name,
                    text: recipe.description,
                    url: window.location.href,
                  };
                  if (navigator.canShare && navigator.canShare(share)) {
                    navigator.share(share);
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    e.currentTarget.classList.add("active");
                  }
                }}
                onanimationend={(e) =>
                  e.currentTarget.classList.remove("active")
                }
              >
                <span class="msg">&check; Copied</span>
                <span class="icon">💬</span> Share
              </button>
            </div>
            <div class="col">
              <label>Type</label>
              <select
                value={recipe.type}
                oninput={(e) => setRecipe("type", e.currentTarget.value)}
              >
                <option>all grain</option>
                <option>partial mash</option>
                <option>extract</option>
              </select>
            </div>
            <div class="batch col right">
              <label>Batch</label>
              <Editable
                show={edit()}
                type="number"
                suffix="L"
                value={recipe.batchSize}
                oninput={(e) =>
                  setRecipe("batchSize", parseInt(e.currentTarget.value || "0"))
                }
              />
            </div>
            <div class="boil col right">
              <label>Boil</label>
              <Editable
                show={edit()}
                type="number"
                suffix="L"
                value={recipe.boilSize}
                oninput={(e) =>
                  setRecipe("boilSize", parseInt(e.currentTarget.value || "0"))
                }
              />
            </div>
          </div>
        </div>
        <div class="style col gap-small grow">
          <StyleValue
            label="ABV"
            suffix="%"
            min={selectedStyle().stats.ABV[0]}
            max={selectedStyle().stats.ABV[1]}
            value={stats().abv}
            precision={1}
          />
          <StyleValue
            label="OG"
            min={selectedStyle().stats.OG[0]}
            max={selectedStyle().stats.OG[1]}
            value={stats().og}
            precision={3}
            altFunc={(v) => sgToPlato(v).toFixed(1)}
            altSuffix="°P"
          />
          <StyleValue
            label="FG"
            min={selectedStyle().stats.FG[0]}
            max={selectedStyle().stats.FG[1]}
            value={stats().fg}
            precision={3}
            altFunc={(v) => sgToPlato(v).toFixed(1)}
            altSuffix="°P"
          />
          <StyleValue
            label="EBC"
            min={srmToEbc(selectedStyle().stats.SRM[0])}
            max={srmToEbc(selectedStyle().stats.SRM[1])}
            value={ebc()}
            precision={0}
            altFunc={(v) => Math.round(ebcToSrm(v))}
            altSuffix="SRM"
          />
          <StyleValue
            label="IBU"
            min={selectedStyle().stats.IBUs[0]}
            max={selectedStyle().stats.IBUs[1]}
            value={hopStats().ibu}
            precision={0}
          />
          <div>Style: {selectedStyle().title.replace(".", "")}</div>
          <Show when={edit()}>
            <button
              class="primary"
              onclick={() => {
                navigate(location.pathname + "/styles", { scroll: false });
              }}
            >
              Change target style
            </button>
          </Show>
        </div>
      </header>

      <div class="ingredients">
        <div>
          <h2>
            🌾 Fermentable Sugars
            <Show when={edit()}>
              <button class="primary" onClick={addFermentable}>
                &plus;
              </button>
            </Show>
          </h2>

          <div class="ingredient fermentable">
            <div class="row header">
              <div class="bill right muted">Bill</div>
              <div class="amount right">Amount</div>
              <div class="name">Name</div>
              <div class="yield right long">Yield</div>
              <div class="ebc right long">&deg;EBC</div>
              <div class="abv right long">ABV</div>
              <Show when={edit()}>
                <div class="delete"></div>
              </Show>
              <div class="break"></div>
            </div>
            <For
              each={recipe.fermentables}
              fallback={<div>No fermentables.</div>}
            >
              {(fermentable, i) => (
                <div class="row">
                  <div class="bill right muted">
                    {Math.round(
                      (fermentable.grams / stats().fermentableGrams) * 100
                    )}
                    ﹪
                  </div>
                  <div class="amount right">
                    <Editable
                      show={edit()}
                      type="number"
                      value={fermentable.grams}
                      suffix="g"
                      oninput={(e) =>
                        setRecipeNow(
                          "fermentables",
                          i(),
                          "grams",
                          parseInt(e.currentTarget.value || "0")
                        )
                      }
                    />
                  </div>
                  <div class="name">
                    <Editable
                      show={edit()}
                      type="text"
                      value={fermentable.name}
                      oninput={(e) =>
                        setRecipe(
                          "fermentables",
                          i(),
                          "name",
                          e.currentTarget.value
                        )
                      }
                    />
                  </div>
                  <div class="yield right break-small">
                    <Editable
                      show={edit()}
                      type="number"
                      value={Math.round(fermentable.percentYield)}
                      prefix="Yield"
                      prefixShort={true}
                      suffix="﹪"
                      oninput={(e) =>
                        setRecipe(
                          "fermentables",
                          i(),
                          "percentYield",
                          parseInt(e.currentTarget.value || "0")
                        )
                      }
                    />
                  </div>
                  <div class="ebc right break-small">
                    <input
                      class="color"
                      type="number"
                      min="0"
                      max="1000"
                      style={{
                        color: contrast(ebcToRgb(fermentable.ebc)),
                        "background-color": ebcToCss(fermentable.ebc),
                        width: "30px",
                      }}
                      value={Math.round(fermentable.ebc)}
                      oninput={(e) =>
                        setRecipe(
                          "fermentables",
                          i(),
                          "ebc",
                          parseInt(e.currentTarget.value || "0")
                        )
                      }
                    />
                    <span class="suffix short">&deg;EBC</span>
                  </div>
                  <div class="abv right break-small">
                    {(
                      stats().abv *
                      (fermentable.grams / stats().fermentableGrams)
                    ).toFixed(1)}
                    <span class="suffix">﹪</span>
                    <span class="suffix short">ABV</span>
                  </div>
                  <Show when={edit()}>
                    <div class="delete">
                      {" "}
                      <button
                        onclick={() =>
                          setRecipeNow(
                            "fermentables",
                            removeIndex(recipe.fermentables, i())
                          )
                        }
                      >
                        ✕
                      </button>
                    </div>
                  </Show>
                  <div class="break"></div>
                </div>
              )}
            </For>
            <Show when={recipe.fermentables.length > 0}>
              <div class="row footer">
                <div class="bill right muted">100﹪</div>
                <div class="amount right">
                  {stats().fermentableGrams}
                  <span class="suffix">g</span>
                </div>
                <div class="name break-small"></div>
                <div class="yield right break-small"></div>
                <div class="ebc right">
                  <span
                    class="color-block"
                    style={{
                      color: contrast(ebcToRgb(ebc())),
                      "background-color": ebcToCss(ebc()),
                    }}
                  >
                    {Math.round(ebc())}
                  </span>
                  <span class="suffix short">&deg;EBC</span>
                </div>
                <div class="abv right">
                  {stats().abv.toFixed(1)}
                  <span class="suffix">﹪</span>
                  <span class="suffix short">ABV</span>
                </div>
                <div class="cal right short">
                  {Math.round(stats().calories)}
                  <span class="suffix">Cal</span> / {recipe.servingSizeMl}
                  <span class="suffix">ml</span>
                </div>
                <Show when={edit()}>
                  <div class="delete break-small"></div>
                </Show>
                <div class="break break-small"></div>
              </div>
            </Show>
          </div>
          <div class="cal right long">
            {Math.round(stats().calories)}
            <span class="suffix">Cal</span> / {recipe.servingSizeMl}
            <span class="suffix">ml</span>
          </div>
        </div>

        <div>
          <h2>
            🥬 Bittering & Aroma Hops
            <Show when={edit()}>
              <button class="primary" onClick={addHop}>
                &plus;
              </button>
            </Show>
          </h2>

          <div class="ingredient hops">
            <div class="row header">
              <div class="bill right muted">Bill</div>
              <div class="time right">Time</div>
              <div class="use">Use</div>
              <div class="weight right long">Wt</div>
              <div class="name">Name</div>
              <div class="form long">Form</div>
              <div class="alpha-acid right long">AA%</div>
              <div class="ibu right long">IBU</div>
              <Show when={edit()}>
                <div class="delete"></div>
              </Show>
              <div class="break"></div>
            </div>
            <For each={recipe.hops} fallback={<div>No hops.</div>}>
              {(hop, i) => (
                <div class="row">
                  <div class="bill right muted">
                    {Math.round((hop.grams / hopStats().grams) * 100)}%
                  </div>
                  <div class="time right">
                    <Editable
                      show={edit()}
                      type="number"
                      suffix={hop.use === "dry hop" ? "d" : "m"}
                      value={hop.time}
                      oninput={(e) =>
                        setRecipe(
                          "hops",
                          i(),
                          "time",
                          parseInt(e.currentTarget.value)
                        )
                      }
                    />
                  </div>
                  <div class="use">
                    <select
                      value={hop.use}
                      oninput={(e) =>
                        setRecipe("hops", i(), "use", e.currentTarget.value)
                      }
                    >
                      <option>mash</option>
                      <option>boil</option>
                      <option>aroma</option>
                      <option>dry hop</option>
                    </select>
                  </div>
                  <div class="weight right break-small">
                    <Editable
                      show={edit()}
                      type="number"
                      suffix="g"
                      value={hop.grams}
                      oninput={(e) =>
                        setRecipe(
                          "hops",
                          i(),
                          "grams",
                          parseInt(e.currentTarget.value)
                        )
                      }
                    />
                  </div>
                  <div class="name">
                    <Editable
                      show={edit()}
                      type="text"
                      value={hop.name}
                      oninput={(e) =>
                        setRecipe("hops", i(), "name", e.currentTarget.value)
                      }
                    />
                  </div>
                  <div class="form break-small">
                    <select
                      value={hop.form}
                      oninput={(e) =>
                        setRecipe("hops", i(), "form", e.currentTarget.value)
                      }
                    >
                      <option>pellet</option>
                      <option>leaf</option>
                      <option>plug</option>
                    </select>
                  </div>
                  <div class="alpha-acid right break-small">
                    <Editable
                      show={edit()}
                      type="number"
                      prefix="AA"
                      prefixShort={true}
                      suffix="%"
                      value={hop.aa}
                      oninput={(e) =>
                        setRecipe(
                          "hops",
                          i(),
                          "aa",
                          parseFloat(e.currentTarget.value)
                        )
                      }
                    />
                  </div>
                  <div class="ibu right break-small">
                    {hopStats().ibuMap[i()]?.toFixed(1) ?? "-"}
                    <span class="suffix short"> IBU</span>
                  </div>
                  <Show when={edit()}>
                    <div class="delete">
                      <button
                        onclick={() =>
                          setRecipeNow("hops", removeIndex(recipe.hops, i()))
                        }
                      >
                        ✕
                      </button>
                    </div>
                  </Show>
                  <div class="break"></div>
                </div>
              )}
            </For>
            <Show when={recipe.fermentables.length > 0}>
              <div class="row footer">
                <div class="bill right muted">100%</div>
                <div class="time right break-small"></div>
                <div class="use break-small"></div>
                <div class="weight right">
                  <span class="value">
                    {hopStats().grams}
                    <span class="suffix">g</span>
                  </span>
                </div>
                <div class="name break-small"></div>
                <div class="form"></div>
                <div class="alpha-acid right"></div>
                <div class="ibu right">
                  {hopStats().ibu.toFixed(1)}
                  <span class="suffix short"> IBU</span>
                </div>
                <Show when={edit()}>
                  <div class="delete break-small"></div>
                </Show>
                <div class="break"></div>
              </div>
            </Show>
          </div>
        </div>

        <div>
          <h2>
            🍱 Miscellaneous
            <Show when={edit()}>
              <button class="primary" onClick={addMisc}>
                &plus;
              </button>
            </Show>
          </h2>

          <div class="ingredient miscs">
            <div class="row header">
              <div class="time right long break-small">Time</div>
              <div class="use long break-small">Use</div>
              <div class="amount right long break-small">Amt</div>
              <div class="units long break-small">Units</div>
              <div class="name">Name</div>
              <Show when={edit()}>
                <div class="delete"></div>
              </Show>
              <div class="break"></div>
            </div>
            <For
              each={recipe.miscs}
              fallback={<div>No spices, herbs, etc.</div>}
            >
              {(misc, i) => (
                <div class="row">
                  <div class="time right break-small">
                    <Editable
                      show={edit()}
                      type="number"
                      suffix={
                        misc.use === "mash" || misc.use === "boil" ? "m" : "d"
                      }
                      value={misc.time}
                      oninput={(e) =>
                        setRecipe(
                          "miscs",
                          i(),
                          "time",
                          parseInt(e.currentTarget.value)
                        )
                      }
                    />
                  </div>
                  <div class="use break-small">
                    <select
                      value={misc.use}
                      oninput={(e) => {
                        setRecipe("miscs", i(), "use", e.currentTarget.value);
                      }}
                    >
                      <option>mash</option>
                      <option>sparge</option>
                      <option>boil</option>
                      <option>primary</option>
                      <option>secondary</option>
                      <option>bottling</option>
                    </select>
                  </div>
                  <div class="amount right break-small">
                    <Editable
                      show={edit()}
                      type="number"
                      value={misc.amount}
                      oninput={(e) =>
                        setRecipe(
                          "miscs",
                          i(),
                          "amount",
                          parseInt(e.currentTarget.value)
                        )
                      }
                    />
                  </div>
                  <div class="units break-small">
                    <select
                      value={misc.units}
                      oninput={(e) => {
                        setRecipe("miscs", i(), "units", e.currentTarget.value);
                      }}
                    >
                      <option>g</option>
                      <option>ml</option>
                      <option>each</option>
                      <option>tsp</option>
                      <option>tbsp</option>
                      <option>mg/l</option>
                    </select>
                  </div>
                  <div class="name">
                    <Editable
                      show={edit()}
                      type="text"
                      value={misc.name}
                      oninput={(e) =>
                        setRecipe("miscs", i(), "name", e.currentTarget.value)
                      }
                    />
                  </div>
                  <Show when={edit()}>
                    <div class="delete">
                      {" "}
                      <button
                        onclick={() =>
                          setRecipeNow("miscs", removeIndex(recipe.miscs, i()))
                        }
                      >
                        ✕
                      </button>
                    </div>
                  </Show>
                  <div class="break"></div>
                </div>
              )}
            </For>
          </div>
        </div>

        <div>
          <h2>
            <span>
              <span style="filter: hue-rotate(285deg) saturate(0.4) brightness(1.1);">
                🦠
              </span>{" "}
              Yeast & Bugs
            </span>
            <Show when={edit()}>
              <button class="primary" onClick={addYeast}>
                &plus;
              </button>
            </Show>
          </h2>

          <div class="ingredient yeasts">
            <div class="row header">
              <div class="amount right">Amt</div>
              <div class="units">Units</div>
              <div class="name">Name</div>
              <div class="type long">Type</div>
              <div class="form long">Form</div>
              <div class="attenuation long">Attenuation</div>
              <Show when={edit()}>
                <div class="delete"></div>
              </Show>
              <div class="break"></div>
            </div>
            <For
              each={recipe.yeasts}
              fallback={<div>No yeasts or bugs defined.</div>}
            >
              {(yeast, i) => (
                <div class="row">
                  <div class="amount right">
                    <Editable
                      show={edit()}
                      type="number"
                      value={yeast.amount}
                      oninput={(e) =>
                        setRecipe(
                          "yeasts",
                          i(),
                          "amount",
                          parseInt(e.currentTarget.value)
                        )
                      }
                    />
                  </div>
                  <div class="units">
                    <select
                      value={yeast.units}
                      oninput={(e) =>
                        setRecipe("yeasts", i(), "units", e.currentTarget.value)
                      }
                    >
                      <option>g</option>
                      <option>ml</option>
                      <option>pkt</option>
                    </select>
                  </div>
                  <div class="name">
                    <Editable
                      show={edit()}
                      type="text"
                      value={yeast.name}
                      oninput={(e) =>
                        setRecipe("yeasts", i(), "name", e.currentTarget.value)
                      }
                    />
                  </div>
                  <div class="type break-small">
                    {" "}
                    <select
                      value={yeast.type}
                      oninput={(e) =>
                        setRecipe("yeasts", i(), "type", e.currentTarget.value)
                      }
                    >
                      <option>ale</option>
                      <option>lager</option>
                      <option>cider</option>
                      <option>wine</option>
                      <option>other</option>
                    </select>
                  </div>
                  <div class="form break-small">
                    <select
                      value={yeast.form}
                      oninput={(e) =>
                        setRecipe("yeasts", i(), "form", e.currentTarget.value)
                      }
                    >
                      <option>liquid</option>
                      <option>dry</option>
                    </select>
                  </div>
                  <div class="attenuation break-small">
                    <Editable
                      show={edit()}
                      type="number"
                      prefix="Attenuation"
                      prefixShort={true}
                      suffix="%"
                      value={yeast.attenuation}
                      oninput={(e) =>
                        setRecipe(
                          "yeasts",
                          i(),
                          "attenuation",
                          parseInt(e.currentTarget.value)
                        )
                      }
                    />
                  </div>
                  <Show when={edit()}>
                    <div class="delete">
                      <button
                        onclick={() =>
                          setRecipeNow(
                            "yeasts",
                            removeIndex(recipe.yeasts, i())
                          )
                        }
                      >
                        ✕
                      </button>
                    </div>
                  </Show>
                  <div class="break"></div>
                </div>
              )}
            </For>
          </div>
        </div>

        <Show when={recipe.type != "extract"}>
          <div>
            <h2>
              🌡 Mash Schedule
              <Show when={edit()}>
                <button class="primary" onclick={addMashStep}>
                  &plus;
                </button>
              </Show>
            </h2>

            <div class="ingredient mash">
              <div class="row header">
                <div class="name">Name</div>
                <div class="temp long">Temp</div>
                <div class="time right long">Time</div>
                <div class="ratio right long">Ratio</div>
                <Show when={edit()}>
                  <div class="delete"></div>
                </Show>
                <div class="break"></div>
              </div>
              <For each={recipe.mashSteps} fallback={<div>No mash steps.</div>}>
                {(step, i) => (
                  <div class="row">
                    <div class="name">
                      <Editable
                        show={edit()}
                        type="text"
                        value={step.name}
                        oninput={(e) =>
                          setRecipe(
                            "mashSteps",
                            i(),
                            "name",
                            e.currentTarget.value
                          )
                        }
                      />
                    </div>
                    <div class="temp break-small">
                      <Editable
                        show={edit()}
                        type="number"
                        suffix="°C"
                        value={step.temperature}
                        oninput={(e) =>
                          setRecipe(
                            "mashSteps",
                            i(),
                            "temperature",
                            parseInt(e.currentTarget.value)
                          )
                        }
                      />
                    </div>
                    <div class="time break-small">
                      <Editable
                        show={edit()}
                        type="number"
                        suffix="m"
                        value={step.duration}
                        oninput={(e) =>
                          setRecipe(
                            "mashSteps",
                            i(),
                            "duration",
                            parseInt(e.currentTarget.value)
                          )
                        }
                      />
                    </div>
                    <div class="ratio break-small">
                      <Editable
                        show={edit()}
                        type="number"
                        value={step.waterGrainRatio}
                        suffix="L/kg"
                        oninput={(e) =>
                          setRecipe(
                            "mashSteps",
                            i(),
                            "waterGrainRatio",
                            parseFloat(e.currentTarget.value)
                          )
                        }
                      />
                    </div>
                    <Show when={edit()}>
                      <div class="delete">
                        <button
                          onclick={() =>
                            setRecipeNow(
                              "mashSteps",
                              removeIndex(recipe.mashSteps, i())
                            )
                          }
                        >
                          ✕
                        </button>
                      </div>
                    </Show>
                    <div class="break"></div>
                  </div>
                )}
              </For>
            </div>
          </div>

          <div>
            <h2>💧 Target Water Profile</h2>

            <div class="ingredient water">
              <div class="row header">
                <div class="ca right">
                  Ca<sup>2+</sup>
                </div>
                <div class="mg right">
                  Mg<sup>2+</sup>
                </div>
                <div class="na right">
                  Na<sup>+</sup>
                </div>
                <div class="cl right">
                  Cl<sup>-</sup>
                </div>
                <div class="so4 right">
                  SO<sub>4</sub>
                  <sup>2-</sup>
                </div>
                <div class="hco3 right">
                  HCO<sub>3</sub>
                  <sup>-</sup>
                </div>
              </div>
              <div class="row">
                <div class="ca right">
                  <Editable
                    show={edit()}
                    type="number"
                    value={recipe.water.ca}
                    placeholder="0"
                    oninput={(e) =>
                      setRecipe("water", "ca", parseInt(e.currentTarget.value))
                    }
                  />
                </div>
                <div class="mg right">
                  <Editable
                    show={edit()}
                    type="number"
                    value={recipe.water.mg}
                    placeholder="0"
                    oninput={(e) =>
                      setRecipe("water", "mg", parseInt(e.currentTarget.value))
                    }
                  />
                </div>
                <div class="na right">
                  <Editable
                    show={edit()}
                    type="number"
                    value={recipe.water.na}
                    placeholder="0"
                    oninput={(e) =>
                      setRecipe("water", "na", parseInt(e.currentTarget.value))
                    }
                  />
                </div>
                <div class="cl right">
                  <Editable
                    show={edit()}
                    type="number"
                    value={recipe.water.cl}
                    placeholder="0"
                    oninput={(e) =>
                      setRecipe("water", "cl", parseInt(e.currentTarget.value))
                    }
                  />
                </div>
                <div class="so4 right">
                  <Editable
                    show={edit()}
                    type="number"
                    value={recipe.water.so4}
                    placeholder="0"
                    oninput={(e) =>
                      setRecipe("water", "so4", parseInt(e.currentTarget.value))
                    }
                  />
                </div>
                <div class="hco3 right">
                  <Editable
                    show={edit()}
                    type="number"
                    value={recipe.water.hco3}
                    placeholder="0"
                    oninput={(e) =>
                      setRecipe(
                        "water",
                        "hco3",
                        parseInt(e.currentTarget.value)
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </Show>

        <div>
          <h2>
            🫧 Fermentation Schedule
            <Show when={edit()}>
              <button class="primary" onclick={addFermentationStep}>
                &plus;
              </button>
            </Show>
          </h2>

          <div class="ingredient fermentation">
            <div class="row header">
              <div class="type grow">Type</div>
              <div class="time right grow">Time</div>
              <div class="temp right grow">Temp</div>
              <Show when={edit()}>
                <div class="delete"></div>
              </Show>
              <div class="break"></div>
            </div>
            <For
              each={recipe.fermentationSteps}
              fallback={<div>No fermentation steps.</div>}
            >
              {(step, i) => (
                <div class="row">
                  <div class="type grow">
                    <select
                      value={step.type}
                      oninput={(e) =>
                        setRecipe(
                          "fermentationSteps",
                          i(),
                          "type",
                          e.currentTarget.value
                        )
                      }
                    >
                      <option>primary</option>
                      <option>secondary</option>
                      <option>tertiary</option>
                      <option>aging</option>
                    </select>
                  </div>
                  <div class="time right grow">
                    <Editable
                      show={edit()}
                      type="number"
                      suffix="d"
                      value={step.duration}
                      oninput={(e) =>
                        setRecipe(
                          "fermentationSteps",
                          i(),
                          "duration",
                          parseInt(e.currentTarget.value)
                        )
                      }
                    />
                  </div>
                  <div class="temp right grow">
                    <Editable
                      show={edit()}
                      type="number"
                      suffix="°C"
                      value={step.temperature}
                      oninput={(e) =>
                        setRecipe(
                          "fermentationSteps",
                          i(),
                          "temperature",
                          parseInt(e.currentTarget.value)
                        )
                      }
                    />
                  </div>
                  <Show when={edit()}>
                    <div class="delete">
                      <button
                        onclick={() =>
                          setRecipeNow(
                            "fermentationSteps",
                            removeIndex(recipe.fermentationSteps, i())
                          )
                        }
                      >
                        ✕
                      </button>
                    </div>
                  </Show>
                </div>
              )}
            </For>
          </div>
          <div
            class="row grow gap"
            style="align-items: baseline; justify-content: end"
          >
            <span>
              Carbonation CO<sub>2</sub>{" "}
            </span>
            <div style="width: 66px">
              <Editable
                show={edit()}
                type="number"
                suffix="vol"
                value={recipe.carbonation}
                oninput={(e) =>
                  setRecipe("carbonation", parseFloat(e.currentTarget.value))
                }
              />
            </div>
          </div>
        </div>
      </div>
      <Show when={params.dialog == "styles"}>
        <StylePicker
          styles={styles()}
          setStyle={(s: number) => {
            setRecipeNow("style", s);
          }}
        />
      </Show>
    </article>
  );
};

export default Editor;
