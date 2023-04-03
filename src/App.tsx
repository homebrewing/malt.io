import { A, Route, Routes } from "@solidjs/router";
import { Component, Suspense } from "solid-js";

import { Home } from "./Home";
import ccLicense from "./assets/cc-by-sa.svg";
import { createBrauhaus } from "./brauhaus/partials";
import { createLocalStore } from "./utils";
import { lazy } from "solid-js";

const Editor = lazy(() => import("./Editor"));

const About = lazy(() => import("./About"));
const Format = lazy(() => import("./Format"));

const App: Component = () => {
  const [bh, setBh] = createLocalStore("brauhaus", createBrauhaus({}));

  return (
    <div class="page">
      <nav>
        <h1>
          <A href="/">
            Malt<span style="opacity: 0.65">.io</span>
          </A>
        </h1>
        <div class="row">
          <div class="toggle row">
            <input
              id="usMetric"
              type="checkbox"
              checked={bh.units.weight === "kg"}
              oninput={(e) => {
                const metric = (e.target as HTMLInputElement).checked;
                setBh("units", {
                  weight: metric ? "kg" : "lb",
                  volume: metric ? "liters" : "gallons",
                  temperature: metric ? "c" : "f",
                  gravity: metric ? "plato" : "sg",
                  yield: metric ? "percent" : "ppg",
                  color: metric ? "ebc" : "srm",
                });
              }}
              hidden
            />
            <label
              for="usMetric"
              class="btn"
              classList={{ primary: bh.units.weight !== "kg" }}
              style="border-top-right-radius: 0; border-bottom-right-radius: 0"
            >
              US
            </label>
            <label
              for="usMetric"
              class="btn"
              classList={{ primary: bh.units.weight === "kg" }}
              style="border-top-left-radius: 0; border-bottom-left-radius: 0"
            >
              Metric
            </label>
          </div>
          <A href="/r/">
            <span style="color: var(--primary); filter: brightness(1.3)">
              ✚
            </span>{" "}
            New
          </A>
          <A href="/settings">⚙️ Settings</A>
          <A href="/about">👤 About</A>
        </div>
      </nav>
      {/* <Suspense fallback={<article>Loading...</article>}> */}
      <Routes>
        <Route path="/" element={<Home bh={bh} />} />
        <Route
          path="/r/:encoded?/:dialog?"
          element={<Editor bh={bh} setBh={setBh} />}
        />
        <Route
          path="/settings"
          element={<article style="padding: 12px">Coming soon...</article>}
        />
        <Route path="/about" component={About} />
        <Route path="/about/format" component={Format} />
      </Routes>
      {/* </Suspense> */}
      <footer class="col gap">
        <div class="row gap" style="justify-content: space-between">
          <div class="col">
            <span class="header">Software</span>
            <ul>
              <li>
                <a href="https://beersmith.com/">Beersmith</a>
              </li>
              <li>
                <a href="https://www.brewersfriend.com/">Brewer's Friend</a>
              </li>
              <li>
                <a href="https://brewfather.app/">Brewfather</a>
              </li>
            </ul>
          </div>
          <div class="col">
            <span class="header">Stores</span>
            <ul>
              <li>
                <a href="https://austinhomebrew.com/">Austin Homebrew</a>
              </li>
              <li>
                <a href="https://www.midwestsupplies.com/">Midwest Supplies</a>
              </li>
              <li>
                <a href="https://www.morebeer.com/">More Beer</a>
              </li>
              <li>
                <a href="https://www.northernbrewer.com/">Northern Brewer</a>
              </li>
            </ul>
          </div>
          <div class="col">
            <span class="header">Magazines</span>
            <ul>
              <li>
                <a href="https://byo.com/">Brew Your Own</a>
              </li>
              <li>
                <a href="https://beerandbrewing.com/">Craft Beer & Brewing</a>
              </li>
              <li>
                <a href="https://www.homebrewersassociation.org/magazine/zymurgy-online/">
                  Zymurgy
                </a>
              </li>
            </ul>
          </div>
          <div class="col">
            <span class="header">Misc</span>
            <ul>
              <li>
                <A href="/about/format">Recipe Format</A>
              </li>
              <li>
                <a href="https://github.com/homebrewing/malt.io">
                  GitHub Source
                </a>
              </li>
              <li>
                <a href="https://www.beer-analytics.com/">Beer Analytics</a>
              </li>
              <li>
                <a href="https://www.bjcp.org/style/2021/beer/">
                  BJCP Style Guide
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div class="row">
          <a href="https://github.com/homebrewing/malt.io">Open source</a>
          &nbsp;made with ❤ &amp; 🍺 in Seattle
        </div>
        <div class="row">
          {" "}
          <a
            rel="license"
            href="http://creativecommons.org/licenses/by-sa/4.0/"
          >
            <img
              alt="Creative Commons License"
              style="border-width:0"
              width="120"
              height="42"
              src={ccLicense}
            />
          </a>
        </div>
      </footer>
    </div>
  );
};

export default App;
