import { Brauhaus, Recipe } from "./types";
import { ebcToSrm, srmToLovibond } from "./calculate";

import styles from "../assets/bjcp2021.json";

function fermentableType(name: string): string {
  if (/lme|liquid|extract/i.test(name)) {
    return "extract";
  } else if (/dme|dry/i.test(name)) {
    return "dry extract";
  } else if (/candi|candy|honey|sugar|syrup|molasses/i.test(name)) {
    return "sugar";
  }

  return "grain";
}

export function toBeerXML(bh: Brauhaus, recipe: Recipe): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>';
  xml += "<recipes><recipe>";
  xml += "<name>" + recipe.name + "</name>";
  xml += "<version>1</version>";
  xml += "<notes>" + recipe.description + "</notes>";
  xml += "<type>" + recipe.type + "</type>";
  xml += "<batch_size>" + recipe.batchSize + "</batch_size>";
  xml += "<boil_size>" + recipe.boilSize + "</boil_size>";
  xml += "<efficiency>" + 75 + "</efficiency>";
  xml += "<carbonation>" + recipe.carbonation + "</carbonation>";

  let pos = 0;
  let found = false;
  for (let category of styles) {
    for (let style of category.styles) {
      if (pos === recipe.style) {
        let parts = /([0-9]+)([A-Z])\. (.*)/.exec(style.title);

        let type = "ale";
        if (recipe.yeasts.length > 0) {
          type = recipe.yeasts[0].type;
        }

        if (parts && parts.length > 2) {
          xml += `<style><version>1</version><style_guide>BJCP</style_guide><category>${category.title.substr(
            parts[1].length + 2
          )}</category><category_number>${
            parts[1]
          }</category_number><style_letter>${
            parts[2]
          }</style_letter><type>${type}</type><name>${parts[3]}</name><og_min>${
            style.stats.OG[0]
          }</og_min><og_max>${style.stats.OG[1]}</og_max><fg_min>${
            style.stats.FG[0]
          }</fg_min><fg_max>${style.stats.FG[1]}</fg_max><ibu_min>${
            style.stats.IBUs[0]
          }</ibu_min><ibu_max>${style.stats.IBUs[1]}</ibu_max><color_min>${
            style.stats.SRM[0]
          }</color_min><color_max>${style.stats.SRM[1]}</color_max></style>`;
          found = true;
          break;
        }
      }
      pos++;
    }
    if (found) {
      break;
    }
  }

  xml +=
    "<fermentables>" +
    recipe.fermentables
      .map((f) => {
        return `<fermentable><version>1</version><name>${
          f.name
        }</name><type>${fermentableType(f.name.toLowerCase())}</type><weight>${
          f.grams / 1000
        }</weight><yield>${f.percentYield}</yield><color>${srmToLovibond(
          ebcToSrm(f.ebc)
        ).toFixed(1)}</color></fermentable>`;
      })
      .join("") +
    "</fermentables>";

  xml +=
    "<hops>" +
    recipe.hops
      .map((h) => {
        return `<hop><version>1</version><name>${h.name}</name><alpha>${
          h.aa
        }</alpha><amount>${h.grams / 1000}</amount><use>${h.use}</use><time>${
          h.time
        }</time><form>${h.form}</form></hop>`;
      })
      .join("") +
    "</hops>";

  xml +=
    "<miscs>" +
    recipe.miscs
      .map((m) => {
        let amount = m.amount;
        let weight = false;
        switch (m.units) {
          case "g":
            amount = m.amount / 1000;
            weight = true;
            break;
          case "ml":
            amount = m.amount / 1000;
            break;
          case "tsp":
            amount = (m.amount * 4.92892) / 1000;
            break;
          case "tbsp":
            amount = (m.amount * 14.7868) / 1000;
            break;
          case "mg/l":
            // Convert to kg scaled by the number of liters in the batch.
            amount = (m.amount / 1000 / 1000) * recipe.batchSize;
            weight = true;
            break;
        }
        return `<misc><version>1</version><name>${
          m.name
        }</name><type>other</type><use>${m.use}</use><time>${
          m.time
        }</time><amount>${amount}</amount>${
          weight ? "<amount_is_weight>true</amount_is_weight>" : ""
        }</misc>`;
      })
      .join("") +
    "</miscs>";

  xml +=
    "<yeasts>" +
    recipe.yeasts
      .map((y) => {
        let amount = 0;
        switch (y.units) {
          case "pkt":
            // Dry packets are usually 11g, liquid are 100-150ml.
            amount = y.form === "dry" ? 0.011 : 0.125;
            break;
          default:
            // Amount in kg or l instead of g or ml.
            amount = y.amount / 1000;
        }
        return `<yeast><version>1</version><name>${y.name}</name><type>${
          y.type
        }</type><form>${
          y.form
        }</form><amount>${amount}</amount><amount_is_weight>${
          y.form === "dry"
        }</amount_is_weight><attenuation>${
          y.attenuation
        }</attenuation></yeast>`;
      })
      .join("") +
    "</yeasts>";

  if (
    recipe.water.ca ||
    recipe.water.na ||
    recipe.water.cl ||
    recipe.water.mg ||
    recipe.water.so4 ||
    recipe.water.hco3
  ) {
    xml += `<water><version>1</version><calcium>${recipe.water.ca}</calcium><bicarbonate>${recipe.water.hco3}</bicarbonate><sulfate>${recipe.water.so4}</sulfate><chloride>${recipe.water.cl}</chloride><sodium>${recipe.water.na}</sodium><magnesium>${recipe.water.mg}</magnesium></water>`;
  }

  if (recipe.type !== "extract") {
    xml +=
      "<mash><version>1</version><grain_temp>21</grain_temp><mash_steps>" +
      recipe.mashSteps
        .map((m, i) => {
          let typ = "<type>temperature</type>";
          if (
            i === 0 ||
            m.waterGrainRatio !== recipe.mashSteps[i - 1].waterGrainRatio
          ) {
            typ = `<type>infusion</type><infuse_amount>${m.waterGrainRatio}</infuse_amount>`;
          }

          let ramp = "";
          if (m.rampTime > 0) {
            ramp = `<ramp_time>${m.rampTime}</ramp_time>`;
          }

          return `<mash_step><version>1</version><name>${
            m.name
          }</name>${typ}<step_time>${
            m.duration
          }</step_time><step_temp>${m.temperature.toFixed(
            1
          )}</step_temp>${ramp}</mash_step>`;
        })
        .join("") +
      "</mash_steps></mash>";
  }

  for (let s of recipe.fermentationSteps) {
    let age: string = s.type + "_age";
    let temp: string = s.type + "_temp";
    if (s.type == "aging") {
      age = "age";
      temp = "age_temp";
    }
    xml += `<${age}>${s.duration}</${age}><${temp}>${s.temperature.toFixed(
      1
    )}</${temp}>`;
  }

  xml += "</recipe></recipes>";

  return xml;
}
