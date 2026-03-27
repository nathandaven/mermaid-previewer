import { rawDataKey } from "./render";
import { getDiffSelectorList } from "./options";
import type { DiffConfig } from "~types";

const DIFF_PROCESSED_ATTR = "data-mermaid-previewer-diff-processed";

/**
 * Scan diff views for mermaid fenced code blocks using configured selectors.
 * Works for both unified and side-by-side diff views.
 */
export const extractDiffMermaidBlocks = async (
  dom: Document | Element,
): Promise<HTMLElement[]> => {
  const diffConfigs = await getDiffSelectorList();
  if (diffConfigs.length === 0) return [];

  // Check if current URL matches any diff config
  const url = window.location.href;
  const activeConfigs = diffConfigs.filter((c) => matchUrl(url, c.match));
  if (activeConfigs.length === 0) return [];

  const results: HTMLElement[] = [];

  for (const config of activeConfigs) {
    const wrappers = dom.querySelectorAll<HTMLElement>(config.diffSelector);
    wrappers.forEach((wrapper) => {
      if (wrapper.getAttribute(DIFF_PROCESSED_ATTR)) return;

      const codeLines: HTMLElement[] = [];
      const lineWrappers =
        wrapper.querySelectorAll<HTMLElement>(".lines-wrapper");

      lineWrappers.forEach((lw) => {
        const lineWraps = lw.querySelectorAll<HTMLElement>(
          ".line-wrapper[data-qa='code-line']",
        );
        const newSideLine = lineWraps[lineWraps.length - 1];
        if (!newSideLine) return;
        if (newSideLine.classList.contains("type-del")) return;

        const codeDiff = newSideLine.querySelector<HTMLElement>(
          config.codeSelector,
        );
        if (codeDiff) codeLines.push(codeDiff);
      });

      if (codeLines.length === 0) return;

      const fenceOpen = config.fence;
      const fenceClose = "```";
      let inBlock = false;
      let mermaidLines: string[] = [];
      let fenceEndWrapper: HTMLElement | null = null;
      const blocks: { text: string; endEl: HTMLElement }[] = [];

      codeLines.forEach((codeLine) => {
        const lineText = codeLine.textContent || "";
        const linesWrapper = codeLine.closest(".lines-wrapper") as HTMLElement;

        if (!inBlock) {
          if (lineText.trim() === fenceOpen.trim()) {
            inBlock = true;
            mermaidLines = [];
          }
        } else {
          if (lineText.trim() === fenceClose.trim()) {
            inBlock = false;
            fenceEndWrapper = linesWrapper;
            if (mermaidLines.length > 0 && fenceEndWrapper) {
              blocks.push({
                text: mermaidLines.join("\n"),
                endEl: fenceEndWrapper,
              });
            }
          } else {
            mermaidLines.push(lineText.replace(/\n$/, ""));
          }
        }
      });

      blocks.forEach(({ text, endEl }) => {
        const next = endEl.nextElementSibling;
        if (next?.getAttribute(DIFF_PROCESSED_ATTR)) return;

        const container = document.createElement("div");
        container.setAttribute(DIFF_PROCESSED_ATTR, "true");
        container.style.cssText =
          "padding: 16px; background: var(--ds-surface, #fff); border-radius: 4px; margin: 8px 0; overflow: hidden; width: calc(100vw - 100px); max-width: 70vw;";
        container.textContent = text;
        container.setAttribute(rawDataKey, text);

        endEl.insertAdjacentElement("afterend", container);
        results.push(container);
      });

      wrapper.setAttribute(DIFF_PROCESSED_ATTR, "true");
    });
  }

  return results;
};

function matchUrl(url: string, pattern: string): boolean {
  const regex = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  return new RegExp(`^${regex}$`).test(url);
}
