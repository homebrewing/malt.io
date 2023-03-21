import type { Component } from "solid-js";
import fermStepDiagram from "./assets/fermstep.svg?url";
import fermentableDiagram from "./assets/fermentable.svg?url";
import hopDiagram from "./assets/hop.svg?url";
import mashDiagram from "./assets/mash.svg?url";
import miscDiagram from "./assets/misc.svg?url";
import recipeDiagram from "./assets/recipe.svg?url";
import typesDiagram from "./assets/types.svg?url";
import yeastDiagram from "./assets/yeast.svg?url";

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
              <td>Target chlorine ppm.</td>
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
                <code>co2</code>
              </td>
              <td>5 bits, value 0-63</td>
              <td>
                Carbonation CO<sub>2</sub> in volumes.
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
                Step temperature in degrees Celcius, shifted by 25&deg;C so that
                it can represent a range of 25-88&deg;C. For example, a value of{" "}
                <code>43</code> corresponds to <code>68</code>&deg; Celcius.
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
                <code>ratio</code>
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
      </div>
    </article>
  );
};

export default Format;
