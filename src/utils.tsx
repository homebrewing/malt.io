import { SetStoreFunction, Store, createStore } from "solid-js/store";

import { createEffect } from "solid-js";

export function createLocalStore<T extends object>(
  name: string,
  init: T
): [Store<T>, SetStoreFunction<T>] {
  const localState = localStorage.getItem(name);
  const [state, setState] = createStore<T>(
    localState ? JSON.parse(localState) : init
  );
  let initial = true;
  createEffect(() => {
    let value = JSON.stringify(state);
    if (initial) {
      console.log("Skipping store write on initial load");
      initial = false;
      return undefined;
    }
    console.log(`Writing store ${name}`);
    localStorage.setItem(name, value);
  });
  return [state, setState];
}

export function removeIndex<T>(array: readonly T[], index: number): T[] {
  return [...array.slice(0, index), ...array.slice(index + 1)];
}
