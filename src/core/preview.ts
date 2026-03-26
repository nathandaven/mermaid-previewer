import { type Mermaid } from "mermaid";
import { queryAndSaveRaw, render } from "./render";
import { watchDomMutation } from "./mutation";

const isFirefox = typeof navigator !== "undefined" && navigator.userAgent.includes("Firefox");

export const preview = async () => {
  console.log("previewRes");

  // On Chrome, mermaid is injected into the same (ISOLATED) world as this script.
  // On Firefox, mermaid runs in MAIN world; we use the bridge via custom events.
  let mermaid: Mermaid | null = null;
  if (!isFirefox) {
    // @ts-ignore
    mermaid = window.mermaid as Mermaid;
    console.log("mermaid", mermaid);
    // 禁止自动render .mermaid类的dom，避免类似github下的报错问题
    mermaid.initialize({ startOnLoad: false });
  } else {
    // Signal MAIN world bridge to suppress auto-render
    window.postMessage({ type: "mermaid-previewer-init" }, "*");
  }

  queryAndSaveRaw(document)
    .then(async (domList) => {
      await render(mermaid, domList);
      await watchDomMutation(mermaid);
    })
    .catch((e) => {
      console.error(e);
    });
};
