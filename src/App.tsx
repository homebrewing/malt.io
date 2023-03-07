import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
} from "solid-js";
import { Inflate, deflateRaw } from "pako";
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
import { createLocalStore, removeIndex } from "./utils";
import { decodeBinary, encodeBinary } from "./binary";

import { Base64 } from "js-base64";
import type { Component } from "solid-js";
import { Editable } from "./Editable";
import { Recipe } from "./brauhaus/types";
import { StyleValue } from "./StyleValue";
import { createStore } from "solid-js/store";
import { debounce } from "@solid-primitives/scheduled";
import { dictionary } from "./dict";
import tulip from "./assets/tulip.svg";

function contrast([r, b, g]: [number, number, number]): string {
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000" : "#fff";
}

function crush(r: Recipe): string {
  let b = encodeBinary(r);
  console.log("binary", Base64.fromUint8Array(new Uint8Array(b), true));
  const defBin = deflateRaw(b, {
    level: 9,
    dictionary,
  });
  const base64 = Base64.fromUint8Array(defBin, true);
  console.log("defbin", base64);

  const start = performance.now();
  const i = new Inflate({ raw: true, dictionary });
  i.push(defBin, true);
  decodeBinary(i.result as Uint8Array);
  console.log("inflate perf", performance.now() - start, "ms");
  console.log(JSON.stringify(decodeBinary(i.result as Uint8Array)));

  return base64;
}

