import { Brauhaus, Recipe } from "./brauhaus/types";
import {
  For,
  Show,
  createEffect,
  createMemo,
  createResource,
  createSignal,
  on,
  onCleanup,
  untrack,
} from "solid-js";
import { Outlet, useLocation, useNavigate, useParams } from "@solidjs/router";
import { SetStoreFunction, createStore } from "solid-js/store";
import {
  cToF,
  calculateColor,
  calculateFermentables,
  calculateHops,
  ebcToCss,
  ebcToRgb,
  ebcToSrm,
  fToC,
  gToOz,
  gallonsToLiters,
  kgToLbOz,
  lbToKg,
  litersToGallons,
  lovibondToSrm,
  mlToOz,
  ozToG,
  ozToMl,
  ppgToYield,
  sgToPlato,
  srmToEbc,
  srmToLovibond,
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
import { crush, load } from "./crush";

import type { Component } from "solid-js";
import { Editable } from "./Editable";
import { LbOz } from "./LbOz";
import QRCode from "qrcode-svg";
import { StylePicker } from "./StylePicker";
import { StyleValue } from "./StyleValue";
import bjcp2021 from "./assets/bjcp2021.json?url";
import createURLStore from "./urlstore";
import { debounce } from "@solid-primitives/scheduled";
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

function contrast(srm: number): string {
  return srm < 15 ? "#000" : "#fff";
}

async function fetchJSON(url: string) {
  return (await fetch(url)).json();
}

const Editor: Component<{
  bh: Brauhaus;
  setBh: SetStoreFunction<Brauhaus>;
}> = (props) => {
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

  const loc = useLocation();
  const [edit, setEdit] = createSignal(
    loc.pathname === "/r/" || window.location.hash === "#edit"
  );

  createEffect(() => {
    if (loc.pathname === "/r/") setEdit(true);
  });

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
    return calculateFermentables(props.bh, recipe);
  });

  const hopStats = createMemo(() => {
    console.log("Calculating hops...");
    return calculateHops(props.bh, recipe);
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
              <Editable
                show={edit()}
                type="select"
                value={recipe.type}
                oninput={(e) => setRecipe("type", e.currentTarget.value)}
              >
                <option>all grain</option>
                <option>partial mash</option>
                <option>extract</option>
              </Editable>
            </div>
            <div class="batch col right">
              <label>Batch</label>
              <Editable
                show={edit()}
                type="number"
                step={props.bh.units.volume === "liters" ? 1 : 0.5}
                suffix={props.bh.units.volume === "liters" ? "L" : "G"}
                value={
                  props.bh.units.volume === "liters"
                    ? recipe.batchSize
                    : Math.round(litersToGallons(recipe.batchSize) * 2) / 2
                }
                oninput={(e) =>
                  setRecipe(
                    "batchSize",
                    props.bh.units.volume === "liters"
                      ? parseInt(e.currentTarget.value || "0")
                      : Math.round(
                          gallonsToLiters(
                            parseFloat(e.currentTarget.value || "0")
                          )
                        )
                  )
                }
              />
            </div>
            <div class="boil col right">
              <label>Boil</label>
              <Editable
                show={edit()}
                type="number"
                step={props.bh.units.volume === "liters" ? 1 : 0.5}
                suffix={props.bh.units.volume === "liters" ? "L" : "G"}
                value={
                  props.bh.units.volume === "liters"
                    ? recipe.boilSize
                    : Math.round(litersToGallons(recipe.boilSize) * 2) / 2
                }
                oninput={(e) =>
                  setRecipe(
                    "boilSize",
                    props.bh.units.volume === "liters"
                      ? parseInt(e.currentTarget.value || "0")
                      : Math.round(
                          gallonsToLiters(
                            parseFloat(e.currentTarget.value || "0")
                          )
                        )
                  )
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
            label={props.bh.units.color === "ebc" ? "EBC" : "SRM"}
            min={
              props.bh.units.color === "ebc"
                ? srmToEbc(selectedStyle().stats.SRM[0])
                : selectedStyle().stats.SRM[0]
            }
            max={
              props.bh.units.color === "ebc"
                ? srmToEbc(selectedStyle().stats.SRM[1])
                : selectedStyle().stats.SRM[1]
            }
            value={props.bh.units.color === "ebc" ? ebc() : ebcToSrm(ebc())}
            precision={0}
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
              <Show
                when={props.bh.units.weight === "kg"}
                fallback={
                  <>
                    <div class="lbs right">Lbs</div>
                    <div class="oz right">Oz</div>
                  </>
                }
              >
                <div class="amount right">Grams</div>
              </Show>
              <div class="name">Name</div>
              <Show
                when={props.bh.units.yield === "percent"}
                fallback={<div class="ppg right long">PPG</div>}
              >
                <div class="yield right long">Yield</div>
              </Show>
              <Show
                when={props.bh.units.color === "ebc"}
                fallback={<div class="lovibond right long">&deg;L</div>}
              >
                <div class="ebc right long">&deg;EBC</div>
              </Show>
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
                  <Show
                    when={props.bh.units.weight === "kg"}
                    fallback={
                      <LbOz
                        show={edit()}
                        g={fermentable.grams}
                        oninput={(v) =>
                          setRecipeNow("fermentables", i(), "grams", v)
                        }
                        onchange={() => {
                          setRecipe(
                            "fermentables",
                            [...recipe.fermentables].sort(
                              (a, b) => b.grams - a.grams
                            )
                          );
                        }}
                      />
                    }
                  >
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
                        onchange={(e) => {
                          setRecipe(
                            "fermentables",
                            [...recipe.fermentables].sort(
                              (a, b) => b.grams - a.grams
                            )
                          );
                        }}
                      />
                    </div>
                  </Show>

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
                  <Show
                    when={props.bh.units.yield === "percent"}
                    fallback={
                      <div class="ppg right break-small">
                        <Editable
                          show={edit()}
                          type="number"
                          value={Math.round(fermentable.percentYield * 0.46)}
                          prefix="PPG"
                          prefixShort={true}
                          oninput={(e) =>
                            setRecipe(
                              "fermentables",
                              i(),
                              "percentYield",
                              parseInt(e.currentTarget.value || "0") / 0.46
                            )
                          }
                        />
                      </div>
                    }
                  >
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
                  </Show>

                  <Show
                    when={props.bh.units.color === "ebc"}
                    fallback={
                      <div class="srm right break-small">
                        <input
                          disabled={!edit()}
                          class="color"
                          type="number"
                          min="0"
                          max="1000"
                          style={{
                            color: contrast(fermentable.ebc),
                            "background-color": ebcToCss(fermentable.ebc),
                            width: "30px",
                          }}
                          value={Math.round(
                            srmToLovibond(ebcToSrm(fermentable.ebc))
                          )}
                          oninput={(e) =>
                            setRecipe(
                              "fermentables",
                              i(),
                              "ebc",
                              srmToEbc(
                                lovibondToSrm(
                                  parseInt(e.currentTarget.value || "0")
                                )
                              )
                            )
                          }
                        />
                        <span class="suffix short">&deg;L</span>
                      </div>
                    }
                  >
                    <div class="ebc right break-small">
                      <input
                        disabled={!edit()}
                        class="color"
                        type="number"
                        min="0"
                        max="1000"
                        style={{
                          color: contrast(fermentable.ebc),
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
                  </Show>
                  <div class="abv right break-small">
                    {stats().abvMap[i()].toFixed(1)}
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
                <Show
                  when={props.bh.units.weight === "kg"}
                  fallback={
                    <>
                      <div class="lbs right">
                        {kgToLbOz(stats().fermentableGrams / 1000).lb}
                        <span class="suffix">lb</span>
                      </div>
                      <div class="oz right">
                        {Math.round(
                          kgToLbOz(stats().fermentableGrams / 1000).oz
                        )}
                        <span class="suffix">oz</span>
                      </div>
                    </>
                  }
                >
                  <div class="amount right">
                    {stats().fermentableGrams}
                    <span class="suffix">g</span>
                  </div>
                </Show>
                <div class="name break-small"></div>
                <div class="yield right long">
                  <Show when={props.bh.units.color === "srm"}>
                    <span class="prefix">&deg;SRM</span>
                  </Show>
                </div>
                <div class="ebc right">
                  <span
                    class="color-block"
                    style={{
                      color: contrast(ebc()),
                      "background-color": ebcToCss(ebc()),
                    }}
                  >
                    {Math.round(
                      props.bh.units.color === "ebc" ? ebc() : ebcToSrm(ebc())
                    )}
                  </span>
                  <span class="suffix short">
                    &deg;{props.bh.units.color === "ebc" ? "EBC" : "SRM"}
                  </span>
                </div>
                <div class="abv right">
                  {stats().abv.toFixed(1)}
                  <span class="suffix">﹪</span>
                  <span class="suffix short">ABV</span>
                </div>
                <div class="cal right short">
                  {Math.round(stats().calories)}
                  <span class="suffix">Cal</span> /{" "}
                  <Editable
                    class="serving-size"
                    show={edit()}
                    type="number"
                    suffix={props.bh.units.volume === "liters" ? "ml" : "oz"}
                    value={
                      props.bh.units.volume === "liters"
                        ? recipe.servingSizeMl
                        : Math.round(mlToOz(recipe.servingSizeMl))
                    }
                    oninput={(e) =>
                      setRecipeNow(
                        "servingSizeMl",
                        props.bh.units.volume === "liters"
                          ? parseInt(e.currentTarget.value)
                          : Math.round(ozToMl(parseInt(e.currentTarget.value)))
                      )
                    }
                  />
                </div>
                <Show when={edit()}>
                  <div class="delete break-small"></div>
                </Show>
                <div class="break break-small"></div>
              </div>
            </Show>
          </div>
          <div class="row cal right long">
            {Math.round(stats().calories)}
            <span class="suffix">Cal</span> /{" "}
            <Editable
              class="serving-size"
              show={edit()}
              type="number"
              suffix={props.bh.units.volume === "liters" ? "ml" : "oz"}
              value={
                props.bh.units.volume === "liters"
                  ? recipe.servingSizeMl
                  : Math.round(mlToOz(recipe.servingSizeMl))
              }
              oninput={(e) =>
                setRecipeNow(
                  "servingSizeMl",
                  props.bh.units.volume === "liters"
                    ? parseInt(e.currentTarget.value)
                    : Math.round(ozToMl(parseInt(e.currentTarget.value)))
                )
              }
            />
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
                    <Editable
                      show={edit()}
                      type="select"
                      value={hop.use}
                      oninput={(e) =>
                        setRecipe("hops", i(), "use", e.currentTarget.value)
                      }
                    >
                      <option>mash</option>
                      <option>boil</option>
                      <option>aroma</option>
                      <option>dry hop</option>
                    </Editable>
                  </div>
                  <Show
                    when={props.bh.units.weight === "kg"}
                    fallback={
                      <div class="oz right break-small">
                        <Editable
                          show={edit()}
                          type="number"
                          step={0.1}
                          suffix="oz"
                          value={gToOz(hop.grams).toFixed(1)}
                          oninput={(e) =>
                            setRecipe(
                              "hops",
                              i(),
                              "grams",
                              Math.round(
                                ozToG(parseFloat(e.currentTarget.value))
                              )
                            )
                          }
                        />
                      </div>
                    }
                  >
                    <div class="weight right break-small">
                      <Editable
                        show={edit()}
                        type="number"
                        suffix={"g"}
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
                  </Show>

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
                    <Editable
                      show={edit()}
                      type="select"
                      value={hop.form}
                      oninput={(e) =>
                        setRecipe("hops", i(), "form", e.currentTarget.value)
                      }
                    >
                      <option>pellet</option>
                      <option>leaf</option>
                      <option>plug</option>
                    </Editable>
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
                <Show
                  when={props.bh.units.weight === "kg"}
                  fallback={
                    <div class="oz right">
                      <span class="value">
                        {gToOz(hopStats().grams).toFixed(1)}
                        <span class="suffix">oz</span>
                      </span>
                    </div>
                  }
                >
                  <div class="weight right">
                    <span class="value">
                      {hopStats().grams}
                      <span class="suffix">g</span>
                    </span>
                  </div>
                </Show>
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
                    <Editable
                      show={edit()}
                      type="select"
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
                    </Editable>
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
                    <Editable
                      show={edit()}
                      type="select"
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
                    </Editable>
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
              <div class="attenuation right long">ATT</div>
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
                    <Editable
                      show={edit()}
                      type="select"
                      value={yeast.units}
                      oninput={(e) =>
                        setRecipe("yeasts", i(), "units", e.currentTarget.value)
                      }
                    >
                      <option>g</option>
                      <option>ml</option>
                      <option>pkt</option>
                    </Editable>
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
                    <Editable
                      show={edit()}
                      type="select"
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
                    </Editable>
                  </div>
                  <div class="form break-small">
                    <Editable
                      show={edit()}
                      type="select"
                      value={yeast.form}
                      oninput={(e) =>
                        setRecipe("yeasts", i(), "form", e.currentTarget.value)
                      }
                    >
                      <option>liquid</option>
                      <option>dry</option>
                    </Editable>
                  </div>
                  <div class="attenuation right break-small">
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
                        suffix={
                          "°" + (props.bh.units.temperature === "c" ? "C" : "F")
                        }
                        value={
                          props.bh.units.temperature === "c"
                            ? Math.round(step.temperature)
                            : Math.round(cToF(step.temperature))
                        }
                        oninput={(e) =>
                          setRecipe(
                            "mashSteps",
                            i(),
                            "temperature",
                            props.bh.units.temperature === "c"
                              ? parseInt(e.currentTarget.value)
                              : fToC(parseInt(e.currentTarget.value))
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
                        step={0.1}
                        value={
                          props.bh.units.volume === "liters"
                            ? step.waterGrainRatio.toFixed(1)
                            : (step.waterGrainRatio / 2.086).toFixed(1)
                        }
                        suffix={
                          props.bh.units.volume === "liters" ? "L/kg" : "qt/G"
                        }
                        oninput={(e) =>
                          setRecipe(
                            "mashSteps",
                            i(),
                            "waterGrainRatio",
                            props.bh.units.volume === "liters"
                              ? parseFloat(e.currentTarget.value)
                              : parseFloat(e.currentTarget.value) * 2.086
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
                    <Editable
                      show={edit()}
                      type="select"
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
                    </Editable>
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
                      suffix={
                        "°" + (props.bh.units.temperature === "c" ? "C" : "F")
                      }
                      value={
                        props.bh.units.temperature === "c"
                          ? Math.round(step.temperature)
                          : Math.round(cToF(step.temperature))
                      }
                      oninput={(e) =>
                        setRecipe(
                          "fermentationSteps",
                          i(),
                          "temperature",
                          props.bh.units.temperature === "c"
                            ? parseInt(e.currentTarget.value)
                            : fToC(parseInt(e.currentTarget.value))
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
                step={0.1}
                value={recipe.carbonation}
                oninput={(e) =>
                  setRecipe("carbonation", parseFloat(e.currentTarget.value))
                }
              />
            </div>
          </div>
        </div>

        <div
          class="ingredient qr"
          innerHTML={new QRCode({
            content:
              window.location.protocol +
              "//" +
              window.location.host +
              "/r/" +
              params.encoded,
            join: true,
            container: "svg-viewbox",
            padding: 2,
          }).svg()}
        ></div>
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
