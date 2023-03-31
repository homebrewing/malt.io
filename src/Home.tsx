import { Component, For, createEffect, createSignal } from "solid-js";

import { Brauhaus } from "./brauhaus/types";
import { RecipeCard } from "./RecipeCard";
import { load } from "./crush";

const recipes = [
  "47jG7w9ZbADe-QKUE4McO5YEXmICDHVgSigGyik5Cr1gZ2IOyCzOARq1go2FDeKd5axMcuATMoEMZrALBdiUWUBBnAChDjCKCEAPl4UfydrCFMCFWI4L5PEB83YSYmiQ8bCNAPpZmAA",
  "49jBBxcAH74uEQzsSACLZ7_UssSURB3IEkMg5bhUQXEF1wxGZrBy8CUMS7p55jHCyhNg0H2J4jNih7peRBTO_CKnBGdvsYQzGYIEkc_xA2cFpuM2AuhnYH6w4QAfWZtfWgIA",
  "49jJ5wY0NATURAYfvi7rB6n90zNLc3VAUxUl4HmqzLxiHQVn_2UOki84uDhgZrzgYeRDDp0l7Bye0GMAVbnXMl5hhAUQsCQQ4M5jCwEdB1lSwGfEhUiPi42EMIK8mMFDFqMVDRkHgbSlmw7v0eCHHggAO575yx4O2Nm2_MwcPMwmAA",
  "42IQhbTgIGMWkPQLlBUOTwQd9AQeeXJx1gGd42QkzB0ouLQzixMSEMDgf9rDyAjRoQHyiubbTkaoJDDOVgjxOEJLWaRQWtTDYY2cXj7oahvxIod28QNGXXZIwio-rMvEBjl5msGDH9YKSwGmD6AXFomyh_IBAA",
  "4zghAGzuJIMOEC8ugRy_LuKaUwnaXaIDOqAMtLRJRyHccY2B5gteXmYUzU8nM6mhhwSw8FzcwcUMcwVDEyM7sF-Tl5-fXaCdxwoaPUxMCOCAhcxndhkE5zBUniGQB-o9sI8YN9sIoJ-LuVGEDwA",
  "4_jA5VRUBD14XSQ8MwVoog78BCkdBf-geQGSK3hnMDKj6HvawcQMs2kFN48krFQBZqOl3TyXGWF8YAmwtI_5Pgdq1SQgsYCRHZptN8hsYWRzLS0CloIL3NihfmfwlYC2h8B5DtmbjJttBNCPyQQA",
  "47KRgLTgIGMWkPQLORlUODwRdNYTePDJxVkHdJSTkTB3guTSzixOSFgAY-BpN6MxLBSA_n_aw8gIMUMD5DnNFdw8fEhBMo-LbQsXInXN72Newo4aEg90jXiRA7_4gRyawAY-DU54tDP4cSFKg0UiLCHsAA",
  "41jECWpRgM9dFwFmsoz8_Gwd0MlkoDVNOgrhjksNJF9wcTGDdYGvXnjczTiPEeZxYIAt6WHxhB39BzKSwYgLkdgCRJB5H5i0kbkMvhLQVg84ZyF7hnG3hQD6YZgA",
  "41gn4l6aCV5DDy2XwUewS8IEdaAnjeiAzhwGNVuWBnCu4J3FyIxizPw-3l3cqEG9pJ3FGBo8i3pZmFES5lxOZjbwwaQgvQLyKWx-4EWHDN6i0FYQuLUAbzwwbrYQQD8Zc6EIHwA",
  "47jMDu08CHvkp6Ynglcf6kBatqW5c5QlV_B4MCPrX9LjwYycKL54s1aw-YEXDQawGwmgZY9iF10uyEAOKNAZ-Djhx5swsAthHv7_gA9ZhY80tFEE7tag9XWY8mx4kI8e3WwjgH565iERthA-AA",
  "45jLhWi2SYKOGwUd8KwD9YcONAdVznHgXNrlxoxwwQp2N2aosSu42fiRvL2Kn00QrQspwDaNkQOYu7NLc1KLGYLFgBk5CXPwg8l2jwDSDQLgsy932wign4n5UIQPAA",
  "k9knBJqtBo3flILOqQYfwC4NWaAPLrx0QNMVJZCj7nUUnB3nrGBKkHzBxcsMNgd8GcOjHsZ9TLCgAIXCkg6-aJDlQIG8JX0c9zlQfbuoi2M1I6KUmd_Dsos7CFK_gGNJINSNHTrF_YFJJoof7bTXAylczsDoAQ1IJuYwBPBAwwLsfcbdNgLoh2gCAA",
  "47gt6pMI2t6okFIK6kyBzpsHncEuGZqXCaxPS1N1wEOuSTmVOtBT5uckC75g52aGmrmJVYIRnMJWckkwIxy4uIOFGeaSFVxMjoh8sbiXKRklzwjwmQugZariAG0NUXjUIpcLDHyc8ANSGGQEMQ55ZGDkgG2aYgiQgbapwAu70Jd8NW62EUA_btOGlSvenOGjOB8A",
]
  .sort(() => (Math.random() > 0.5 ? 1 : -1))
  .map((r) => load(r));

export const Home: Component<{
  bh: Brauhaus;
}> = (props) => {
  const [search, setSearch] = createSignal("");
  const [filteredRecipes, setFilteredRecipes] = createSignal([...recipes]);

  createEffect(() => {
    setFilteredRecipes(
      search()
        ? recipes.filter(
            (r) =>
              r.name.toLowerCase().indexOf(search().toLowerCase()) !== -1 ||
              r.description.toLowerCase().indexOf(search().toLowerCase()) !== -1
          )
        : [...recipes]
    );
  });

  return (
    <article style="padding: 12px">
      <h1 style="text-align: center; font-size: 1000%; margin: 12px; margin-bottom: -28px;">
        Malt<span class="slightly-muted">.io</span>
      </h1>
      <div style="text-align: center; font-size: 240%; margin-bottom: 32px;">
        Recipe Design & Sharing
      </div>
      <div class="row center">
        <input
          type="search"
          placeholder="Search..."
          autofocus
          value={search()}
          oninput={(e) => setSearch(e.currentTarget.value)}
        ></input>
      </div>
      <div class="recipe-cards">
        <For each={filteredRecipes()} fallback={"No matches"}>
          {(recipe) => <RecipeCard bh={props.bh} recipe={recipe} />}
        </For>
      </div>
    </article>
  );
};
