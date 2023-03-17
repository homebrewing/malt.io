import { Component, For, createEffect, createSignal, onMount } from "solid-js";

export const StylePicker: Component<{
  styles:
    | Array<{
        title: string;
        styles: Array<{
          title: string;
          stats: {
            OG: [number, number];
            FG: [number, number];
            IBUs: [number, number];
            ABV: [number, number];
            SRM: [number, number];
          };
        }>;
      }>
    | undefined;
  setStyle: (style: number) => void;
}> = (props) => {
  let inputElement: HTMLInputElement;
  onMount(() => {
    inputElement.focus();
  });

  const lookup: { [key: string]: number } = {};

  createEffect(() => {
    if (props.styles) {
      let i = 0;
      props.styles.forEach((category) => {
        category.styles.forEach((style) => {
          lookup[style.title] = i;
          i++;
        });
      });
    }
  });

  const [filter, setFilter] = createSignal("");

  const getFiltered = () => {
    if (!filter()) return props.styles;
    const filtered = props.styles
      ?.map((category) => {
        return {
          ...category,
          styles: category.styles.filter((style) =>
            style.title.toLowerCase().includes(filter().toLowerCase())
          ),
        };
      })
      .filter((category) => category.styles.length > 0);
    return filtered;
  };

  return (
    <div
      class="modal"
      onclick={(e) => {
        if (e.target.classList.contains("modal")) history.back();
      }}
    >
      <div class="contents">
        <div class="header">
          <h2>BJCP Style Picker</h2>
        </div>
        <div class="body">
          <input
            ref={inputElement!}
            type="text"
            placeholder="Search for a style"
            value={filter()}
            oninput={(e) => setFilter(e.currentTarget.value)}
          />
          <ol>
            <For each={getFiltered()} fallback={"No matches"}>
              {({ title, styles }) => (
                <>
                  <li class="category">{title}</li>
                  <For each={styles}>
                    {(style) => (
                      <li
                        onclick={() => props.setStyle(lookup[style.title] || 0)}
                      >
                        {style.title}
                      </li>
                    )}
                  </For>
                </>
              )}
            </For>
          </ol>
        </div>
        <div class="footer">
          <div class="buttons">
            <button onclick={() => props.setStyle(0)}>No style</button>
            <button class="warn" onclick={() => history.back()}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
