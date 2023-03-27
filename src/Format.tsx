import Pako, { deflateRaw } from "pako";
import { fromUint8Array, toUint8Array } from "js-base64";

import { A } from "@solidjs/router";
import type { Component } from "solid-js";
import { Recipe } from "./brauhaus/types";
import { dictionary } from "./dict";
import { encodeBinary } from "./binary";
import fermStepDiagram from "./assets/fermstep.svg?url";
import fermentableDiagram from "./assets/fermentable.svg?url";
import hopDiagram from "./assets/hop.svg?url";
import mashDiagram from "./assets/mash.svg?url";
import miscDiagram from "./assets/misc.svg?url";
import recipeDiagram from "./assets/recipe.svg?url";
import typesDiagram from "./assets/types.svg?url";
import yeastDiagram from "./assets/yeast.svg?url";

const fatTire: Recipe = {
  name: "Fat Tire Clone",
  description: "BYO Dec 2010",
  type: "all grain",
  batchSize: 20,
  boilSize: 26,
  servingSizeMl: 355,
  style: 57,
  fermentables: [
    {
      percentYield: 80,
      grams: 4536,
      ebc: 8,
      name: "Pale Ale",
    },
    {
      percentYield: 80,
      grams: 454,
      ebc: 14,
      name: "Munich Light",
    },
    {
      percentYield: 72,
      grams: 227,
      ebc: 73,
      name: "Victory",
    },
    {
      percentYield: 74,
      grams: 173,
      ebc: 212,
      name: "Crystal 80L",
    },
  ],
  hops: [
    {
      name: "Target",
      grams: 11,
      aa: 11,
      use: "boil",
      form: "pellet",
      time: 60,
    },
    {
      name: "Willamette",
      grams: 14,
      aa: 5,
      use: "boil",
      form: "pellet",
      time: 10,
    },
    {
      name: "East Kent Goldings",
      grams: 14,
      aa: 5,
      use: "aroma",
      form: "pellet",
      time: 0,
    },
  ],
  miscs: [],
  yeasts: [
    {
      name: "California Ale V Yeast WLP051",
      attenuation: 72,
      form: "dry",
      units: "pkt",
      type: "ale",
      amount: 1,
    },
  ],
  water: {
    ca: 15,
    mg: 3,
    na: 8,
    cl: 12,
    so4: 3,
    hco3: 52,
  },
  mashSteps: [
    {
      name: "Single Infusion",
      temperature: 68,
      duration: 40,
      waterGrainRatio: 3.1,
      rampTime: 0,
    },
    {
      name: "Mash Out",
      temperature: 77,
      duration: 10,
      waterGrainRatio: 3.1,
      rampTime: 0,
    },
  ],
  fermentationSteps: [
    {
      type: "primary",
      temperature: 20,
      duration: 14,
    },
  ],
  carbonation: 2.4,
};

const fatTireJSONPretty = JSON.stringify(fatTire, null, 2);
const fatTireJSON = JSON.stringify(fatTire);
const fatTireJSONDeflate = deflateRaw(fatTireJSON, { level: 9 });
const fatTireJSONDictDeflate = deflateRaw(fatTireJSON, {
  level: 9,
  dictionary,
});
const fatTireBin = encodeBinary(fatTire);
const fatTireDeflate = deflateRaw(fatTireBin, {
  level: 9,
  dictionary: dictionary,
});
const fatTireB64 = fromUint8Array(new Uint8Array(fatTireDeflate), true);

