import { SetStoreFunction, createStore } from "solid-js/store";
import { useNavigate, useParams } from "@solidjs/router";

import { createRenderEffect } from "solid-js";

export default function createURLStore<T extends object>(
  prefix: string,
  param: string,
  init: () => T,
  load: (value: string) => T,
  save: (value: T) => void
): [T, SetStoreFunction<T>] {
  const params = useParams();
  const navigate = useNavigate();

  // Create the store, loading from the URL param if it exists, otherwise
  // setting the default if there is any. We want a store here so that we
  // get the benefit of individual property reactivity along with the nice
  // convenience setter function.
  const [store, setStore] = createStore<T>(
    params[param] ? load(params[param]) : init()
  );

  if (!params[param]) {
    // Update the initial URL if it was blank.
    navigate(prefix + save(store));
  }

  // Next we need an effect that runs on changes to the URL parameter but
  // doesn't run until it has changed from the initial value. It also needs
  // to ignore changes from calls to `navigate` below.
  let initial = true;
  let fromNavigate = false;
  let fromUrlParam = false;
  createRenderEffect(() => {
    const paramValue = params[param];
    if (initial) return;
    if (fromNavigate) {
      fromNavigate = false;
      return;
    }
    fromUrlParam = !!paramValue;
    setStore(paramValue ? load(paramValue) : init());
  });

  // This is the same but for changes to the store. It shouldn't run initially
  // and should skip running when the URL parameter has changed, e.g. the user
  // hit the back/forward button.
  createRenderEffect(() => {
    if (initial) {
      // Set up reactivity by accessing the fields we care about one time.
      // TODO: Is there some better way to do this?
      save(store);
      return;
    }
    if (fromUrlParam) {
      fromUrlParam = false;
      return;
    }
    fromNavigate = true;
    navigate(prefix + save(store));
  });

  initial = false;

  return [store, setStore];
}
