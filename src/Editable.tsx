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
}> = (props) => {
  const onEnter = (e: KeyboardEvent) => {
    if (e.key == "Enter" && e.currentTarget) {
      const td = (e.currentTarget as HTMLInputElement).closest("td");
      const tr = (e.currentTarget as HTMLInputElement).closest("tr");
      console.log(td, tr);
      if (td && tr) {
        const index = Array.prototype.indexOf.call(tr.childNodes, td);
        let next: any = null;
        if (!e.shiftKey) {
          next = tr.nextSibling;
        } else {
          next = tr.previousSibling;
        }
        console.log(index, next);
        console.log(next?.childNodes[index]);
        console.log(next?.childNodes[index].querySelector("input"));
        const input = next?.childNodes[index].querySelector("input");
        input?.focus();
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
          {props.value || props.placeholder}
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
        />
      </div>
    </Show>
  );
};