const Format: Component = () => {
  return (
    <article style="padding: 12px">
      <div style="container-type: inline-size; max-width: 800px; margin: auto;">
        <h2>Recipe Format</h2>
        <p>
          The recipe format is a custom binary format designed with these goals
          in mind:
        </p>
        <ul>
          <li>Be URL-safe</li>
          <li>Be as space-efficient as possible</li>
          <li>Be quick to encode / decode</li>
          <li>Support representing hundreds of years of beer recipes</li>
          <li>Support newly developed/released ingredients</li>
          <li>
            Efficiently store 1 gal <em>and</em> 1 bbl (42 gal) recipes
          </li>
        </ul>
        <p>
          The algorithm works by first encoding the recipe as a binary string,
          then compressing it using the deflate algorithm with a custom
          dictionary of common beer ingredients, then encoding the compressed
          string as base64. The result is a URL-safe string that can be used as
          a recipe link.
        </p>
        <p>Here is the reference implementation:</p>
        <ul>
          <li>
            <a href="https://raw.githubusercontent.com/homebrewing/malt.io/main/src/dict.txt">
              Custom deflate dictionary
            </a>
          </li>
          <li>
            Reference implementations
            <ul>
              <li>
                <a href="https://github.com/homebrewing/malt.io/blob/main/src/brauhaus/types.ts">
                  Type definitions (Typescript)
                </a>
              </li>
              <li>
                <a href="https://github.com/homebrewing/malt.io/blob/main/src/binary.ts">
                  Binary encoding (Typescript)
                </a>
              </li>
              <li>
                <a href="https://github.com/homebrewing/malt.io/blob/main/src/crush.ts">
                  Binary/deflate/base64 encoding (Typescript)
                </a>
              </li>
            </ul>
          </li>
        </ul>
        <h3 id="types">
          <a href="#types">Type Definitions</a>
        </h3>
        <p>
          This page includes bit diagrams of the format. Each row is 16 bits (2
          bytes) and variable-length values are denoted by dotted lines. For
          example, a value spanning 3 columns will take 3 bits. A
          variable-length value spanning 8 columns will take at least one byte,
          and may take two, three, or more depending on its value or contained
          values.
        </p>
        <p class="diagram">
          <img src={typesDiagram} />
        </p>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>enum</code>
              </td>
              <td>
                A fixed set of values represented as an unsigned integer of the
                specified number of bits.
              </td>
            </tr>
            <tr>
              <td>
                <code>bool</code>
              </td>
              <td>
                A one-bit boolean value, either <code>0</code> or <code>1</code>
                .
              </td>
            </tr>
            <tr>
              <td>
                <code>uint</code>
              </td>
              <td>An unsigned integer of the specified number of bits.</td>
            </tr>
            <tr>
              <td>
                <code>fixed</code>
              </td>
              <td>
                A fixed-point number represented by multiplying/dividing the
                stored unsigned integer to achieve the desired number of decimal
                places.
              </td>
            </tr>
            <tr>
              <td>
                <code>vlq/varint</code>
              </td>
              <td>
                A{" "}
                <a href="https://en.wikipedia.org/wiki/Variable-length_quantity">
                  variable-length quantity
                </a>{" "}
                or varint which takes one or more bytes to represent a number.
                The most significant bit is used as a continuation marker, so
                each byte can encode 7-bits of the number.
              </td>
            </tr>
            <tr>
              <td>
                <code>variable bytes</code>
              </td>
              <td>
                Any number of bytes. When used for strings, UTF-8 encoding is
                used! 😀 🍺 🎉
              </td>
            </tr>
          </tbody>
        </table>
        <p>
          There is an additional variable length string format which is
          comprised of a vlq/varint length followed by the bytes of the string.
        </p>
        <h3 id="recipe">
          <a href="#recipe">Recipe Object</a>
        </h3>
        <p>
          The top level object of the binary format is a recipe. The following
          is a bit diagram of the recipe:
        </p>
        <p class="diagram">
          <img src={recipeDiagram} />
        </p>
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Size</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>glass</code>
              </td>
              <td>3 bits, value 0-7</td>
              <td>TODO</td>
            </tr>
            <tr>
              <td>
                <code>serving_size</code>
              </td>
              <td>3 bits, value 0-7</td>
              <td>
                Serving size in ml. One of <code>300</code>, <code>330</code>,{" "}
                <code>355</code> (12oz), <code>375</code>, <code>473</code>{" "}
                (16oz), <code>500</code>, <code>568</code> (UK pint), or custom.
              </td>
            </tr>
            <tr>
              <td>
                <code>type</code>
              </td>
              <td>2 bits, value 0-3</td>
              <td>
                One of <code>all grain</code>, <code>partial mash</code>,{" "}
                <code>extract</code>.
              </td>
            </tr>
            <tr>
              <td>
                <code>small</code>
              </td>
              <td>1 bit boolean</td>
              <td>
                True if <code>batch &lt; 32 && (boil - batch) &lt; 8</code>
              </td>
            </tr>
            <tr>
              <td>
                <code>bjcp_style</code>
              </td>
              <td>7 bits, value 0-127</td>
              <td>
                The 2021 BJCP Style Guide style index, in the order given in the
                guide.
              </td>
            </tr>
            <tr>
              <td>
                <code>name_len</code>
              </td>
              <td>variable uint</td>
              <td>Length of the name string in bytes.</td>
            </tr>
            <tr>
              <td>
                <code>name</code>
              </td>
              <td>variable bytes</td>
              <td>Recipe name.</td>
            </tr>
            <tr>
              <td>
                <code>description_len</code>
              </td>
              <td>variable uint</td>
              <td>Length of the name string in bytes.</td>
            </tr>
            <tr>
              <td>
                <code>description</code>
              </td>
              <td>variable bytes</td>
              <td>Recipe description.</td>
            </tr>
            <tr>
              <td>
                <code>batch</code>
              </td>
              <td>5 bits, value 0-31</td>
              <td>Recipe batch size in liters.</td>
            </tr>
            <tr>
              <td>
                <code>boil - batch</code>
              </td>
              <td>3 bits, value 0-7</td>
              <td>The different between the boil and batch size in liters.</td>
            </tr>
            <tr>
              <td>
                <code>large_batch</code>
              </td>
              <td>variable uint</td>
              <td>Recipe batch size in liters</td>
            </tr>
            <tr>
              <td>
                <code>boil - large_batch</code>
              </td>
              <td>variable uint</td>
              <td>The different between the boil and batch size in liters.</td>
            </tr>
            <tr>
              <td>
                <code>custom_serving_size</code>
              </td>
              <td>variable uint</td>
              <td>Serving size in ml.</td>
            </tr>
            <tr>
              <td>
                <code>fermentable_len</code>
              </td>
              <td>4 bits, value 0-15</td>
              <td>Number of fermentables.</td>
            </tr>
            <tr>
              <td>
                <code>misc_len</code>
              </td>
              <td>4 bits, value 0-15</td>
              <td>Number of mics items.</td>
            </tr>
            <tr>
              <td>
                <code>hops_len</code>
              </td>
              <td>5 bits, value 0-31</td>
              <td>Number of hops.</td>
            </tr>
            <tr>
              <td>
                <code>yeast_len</code>
              </td>
              <td>3 bits, value 0-7</td>
              <td>Number of yeasts.</td>
            </tr>
            <tr>
              <td>
                <code>fermentables</code>
              </td>
              <td>variable bytes</td>
              <td>
                <code>fermentable_len</code> instances of{" "}
                <a href="#fermentable">Fermentable Object</a>.
              </td>
            </tr>
            <tr>
              <td>
                <code>hops</code>
              </td>
              <td>variable bytes</td>
              <td>
                <code>hop_len</code> instances of <a href="#hop">Hop Object</a>.
              </td>
            </tr>
            <tr>
              <td>
                <code>misc</code>
              </td>
              <td>variable bytes</td>
              <td>
                <code>misc_len</code> instances of{" "}
                <a href="#misc">Misc Object</a>.
              </td>
            </tr>
            <tr>
              <td>
                <code>yeast</code>
              </td>
              <td>variable bytes</td>
              <td>
                <code>yeast_len</code> instances of{" "}
                <a href="#yeast">Yeast Object</a>.
              </td>
            </tr>
            <tr>
              <td>
                <code>wtr</code>
              </td>
              <td>1 bit boolean</td>
              <td>True if the recipe has a water profile.</td>
            </tr>
            <tr>
              <td>
                <code>mash_step_len</code>
              </td>
              <td>7 bits, value 0-127</td>
              <td>Number of mash steps.</td>
            </tr>
            <tr>
              <td>
                <code>mash_steps</code>
              </td>
              <td>variable bytes</td>
              <td>
                <code>mash_step_len</code> instances of{" "}
                <a href="#mash">Mash Step Object</a>.
              </td>
            </tr>
            <tr>
              <td>
                <code>ca</code>
              </td>
              <td>variable uint</td>
              <td>Target calcium ppm.</td>
            </tr>
            <tr>
              <td>
                <code>mg</code>
              </td>
              <td>variable uint</td>
              <td>Target magensium ppm.</td>
            </tr>
            <tr>
              <td>
                <code>na</code>
              </td>
              <td>variable uint</td>
              <td>Target sodium ppm.</td>
            </tr>
            <tr>
              <td>
                <code>cl</code>
              </td>
              <td>variable uint</td>
              <td>Target chloride ppm.</td>
            </tr>
            <tr>
              <td>
                <code>so4</code>
              </td>
              <td>variable uint</td>
              <td>Target sulfate ppm.</td>
            </tr>
            <tr>
              <td>
                <code>hco3</code>
              </td>
              <td>variable uint</td>
              <td>Target bicarbonate ppm.</td>
            </tr>
            <tr>
              <td>
                <code>co2.1</code>
              </td>
              <td>5 bits, value 0-63</td>
              <td>
                Carbonation CO<sub>2</sub> in volumes to one decimal place.
              </td>
            </tr>
            <tr>
              <td>
                <code>ferm_len</code>
              </td>
              <td>3 bits, value 0-7</td>
              <td>Number of fermentation steps.</td>
            </tr>
            <tr>
              <td>
                <code>fermentation_steps</code>
              </td>
              <td>variable bytes</td>
              <td>
                <code>ferm_len</code> instances of{" "}
                <a href="#fermstep">Fermentation Step Object</a>.
              </td>
            </tr>
          </tbody>
        </table>
        <h3 id="fermentable">
          <a href="#fermentable">Fermentable Object</a>
        </h3>
        <p>Describes one fermentable in the recipe.</p>
        <p class="diagram">
          <img src={fermentableDiagram} />
        </p>
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Size</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>units</code>
              </td>
              <td>2 bits, value 0-3</td>
              <td>
                One of <code>grams</code>, <code>kilograms</code>,{" "}
                <code>ounces</code>, or <code>pounds</code>. It is used to scale
                the weight.
              </td>
            </tr>
            <tr>
              <td>
                <code>yield</code>
              </td>
              <td>7 bits, value 0-127</td>
              <td>
                The yield percentage of the fermentable, comparable to sugar
                parts-per-gallon: <code>ppg / 46</code>.
              </td>
            </tr>
            <tr>
              <td>
                <code>name_len</code>
              </td>
              <td>7 bits, value 0-127</td>
              <td>
                The length in bytes of the <code>name</code>.
              </td>
            </tr>
            <tr>
              <td>
                <code>weight</code>
              </td>
              <td>variable uint</td>
              <td>
                The weight in the given <code>units</code>. When read, this
                value should always be normalized to grams. E.g. if{" "}
                <code>units</code> is <code>kilograms</code> and{" "}
                <code>weight</code> is <code>2</code>, then the fermentable
                would weight <code>2000</code> grams.
              </td>
            </tr>
            <tr>
              <td>
                <code>ebc_color</code>
              </td>
              <td>variable uint</td>
              <td>The color in &deg;EBC.</td>
            </tr>
            <tr>
              <td>
                <code>name_len</code>
              </td>
              <td>variable uint</td>
              <td>Length of the name string in bytes.</td>
            </tr>
            <tr>
              <td>
                <code>name</code>
              </td>
              <td>variable bytes</td>
              <td>Fermentable name.</td>
            </tr>
          </tbody>
        </table>
        <h3 id="hop">
          <a href="#hop">Hop Object</a>
        </h3>
        <p class="diagram">
          <img src={hopDiagram} />
        </p>
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Size</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>time</code>
              </td>
              <td>3 bits, value 0-7</td>
              <td>
                Either a preset time value if 0-6 (<code>60</code>,{" "}
                <code>20</code>, <code>15</code>, <code>10</code>,{" "}
                <code>5</code>, <code>0</code>), the previous value if 7 (seeded
                with 60 minutes), or read <code>custom_time</code> below.
              </td>
            </tr>
            <tr>
              <td>
                <code>wt</code>
              </td>
              <td>1 bit boolean</td>
              <td>
                True if this hop has a different weight from the previous hop,
                seeded with the value of <code>28</code> grams. If true, then
                read the grams field, otherwise use the previous value.
              </td>
            </tr>
            <tr>
              <td>
                <code>form</code>
              </td>
              <td>2 bits, value 0-3</td>
              <td>
                The hop form, one of <code>pellet</code>, <code>leaf</code>, or{" "}
                <code>plug</code>.
              </td>
            </tr>
            <tr>
              <td>
                <code>use</code>
              </td>
              <td>2 bits, value 0-3</td>
              <td>
                When to use the hop, one of <code>boil</code>,{" "}
                <code>dry hop</code>, <code>mash</code>, <code>aroma</code>.
              </td>
            </tr>
            <tr>
              <td>
                <code>custom_time</code>
              </td>
              <td>variable uint</td>
              <td>
                Custom time in minutes if use is not <code>dry hop</code>,
                otherwise time in days.
              </td>
            </tr>
            <tr>
              <td>
                <code>grams</code>
              </td>
              <td>variable uint</td>
              <td>Weight in grams.</td>
            </tr>
            <tr>
              <td>
                <code>alpha_acid.1</code>
              </td>
              <td>fixed-point</td>
              <td>
                Alpha acid percentage with one decimal point, stored as a
                vlq/varint. 3.5% aa would be stored as <code>35</code>. When
                read, this value must be divided by 10.
              </td>
            </tr>
            <tr>
              <td>
                <code>name_len</code>
              </td>
              <td>variable uint</td>
              <td>Length of the name string in bytes.</td>
            </tr>
            <tr>
              <td>
                <code>name</code>
              </td>
              <td>variable bytes</td>
              <td>Hop name.</td>
            </tr>
          </tbody>
        </table>
        <h3 id="misc">
          <a href="#misc">Misc Object</a>
        </h3>
        <p class="diagram">
          <img src={miscDiagram} />
        </p>
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Size</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>time</code>
              </td>
              <td>2 bits, value 0-3</td>
              <td>
                Either a preset time value if 0-2 (<code>5</code>,{" "}
                <code>10</code>, <code>15</code>), or read{" "}
                <code>custom_time</code> below.
              </td>
            </tr>
            <tr>
              <td>
                <code>use</code>
              </td>
              <td>3 bits, value 0-7</td>
              <td>
                Either <code>boil</code>, <code>mash</code>, <code>sparge</code>
                , <code>primary</code>, <code>secondary</code>, or{" "}
                <code>bottling</code>.
              </td>
            </tr>
            <tr>
              <td>
                <code>units</code>
              </td>
              <td>3 bits, value 0-7</td>
              <td>
                Either <code>g</code>, <code>ml</code>, <code>each</code>,{" "}
                <code>tsp</code>, <code>tbsp</code>, or <code>g/ml</code>.
              </td>
            </tr>
            <tr>
              <td>
                <code>custom_time</code>
              </td>
              <td>variable uint</td>
              <td>
                Custom time in minutes if use is <code>boil</code> or{" "}
                <code>mash</code>, otherwise time in days.
              </td>
            </tr>
            <tr>
              <td>
                <code>amount</code>
              </td>
              <td>variable uint</td>
              <td>Amount of the misc item in the given units.</td>
            </tr>
            <tr>
              <td>
                <code>name_len</code>
              </td>
              <td>variable uint</td>
              <td>Length of the name string in bytes.</td>
            </tr>
            <tr>
              <td>
                <code>name</code>
              </td>
              <td>variable bytes</td>
              <td>Misc name.</td>
            </tr>
          </tbody>
        </table>
        <h3 id="yeast">
          <a href="#yeast">Yeast Object</a>
        </h3>
        <p class="diagram">
          <img src={yeastDiagram} />
        </p>
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Size</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>amt</code>
              </td>
              <td>1 bit boolean</td>
              <td>
                True if the amount isn't <code>1</code>, in which case you must
                read the custom <code>amount</code>.
              </td>
            </tr>
            <tr>
              <td>
                <code>type</code>
              </td>
              <td>3 bits, value 0-7</td>
              <td>
                One of <code>ale</code>, <code>lager</code>, <code>cider</code>,{" "}
                <code>wine</code>, <code>other</code>.
              </td>
            </tr>
            <tr>
              <td>
                <code>units</code>
              </td>
              <td>2 bits, value 0-3</td>
              <td>
                One of <code>g</code>, <code>ml</code>, <code>packet</code>.
              </td>
            </tr>
            <tr>
              <td>
                <code>form</code>
              </td>
              <td>2 bits, value 0-3</td>
              <td>
                One of <code>liquid</code>, <code>dry</code>.
              </td>
            </tr>
            <tr>
              <td>
                <code>amount</code>
              </td>
              <td>variable uint</td>
              <td>Amount in the given units.</td>
            </tr>
            <tr>
              <td>
                <code>attenuation</code>
              </td>
              <td>8 bits, value 0-256</td>
              <td>Expected attenuation percentage.</td>
            </tr>
            <tr>
              <td>
                <code>name_len</code>
              </td>
              <td>variable uint</td>
              <td>Length of the name string in bytes.</td>
            </tr>
            <tr>
              <td>
                <code>name</code>
              </td>
              <td>variable bytes</td>
              <td>Yeast name.</td>
            </tr>
          </tbody>
        </table>
        <h3 id="mash">
          <a href="#mash">Mash Step Object</a>
        </h3>
        <p class="diagram">
          <img src={mashDiagram} />
        </p>
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Size</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>temp</code>
              </td>
              <td>6 bits, value 0-63</td>
              <td>
                Step temperature enum in &deg;F. Fahrenheit is used because it
                can represent any celcius temperature, but the inverse is not
                true. One of 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105,
                106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118,
                119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 142,
                143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155,
                156, 157, 158, 159, 160, 161, 162, 167, 168, 169, 170, 171, 212,
                or other. If other, then a custom temperature will be written
                later.
              </td>
            </tr>
            <tr>
              <td>
                <code>dur</code>
              </td>
              <td>3 bits, value 0-7</td>
              <td>
                One of <code>5</code>, <code>10</code>, <code>15</code>,{" "}
                <code>20</code>, <code>30</code>, <code>45</code>,{" "}
                <code>60</code>, or other which adds a{" "}
                <code>custom_duration</code> field.
              </td>
            </tr>
            <tr>
              <td>
                <code>ratio.1</code>
              </td>
              <td>fixed-point</td>
              <td>
                The water to grain ratio in l/kg with one decimal point, shifted
                by 1.6. Range: 1.6 - 4.7.
              </td>
            </tr>
            <tr>
              <td>
                <code>ramp</code>
              </td>
              <td>2 bits, value 0-3</td>
              <td>
                One of <code>0</code>, <code>15</code>, <code>20</code>, or
                other, which adds a <code>custom_ramp</code> field.
              </td>
            </tr>
            <tr>
              <td>
                <code>custom_temp</code>
              </td>
              <td>uint</td>
              <td>Temperature in &deg;F.</td>
            </tr>
            <tr></tr>
            <tr>
              <td>
                <code>custom_duration</code>
              </td>
              <td>variable uint</td>
              <td>Duration in minutes.</td>
            </tr>
            <tr>
              <td>
                <code>custom_ramp</code>
              </td>
              <td>variable uint</td>
              <td>Ramp time in minutes.</td>
            </tr>
            <tr>
              <td>
                <code>name_len</code>
              </td>
              <td>variable uint</td>
              <td>Length of the name string in bytes.</td>
            </tr>
            <tr>
              <td>
                <code>name</code>
              </td>
              <td>variable bytes</td>
              <td>Yeast name.</td>
            </tr>
          </tbody>
        </table>
        <h3 id="fermstep">
          <a href="#fermstep">Fermentation Step Object</a>
        </h3>
        <p class="diagram">
          <img src={fermStepDiagram} />
        </p>
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Size</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>type</code>
              </td>
              <td>2 bits, value 0-3</td>
              <td>
                One of <code>primary</code>, <code>secondary</code>,{" "}
                <code>tertiary</code>, or <code>aging</code>.
              </td>
            </tr>
            <tr>
              <td>
                <code>temp</code>
              </td>
              <td>6 bits, value 0-63</td>
              <td>Temperature in &deg;C.</td>
            </tr>
            <tr>
              <td>
                <code>duration</code>
              </td>
              <td>variable uint</td>
              <td>Duration in days</td>
            </tr>
          </tbody>
        </table>
        <h2 id="example">
          <a href="#example">Example Recipe</a>
        </h2>
        <p>
          Let's use a New Belgium Fat Tire clone recipe from BYO as an example.
          The{" "}
          <a href="/assets/FatTire.xml">
            BeerXML representation of this recipe
          </a>{" "}
          is 4,388 bytes. First, let's convert it to Brauhaus JSON, which takes
          1,765 bytes pretty printed or 1,116 bytes minified:
        </p>
        <code>
          <pre>{JSON.stringify(fatTire, null, 2)}</pre>
        </code>
        <p>
          Encoding to the custom binary format uses {fatTireBin.byteLength}{" "}
          bytes.
        </p>
        <div class="row gap">
          <code style="width: 70%">
            {new Uint8Array(fatTireBin).reduce(
              (t, x) => t + " " + x.toString(16).padStart(2, "0"),
              ""
            )}
          </code>
          <code style="width: 30%">{new TextDecoder().decode(fatTireBin)}</code>
        </div>
        <p>
          After running deflate with the custom dictionary there are{" "}
          {fatTireDeflate.byteLength} bytes left.
        </p>
        <div class="row gap">
          <code style="width: 70%">
            {fatTireDeflate.reduce(
              (t, x) => t + " " + x.toString(16).padStart(2, "0"),
              ""
            )}
          </code>
          <code style="width: 30%; white-space: wrap; word-break: break-all;">
            {new TextDecoder().decode(fatTireDeflate)}
          </code>
        </div>
        <p>
          Unfortunately those bytes are not safe to use in a URL, so we base64
          encode the result, increasing the size to a final{" "}
          {new TextEncoder().encode(fatTireB64).byteLength} bytes:
        </p>
        <p>
          <A href={"/r/" + fatTireB64}>{fatTireB64}</A>
        </p>
        <h3>Results</h3>
        <p>The following table shows the encoding and compression results:</p>
        <table>
          <thead>
            <tr>
              <th>Format</th>
              <th class="right">Size (bytes)</th>
              <th class="right">Diff</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>BeerXML</td>
              <td class="right">
                <code>4388</code>
              </td>
              <td class="right">
                <code>100.0%</code>
              </td>
            </tr>
            <tr>
              <td>Brauhaus JSON (pretty)</td>
              <td class="right">
                <code>{fatTireJSONPretty.length}</code>
              </td>
              <td class="right">
                <code>
                  {((fatTireJSONPretty.length / 4388) * 100).toFixed(1)}%
                </code>
              </td>
            </tr>
            <tr>
              <td>Brauhaus JSON (minified)</td>
              <td class="right">
                <code>{fatTireJSON.length}</code>
              </td>
              <td class="right">
                <code>{((fatTireJSON.length / 4388) * 100).toFixed(1)}%</code>
              </td>
            </tr>
            <tr>
              <td>Brauhaus JSON (minified+deflate)</td>
              <td class="right">
                <code>{fatTireJSONDeflate.byteLength}</code>
              </td>
              <td class="right">
                <code>
                  {((fatTireJSONDeflate.byteLength / 4388) * 100).toFixed(1)}%
                </code>
              </td>
            </tr>
            <tr>
              <td>Brauhaus JSON (minified+deflate custom dictionary)</td>
              <td class="right">
                <code>{fatTireJSONDictDeflate.byteLength}</code>
              </td>
              <td class="right">
                <code>
                  {((fatTireJSONDictDeflate.byteLength / 4388) * 100).toFixed(
                    1
                  )}
                  %
                </code>
              </td>
            </tr>
            <tr>
              <td>Malt.io format (binary)</td>
              <td class="right">
                <code>{fatTireBin.byteLength}</code>
              </td>
              <td class="right">
                <code>
                  {((fatTireBin.byteLength / 4388) * 100).toFixed(1)}%
                </code>
              </td>
            </tr>
            <tr>
              <td>Malt.io format (binary + deflate custom dict)</td>
              <td class="right">
                <code>{fatTireDeflate.byteLength}</code>
              </td>
              <td class="right">
                <code>
                  {((fatTireDeflate.byteLength / 4388) * 100).toFixed(1)}%
                </code>
              </td>
            </tr>
            <tr style="color: white; background-color: var(--secondary);">
              <td>
                Malt.io recipe URL (binary + deflate custom dict + base64)
              </td>
              <td class="right">
                <code>{fatTireB64.length}</code>
              </td>
              <td class="right">
                <code>{((fatTireB64.length / 4388) * 100).toFixed(1)}%</code>
              </td>
            </tr>
          </tbody>
        </table>
        <p>
          As you can see, the custom recipe format crushes the alternatives for
          our example recipe. Happy brewing! 🍻
        </p>
      </div>
    </article>
  );
};

export default Format;
