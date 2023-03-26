import { Component, JSX, Show } from "solid-js";

export const Editable: Component<{
  class?: string;
  show: boolean;
  type: "text" | "number";
  value: number | string;
  oninput?: JSX.EventHandler<HTMLInputElement, Event>;
  onchange?: JSX.EventHandler<HTMLInputElement, Event>;
  prefix?: string;
  prefixShort?: boolean;
  suffix?: string;
  placeholder?: string;
  step?: number;
  min?: number;
  max?: number;
}> = (props) => {
  const onEnter = (e: KeyboardEvent) => {
    if (e.key == "Enter" && e.currentTarget) {
      const row = (e.currentTarget as HTMLInputElement).closest(".row");

      if (row) {
        // Find index of this input within the row
        let index = 0;
        for (let i = 0; i < row.childNodes.length; i++) {
          if (row.childNodes[i].contains(e.currentTarget as HTMLInputElement)) {
            index = i;
            break;
          }
        }

        // Find the next or previous row
        let next: any = null;
        if (!e.shiftKey) {
          if (
            row.nextSibling &&
            (row.nextSibling as HTMLElement).className.indexOf("footer") === -1
          ) {
            next = row.nextSibling?.childNodes[index];
          } else {
            // End of the table, so go to the next one if we can.
            next = (row as any)
              ?.closest(".ingredient")
              .parentNode?.nextSibling?.querySelector(
                ".ingredient .row:not(.header)"
              );
          }
        } else {
          if (
            row.previousSibling &&
            (row.previousSibling as HTMLElement).className.indexOf("header") ===
              -1
          ) {
            next = row.previousSibling?.childNodes[index];
          } else {
            // Beginning of the table, so go to the previous one if we can.
            next = (row as any)
              ?.closest(".ingredient")
              .parentNode?.previousSibling?.querySelector("input:last-of-type")
              ?.focus();
          }
        }
        console.log(index, next);
        console.log(next?.querySelector("input"));
        next?.querySelector("input")?.focus();
      }
    }
  };

  return (
    <Show
      when={props.show}
      fallback={
        <span class={"value " + props.class}>
          <Show when={props.prefix}>
            <span class="prefix short">{props.prefix}</span>
          </Show>
          {props.value || props.placeholder || "0"}
          <Show when={props.suffix}>
            <span class="suffix">{props.suffix ?? ""}</span>
          </Show>
        </span>
      }
    >
      <div
        class={"input " + props.class}
        data-prefix={props.prefix}
        data-prefix-short={props.prefixShort}
        data-suffix={props.suffix}
      >
        <input
          type={props.type}
          value={props.value}
          placeholder={props.placeholder}
          oninput={props.oninput}
          onchange={props.onchange}
          onkeydown={onEnter}
          step={props.step}
          min={props.min}
          max={props.max}
        />
      </div>
    </Show>
  );
};
