import { type Mermaid } from "mermaid";
import { queryAndSaveRaw, render, rawDataKey } from "./render";
import { watchDomMutation } from "./mutation";
import { extractDiffMermaidBlocks } from "./diff";
import { HadRenderedKey } from "./selectors";

// const reRenderAll = async () => {
//   // Restore raw code and re-render all previously rendered elements
//   const rendered = document.querySelectorAll<HTMLElement>(`[${rawDataKey}]`);
//   const toRender: HTMLElement[] = [];
//   rendered.forEach((el) => {
//     const raw = el.getAttribute(rawDataKey);
//     if (raw != null) {
//       el.innerHTML = raw;
//       el.removeAttribute(HadRenderedKey);
//       toRender.push(el);
//     }
//   });
//   if (toRender.length > 0) {
//     await render(null, toRender);
//   }
// };

export const preview = async () => {
  console.log("previewRes");
  window.postMessage({ type: "mermaid-previewer-init" }, "*");

  queryAndSaveRaw(document)
    .then(async (domList) => {
      const diffBlocks = await extractDiffMermaidBlocks(document);
      const allBlocks = [...domList, ...diffBlocks];

      await render(null, allBlocks);
      await watchDomMutation(null);

      // Disabling for now - works, but causes errors.
      // Re-render on theme change
      // window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      //  reRenderAll().catch(() => {});
      // });
    })
    .catch((e) => {
      console.error(e);
    });
};
