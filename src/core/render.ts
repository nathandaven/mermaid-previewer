import { mermaidHover } from "~core/hover";

import { notRenderSelector, queryContainers } from "./selectors";
import { enableSandbox } from "~core/options";

/**
 * 用于保存原始mermaid code的key
 */
export const rawDataKey: string = "data-mermaid-previewer-raw";

const RENDER_ATTR = "data-mermaid-previewer-pending";

/**
 * mermaid图表正则匹配
 */
const mermaidRegex: RegExp =
  /^\s*(graph\s+\w{2}|graph|graph\s+.|flowchart\s+\w{2}|flowchart|flowchart\s+.|sequenceDiagram|classDiagram|stateDiagram-v2|stateDiagram|erDiagram|journey|gantt|pie|pie\s+showData|pie\s+title\s.+|quadrantChart|requirementDiagram|gitGraph|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment|mindmap|timeline|zenuml|sankey-beta|xychart-beta|block-beta|packet-beta|kanban|architecture-beta)\s*\n/gm;

const matchMermaidExp = async (
  mermaidDomList: HTMLElement[],
): Promise<HTMLElement[]> => {
  return Array.from(mermaidDomList).filter((mermaidDom) => {
    return new RegExp(mermaidRegex).test(mermaidDom.innerText.trim());
  });
};

const saveRawCode = async (mermaidDomList: HTMLElement[]): Promise<void> => {
  mermaidDomList.forEach((mermaidDom) => {
    mermaidDom.setAttribute(rawDataKey, mermaidDom.innerHTML);
  });
};

export const queryAndSaveRaw = async (
  dom: Document | Element,
): Promise<HTMLElement[]> => {
  const notRenderSelectors = await notRenderSelector();
  const mermaidDomList = await queryContainers(dom, notRenderSelectors);
  const filteredDomList = await matchMermaidExp(mermaidDomList);
  await saveRawCode(filteredDomList);
  return filteredDomList;
};

let renderCounter = 0;

const detectTheme = (): string =>
  window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "default";

/**
 * Render via MAIN world bridge using postMessage
 */
const renderViaBridge = async (
  domList: HTMLElement[],
  securityLevel: string,
): Promise<void> => {
  const renderId = String(++renderCounter);
  domList.forEach((el) => el.setAttribute(RENDER_ATTR, renderId));

  return new Promise<void>((resolve) => {
    const handler = (e: MessageEvent) => {
      if (e.source === window && e.data?.type === "mermaid-previewer-rendered" && e.data?.renderId === renderId) {
        window.removeEventListener("message", handler);
        resolve();
      }
    };
    window.addEventListener("message", handler);
    window.postMessage({ type: "mermaid-previewer-render", securityLevel, renderId, theme: detectTheme() }, "*");
  });
};

export const render = async (
  _mermaid: unknown,
  domList: HTMLElement[],
): Promise<void> => {
  const securityLevel = (await enableSandbox()) ? "sandbox" : "strict";
  await renderViaBridge(domList, securityLevel);
  await mermaidHover(domList, false);
};
