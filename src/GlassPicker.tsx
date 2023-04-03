import { Component, For, createEffect, createSignal, onMount } from "solid-js";
import { glasses, names } from "./glasses";

export const GlassPicker: Component<{
  glass: string;
  setGlass: (glass: string) => void;
}> = (props) => {
  return (
    <div
      class="modal"
      onclick={(e) => {
        if (e.target.classList.contains("modal")) history.back();
      }}
    >
      <div class="contents">
        <div class="header">
          <h2>Glass Picker</h2>
        </div>
        <div class="body">
          <div class="row gap wrap">
            <For each={names}>
              {(glass) => (
                <div
                  class="item col"
                  style="width: 108px"
                  onclick={(e) => props.setGlass(glass)}
                >
                  <div style="text-align: center;">
                    {glass.charAt(0).toUpperCase() + glass.slice(1)}
                  </div>
                  <svg
                    class="glass"
                    width="160px"
                    height="160px"
                    style="margin: 0 -26px"
                  >
                    <use href={glasses[glass] + "#img"} />
                  </svg>
                </div>
              )}
            </For>
          </div>
        </div>
        <div class="footer">
          <div class="buttons">
            <button class="warn" onclick={() => history.back()}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
