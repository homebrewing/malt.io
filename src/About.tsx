import { A } from "@solidjs/router";
import type { Component } from "solid-js";

const About: Component = () => {
  return (
    <article style="padding: 12px">
      <div style="container-type: inline-size; max-width: 800px; margin: auto;">
        <h2>About</h2>
        <p>
          Malt.io is a free open source beer recipe designer/calculator and
          recipe sharing website.
        </p>
        <p>
          Please{" "}
          <a href="https://github.com/homebrewing/malt.io/issues">
            Report an issue
          </a>{" "}
          if something isn't working properly.
        </p>
        <h2>Tenets</h2>
        <div class="tenets row gap">
          <div class="col">
            <h1 class="tenet">
              Free <u>forever</u>
            </h1>
          </div>
          <div class="col">
            <h1 class="tenet">
              <u>You</u> own the recipe
            </h1>
          </div>
          <div class="col">
            <h1 class="tenet">
              A link <u>is</u> a recipe
            </h1>
          </div>
        </div>
        <h2>How It Works</h2>
        <p>
          The most important thing to understand about Malt.io is that the URL
          you see in your browser <strong>is the recipe</strong>. That link
          contains all the information needed to display the recipe on the page.
          General usage would look something like:
        </p>
        <ol>
          <li>Create a new recipe</li>
          <li>Edit the recipe as you see fit</li>
          <li>Save the recipe (i.e. turn off edit mode)</li>
          <li>Copy and paste the link anywhere you like</li>
        </ol>
        <p>
          The link you copied is the recipe. You can share it with anyone, and
          they can view and edit however they like (creating a new unique link
          for their edited recipe in the process). You can also bookmark the
          link, and it will always be there for you to view and edit.
        </p>
        <h2>Interesting Properties of Malt.io</h2>
        <p>
          Since Malt.io is a pretty unique homebrewing site concept, there are
          some interesting properties that come with it:
        </p>
        <ul>
          <li>
            Recipe links are immutable (and cacheable) - any edit creates a new
            link
          </li>
          <li>
            Recipe links can be generated <i>by other software</i> at any time
          </li>
          <li>
            Other software can easily import recipe links, just like BeerXML
          </li>
          <li>
            There is no way to "list all recipes" as there is no database!
          </li>
          <li>
            Web crawlers will find publicly shared recipes and those will show
            in search results
          </li>
          <li>
            Malt.io is a static highly cacheable website so it's <i>fast</i>
          </li>
        </ul>
        <h2>Technology</h2>
        <h3>Recipe URLs</h3>
        <p>
          A combination of several techniques are used to make compact recipe
          URLs possible:
        </p>
        <ul>
          <li>
            A novel concise{" "}
            <A href="/about/format">binary beer recipe format</A>
            <ul>
              <li>Integer and fixed-point based numbers, no floats!</li>
              <li>
                VLQ/VarInt encoding of numbers (smaller numbers take fewer
                bytes)
              </li>
              <li>
                Number scaling via bit-packed units (e.g. kg vs. g vs. lb)
              </li>
              <li>Bit packing of enum values</li>
              <li>
                Bit-packed presets of common values (e.g. 60 min hop addition)
              </li>
              <li>
                Difference coding (e.g. boil size is usually close to batch
                size)
              </li>
            </ul>
          </li>
          <li>
            Deflate
            <ul>
              <li>
                LZ77 with a custom dictionary of thousands of brewing
                ingredients
              </li>
              <li>Huffman coding</li>
            </ul>
          </li>
          <li>Base64 encoding for use in URLs</li>
        </ul>
        <p>
          All of the above takes about 1-5ms to decode a recipe from a link.
        </p>
        <h4>Encoding Example</h4>
        <p>
          For a simple example, you can support arbitrary user-input values
          while still compressing common ones. Let's say you want to store a
          recipe type (all grain, partial mash, or extract) and the serving size
          in ml.
        </p>
        <p>
          A naive implementation would use one byte for the type, and two bytes
          for the serving size (e.g. 100ml to 1000ml). Total cost: 3 bytes.
        </p>
        <p>
          A more compact approach would be to use 2 bits for the type, and
          several bits for known common serving sizes (e.g. 300ml, 330ml, 355ml,
          500ml, etc). If the serving size is one of the known ones, those bits
          are set in the same byte and the total storage cost is one byte. If it
          is some other value, then we encode a VLQ/VarInt after the first byte.
          Total cost: 1-3 bytes with 1 being the most common.
        </p>
        <p>
          For most recipes, we have now saved 66% of the storage cost for those
          two values!
        </p>
        <h4>Recipe Format Description</h4>
        <p>
          For information on implementing the recipe format, see the{" "}
          <a href="/about/format">technical recipe format specification</a>{" "}
          documentation.
        </p>
        <h3>Tech Stack</h3>
        <p>
          The backend is powered by{" "}
          <a href="https://pages.dev/">Cloudflare Pages</a>, mostly as a static
          file CDN to deliver fast access speeds anywhere in the world.
          Everything else runs client-side in the browser using{" "}
          <a href="https://www.solidjs.com/">Solid.js</a> and{" "}
          <a href="https://www.typescriptlang.org/">TypeScript</a>. The one
          exception is some social sharing functionality provided by Cloudflare
          edge functions to get pretty previews, which is only necessary because
          we can't do it client-side.
        </p>
        <p>
          The site's code is{" "}
          <a href="https://github.com/homebrewing/malt.io">hosted on Github</a>{" "}
          in the <code>homebrewing</code> organization and multiple people have
          access. Anytime a new commit is made it auto-deploys worldwide within
          a few seconds.
        </p>
        <h2>Links</h2>
        <ul>
          <li>
            <a href="https://github.com/homebrewing/malt.io">
              GitHub source code
            </a>
          </li>
          <li>
            <a href="https://github.com/homebrewing/malt.io/issues">
              Report an issue
            </a>
          </li>
        </ul>
      </div>
    </article>
  );
};

export default About;
