import { Component, JSX, Show, createEffect } from "solid-js";

export const StyleValue: Component<{
  label: string;
  min: number;
  max: number;
  value: number;
  precision?: number;
  suffix?: string;
  altFunc?: (value: number) => string | number;
  altSuffix?: string;
}> = (props) => {
  const format = (value: number) => {
    if (props.precision) {
      return value.toFixed(props.precision);
    }
    return Math.round(value);
  };

  const getStyle = () => {
    const pct = Math.min(
      102,
      Math.max(-2, ((props.value - props.min) / (props.max - props.min)) * 100)
    );

    const s: any = {};

    if (pct < 50) {
      s["border-left"] = "4px solid var(--color-link)";
      s.left = `${pct.toFixed(1)}%`;
    } else {
      s["border-right"] = "4px solid var(--color-link)";
      s.right = `${(100 - pct).toFixed(1)}%`;
    }

    return s;
  };

  return (
    <div
      class="style-value row"
      classList={{
        invalid: props.value < props.min || props.value > props.max,
      }}
    >
      <div class="label">{props.label}</div>
      <div class="range row grow">
        <div class="current" style={getStyle()}>
          {format(props.value)}
          <span class="suffix">{props.suffix}</span>
          <Show when={props.altFunc}>
            <span class="slightly-muted">
              ({props.altFunc?.(props.value)} {props.altSuffix})
            </span>
          </Show>
        </div>
        <div class="min slightly-muted">
          {format(props.min)}
          <span class="suffix">{props.suffix}</span>
          <Show when={props.altFunc}>
            ({props.altFunc?.(props.min)}
            <span class="suffix">{props.altSuffix}</span>)
          </Show>
        </div>
        <div class="max slightly-muted">
          {format(props.max)}
          <span class="suffix">{props.suffix}</span>
          <Show when={props.altFunc}>
            ({props.altFunc?.(props.max)}
            <span class="suffix">{props.altSuffix}</span>)
          </Show>
        </div>
      </div>
    </div>
  );
};