const App: Component = () => {
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

  const [recipe, setRecipeNow] = createLocalStore(
    "recipe",
    createRecipe({
      name: "My Beer",
      fermentables: [
        createFermentable({
          id: 1,
          name: "Pale Ale Malt",
          grams: 4000,
          percentYield: Math.round(ppgToYield(37)),
          ebc: Math.round(srmToEbc(lovibondToSrm(1.8))),
        }),
        createFermentable({
          id: 2,
          name: "Munich Malt",
          grams: 1000,
          percentYield: Math.round(ppgToYield(37)),
          ebc: Math.round(srmToEbc(lovibondToSrm(6))),
        }),
      ],
      hops: [
        createHop({ id: 1, name: "Hallertau", grams: 28, aa: 4.5, time: 60 }),
        createHop({ id: 2, name: "Hallertau", grams: 28, aa: 4.5, time: 10 }),
      ],
      yeasts: [createYeast({ id: 1, name: "Safale S-33", attenuation: 72 })],
      mashSteps: [
        createMashStep({
          id: 1,
          name: "Saccharification",
          temperature: 68,
          duration: 60,
        }),
      ],
    })
  );

  // Put a small delay between updates to avoid thrashing and enable typing
  // or holding down numberical input adjustment buttons.

  const setRecipe = debounce(setRecipeNow as any, 200);

  createEffect(() => {
    console.log("Updating hash...");
    window.location.hash = crush(recipe);
  });

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
    // Find the first unused ID. This is slow to search but results in low ID
    // numbers when things are removed.
    let id = 1;
    while (recipe.fermentables.find((f) => f.id === id)) {
      id++;
    }
    setRecipeNow("fermentables", [
      ...recipe.fermentables,
      createFermentable({ id, name: "New Fermentable" }),
    ]);
  };

  const addHop = () => {
    // Find the first unused ID. This is slow to search but results in low ID
    // numbers when things are removed.
    let id = 1;
    while (recipe.hops.find((h) => h.id === id)) {
      id++;
    }
    setRecipeNow("hops", [...recipe.hops, createHop({ id, name: "New Hop" })]);
  };

  const addMisc = () => {
    // Find the first unused ID. This is slow to search but results in low ID
    // numbers when things are removed.
    let id = 1;
    while (recipe.miscs.find((h) => h.id === id)) {
      id++;
    }
    setRecipeNow("miscs", [
      ...recipe.miscs,
      createMisc({ id, name: "New Misc" }),
    ]);
  };

  const addYeast = () => {
    // Find the first unused ID. This is slow to search but results in low ID
    // numbers when things are removed.
    let id = 1;
    while (recipe.yeasts.find((h) => h.id === id)) {
      id++;
    }
    setRecipeNow("yeasts", [
      ...recipe.yeasts,
      createYeast({ id, name: "New Yeast" }),
    ]);
  };

  return (
    <div class="page">
      <nav>
        <h1>
          Malt<span style="opacity: 0.65">.io</span>
        </h1>
        <div>
          <a href="#">
            <img
              class="icon"
              src="https://icongr.am/feather/file-plus.svg?size=24&color=999999"
            />
            New Recipe
          </a>
          <a href="#">
            <img
              class="icon"
              src="https://icongr.am/feather/package.svg?size=24&color=999999"
            />
            Import
          </a>
          <a href="#">
            <img
              class="icon"
              src="https://icongr.am/feather/arrow-down-circle.svg?size=24&color=999999"
            />
            Export
          </a>
          <a href="#">
            <img
              class="icon"
              src="https://icongr.am/feather/help-circle.svg?size=24&color=999999"
            />
            About
          </a>
        </div>
      </nav>
      <div>
        <div class="row">
          <input
            type="checkbox"
            checked={edit()}
            onInput={() => setEdit(!edit())}
          />
          Edit mode
        </div>
        <article class="col gap">
          <header>
            <div class="glass-container">
              <div
                id="bubble"
                onanimationend={(e) =>
                  e.currentTarget.classList.remove("animated")
                }
              ></div>
              <svg class="glass" width="128px" height="128px">
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
                <label>Description</label>
                <Editable
                  show={edit()}
                  type="text"
                  value={recipe.description}
                  placeholder="No description"
                  oninput={(e) =>
                    setRecipe("description", e.currentTarget.value)
                  }
                />
              </div>
            </div>
            <div class="style col gap-small grow">
              <StyleValue
                label="ABV"
                suffix="%"
                min={2.0}
                max={15.0}
                value={stats().abv}
                precision={1}
              />
              <StyleValue
                label="OG"
                min={1.0}
                max={1.12}
                value={stats().og}
                precision={3}
                altFunc={(v) => sgToPlato(v).toFixed(1)}
                altSuffix="°P"
              />
              <StyleValue
                label="FG"
                min={0.992}
                max={1.035}
                value={stats().fg}
                precision={3}
                altFunc={(v) => sgToPlato(v).toFixed(1)}
                altSuffix="°P"
              />
              <StyleValue
                label="EBC"
                min={1}
                max={100}
                value={ebc()}
                precision={0}
                altFunc={(v) => Math.round(ebcToSrm(v))}
                altSuffix="SRM"
              />
              <StyleValue
                label="IBU"
                min={1}
                max={120}
                value={hopStats().ibu}
                precision={0}
              />
              <div>No BJCP style selected</div>
              <Show when={edit()}>
                <button class="primary">Change target style</button>
              </Show>
            </div>
          </header>
          <div class="recipe-settings row">
            <label>Batch size</label>
            <Editable
              show={edit()}
              type="number"
              suffix="L"
              value={recipe.batchSize}
              oninput={(e) =>
                setRecipe("batchSize", parseInt(e.currentTarget.value || "0"))
              }
            />
            <label>Boil Size</label>
            <Editable
              show={edit()}
              type="number"
              suffix="L"
              value={recipe.boilSize}
              oninput={(e) =>
                setRecipe("boilSize", parseInt(e.currentTarget.value || "0"))
              }
            />
            <label>Efficiency</label>
            <Editable
              show={edit()}
              type="number"
              suffix="﹪"
              value={recipe.efficiency}
              oninput={(e) =>
                setRecipe("efficiency", parseInt(e.currentTarget.value || "0"))
              }
            />
          </div>
          <div class="ingredients">
            <div>
              <h2>
                Fermentable Sugars
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
                <For each={recipe.fermentables}>
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
              </div>
              <div class="cal right long">
                {Math.round(stats().calories)}
                <span class="suffix">Cal</span> / {recipe.servingSizeMl}
                <span class="suffix">ml</span>
              </div>
            </div>

            <div>
              <h2>
                Bittering & Aroma Hops
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
                <For each={recipe.hops}>
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
                            setRecipe(
                              "hops",
                              i(),
                              "name",
                              e.currentTarget.value
                            )
                          }
                        />
                      </div>
                      <div class="form break-small">
                        <select
                          value={hop.form}
                          oninput={(e) =>
                            setRecipe(
                              "hops",
                              i(),
                              "form",
                              e.currentTarget.value
                            )
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
                        {hopStats().ibuMap[hop.id]?.toFixed(1) ?? "-"}
                        <span class="suffix short"> IBU</span>
                      </div>
                      <Show when={edit()}>
                        <div class="delete">
                          <button
                            onclick={() =>
                              setRecipeNow(
                                "hops",
                                removeIndex(recipe.hops, i())
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
              </div>
            </div>

            <div>
              <h2>
                Miscellaneous
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
                <For each={recipe.miscs}>
                  {(misc, i) => (
                    <div class="row">
                      <div class="time right break-small">
                        <Editable
                          show={edit()}
                          type="number"
                          suffix={
                            misc.use === "mash" || misc.use === "boil"
                              ? "m"
                              : "d"
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
                            setRecipe(
                              "miscs",
                              i(),
                              "use",
                              e.currentTarget.value
                            );
                          }}
                        >
                          <option>mash</option>
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
                            setRecipe(
                              "miscs",
                              i(),
                              "units",
                              e.currentTarget.value
                            );
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
                            setRecipe(
                              "miscs",
                              i(),
                              "name",
                              e.currentTarget.value
                            )
                          }
                        />
                      </div>
                      <Show when={edit()}>
                        <div class="delete">
                          {" "}
                          <button
                            onclick={() =>
                              setRecipeNow(
                                "miscs",
                                removeIndex(recipe.miscs, i())
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
              <h2>
                Yeast & Bugs
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
                <For each={recipe.yeasts}>
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
                            setRecipe(
                              "yeasts",
                              i(),
                              "units",
                              e.currentTarget.value
                            )
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
                            setRecipe(
                              "yeasts",
                              i(),
                              "name",
                              e.currentTarget.value
                            )
                          }
                        />
                      </div>
                      <div class="type break-small">
                        {" "}
                        <select
                          value={yeast.type}
                          oninput={(e) =>
                            setRecipe(
                              "yeasts",
                              i(),
                              "type",
                              e.currentTarget.value
                            )
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
                            setRecipe(
                              "yeasts",
                              i(),
                              "form",
                              e.currentTarget.value
                            )
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

            <div>
              <h2>
                Mash Schedule
                <Show when={edit()}>
                  <button class="primary">&plus;</button>
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
                <For each={recipe.mashSteps}>
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
              <h2>Target Water Profile</h2>

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
                        setRecipe(
                          "water",
                          "ca",
                          parseInt(e.currentTarget.value)
                        )
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
                        setRecipe(
                          "water",
                          "mg",
                          parseInt(e.currentTarget.value)
                        )
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
                        setRecipe(
                          "water",
                          "na",
                          parseInt(e.currentTarget.value)
                        )
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
                        setRecipe(
                          "water",
                          "cl",
                          parseInt(e.currentTarget.value)
                        )
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
                        setRecipe(
                          "water",
                          "so4",
                          parseInt(e.currentTarget.value)
                        )
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
          </div>
          <p>
            EBC:
            <span
              class="color-block"
              style={{ "background-color": ebcToCss(ebc()) }}
            />
            {Math.round(ebc())} OG: {stats().og.toFixed(3)} FG:{" "}
            {stats().fg.toFixed(3)} IBU:{hopStats().ibu.toFixed(1)} ABV:
            {stats().abv.toFixed(1)}% Cal:{Math.round(stats().calories)}
          </p>
        </article>
      </div>
    </div>
  );
};

export default App;
