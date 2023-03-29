import { createBrauhaus } from "../../src/brauhaus/partials";
import { load } from "../../src/crush";
import { toBeerXML } from "../../src/brauhaus/xml";

class ElementHandler {
  constructor(ogtag) {
    this.ogtag = ogtag;
  }
  element(element) {
    element.append(this.ogtag, { html: true });
  }
}

export async function onRequest(context) {
  let res = await context.next();

  const recipe = load(context.params.recipe);

  if (context.request.url.endsWith(".json")) {
    return new Response(JSON.stringify(recipe), {
      headers: {
        "content-type": "application/json;charset=UTF-8",
      },
    });
  } else if (context.request.url.endsWith(".xml")) {
    return new Response(toBeerXML(createBrauhaus({}), recipe), {
      headers: {
        "content-type": "application/xml;charset=UTF-8",
      },
    });
  }

  const ogtag = `
    <meta property="og:title" content="${recipe.name}" />
    <meta property="og:description" content="${recipe.description}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${context.request.url}" />
    <meta property="og:image" content="TODO" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${recipe.name}" />
    <meta name="twitter:description" content="${recipe.description}" />
  `;

  return new HTMLRewriter()
    .on("head", new ElementHandler(ogtag))
    .transform(res);
}
