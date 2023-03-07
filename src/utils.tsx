import { Accessor, createEffect, on } from "solid-js";
import { SetStoreFunction, Store, createStore } from "solid-js/store";

export function createURLStore<T extends object>(
  prefix: string,
  marshal: (state: T) => string,
  unmarshal: (state: string) => T,
  init: T
): [Store<T>, SetStoreFunction<T>] {
  let urlState = init;
  if (window.location.pathname.startsWith(prefix)) {
    urlState = unmarshal(window.location.pathname.slice(prefix.length));
  }

  const [state, setState] = createStore<T>(urlState);

  window.onpopstate = (e) => {
    setState(unmarshal(window.location.pathname.slice(prefix.length)));
  };

  createEffect(() => {
    // TODO: any way to avoid marshalling each time to determine if it's time
    // to update the URL?
    const url = prefix + marshal(state);
    if (window.location.pathname !== url) {
      window.history.pushState({}, "", url);
    }
  });

  return [state, setState];
}

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

export function saveSelection<Args extends unknown[]>(
  callback: (...args: Args) => void
): (...args: Args) => void {
  return (...args) => {
    // TODO: save selection
    callback(...args);
    // TODO: restore selection
  };
}
