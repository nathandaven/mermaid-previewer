// This script runs in the MAIN world alongside mermaid.min.js.
// It bridges mermaid API calls from the content script (ISOLATED world)
// since mermaid uses Function() which is blocked by Firefox CSP in ISOLATED world.
// Communication uses window.postMessage which works across world boundaries.

const RENDER_ATTR = "data-mermaid-previewer-pending";

window.addEventListener("message", (e: MessageEvent) => {
  if (e.source !== window) return;

  if (e.data?.type === "mermaid-previewer-render") {
    const { securityLevel, renderId, theme } = e.data;
    const mermaid = (window as any).mermaid;
    if (!mermaid) return;

    const nodes = Array.from(document.querySelectorAll<HTMLElement>(`[${RENDER_ATTR}="${renderId}"]`));
    if (nodes.length === 0) {
      window.postMessage({ type: "mermaid-previewer-rendered", renderId }, "*");
      return;
    }

    mermaid.initialize({ securityLevel, startOnLoad: false, theme });

    mermaid
      .run({ nodes })
      .then(() => {
        nodes.forEach((n) => n.removeAttribute(RENDER_ATTR));
        window.postMessage({ type: "mermaid-previewer-rendered", renderId }, "*");
      })
      .catch((err: any) => {
        console.error("mermaid-previewer: render error", err);
        nodes.forEach((n) => n.removeAttribute(RENDER_ATTR));
        window.postMessage({ type: "mermaid-previewer-rendered", renderId }, "*");
      });
  }

  if (e.data?.type === "mermaid-previewer-init") {
    const mermaid = (window as any).mermaid;
    if (mermaid) mermaid.initialize({ startOnLoad: false });
  }
});

// Suppress mermaid auto-render on load
const mermaid = (window as any).mermaid;
if (mermaid) mermaid.initialize({ startOnLoad: false });
