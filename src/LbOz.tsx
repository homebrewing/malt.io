import { Component, createSignal } from "solid-js";
import { kgToLbOz, lbOzToKg } from "./brauhaus/calculate";

import { Editable } from "./Editable";

export const LbOz: Component<{
  g: number;
  oninput: (grams: number) => void;
  onchange: () => void;
  show: boolean;
}> = (props) => {
  const [converted, setConverted] = createSignal(
    kgToLbOz(props.g / 1000, true)
  );

  return (
    <>
      <div class="lbs right">
        <Editable
          show={props.show}
          type="number"
          value={converted().lb}
          suffix="lb"
          min={0}
          oninput={(e) => {
            console.log("setting lbs");
            setConverted({
              lb: parseInt(e.currentTarget.value || "0"),
              oz: converted().oz,
            });
            props.oninput(
              Math.round(
                lbOzToKg(
                  parseInt(e.currentTarget.value || "0"),
                  converted().oz
                ) * 1000
              )
            );
          }}
          onchange={props.onchange}
        />
      </div>
      <div class="oz right">
        <Editable
          show={props.show}
          type="number"
          value={Math.round(converted().oz)}
          suffix="oz"
          oninput={(e) => {
            let oz = parseInt(e.currentTarget.value || "0");
            let lb = converted().lb + Math.floor(oz / 16);
            if (oz < 0) {
              oz = 16 + (oz % 16);
            } else if (oz > 15) {
              oz = oz % 16;
            }
            setConverted({ lb, oz });
            props.oninput(Math.round(lbOzToKg(lb, oz) * 1000));
          }}
          onchange={props.onchange}
        />
      </div>
    </>
  );
};
