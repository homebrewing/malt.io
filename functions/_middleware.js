import { load } from "../src/crush";

class ElementHandler {
  constructor(ogtag) {
    this.ogtag = ogtag;
  }
  element(element) {
    element.append(this.ogtag, { html: true });
  }
}

export async function onRequest(context) {
  console.log("Running function _middleware...");
  let res = await context.next();

  const recipe = load(
    "Y_etBJeuDCKS3o-ZGBQEeVGkF8jLBXAjeekF-zTGAE54wMvoMiBzBLi4YZUVsOL0YAAA"
  );

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
