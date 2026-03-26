import { mermaidHover } from "~core/hover";

import { notRenderSelector, queryContainers } from "./selectors";
import { enableSandbox } from "~core/options";
import type { Mermaid } from "mermaid";

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

/**
 * 匹配符合条件的dom
 * @param mermaidDomList dom列表
 */
const matchMermaidExp = async (
  mermaidDomList: HTMLElement[],
): Promise<HTMLElement[]> => {
  // 过滤不符合正则的dom
  return Array.from(mermaidDomList).filter((mermaidDom) => {
    // console.debug("" + mermaidDom.innerText)
    return new RegExp(mermaidRegex).test(mermaidDom.innerText.trim());
  });
};

/**
 * 缓存mermaid原始code
 * @param mermaidDomList
 */
const saveRawCode = async (mermaidDomList: HTMLElement[]): Promise<void> => {
  mermaidDomList.forEach((mermaidDom) => {
    // 缓存mermaid原始内容
    mermaidDom.setAttribute(rawDataKey, mermaidDom.innerHTML);
  });
};

/**
 * 查找并保存原始mermaid code
 * @param dom 从这个dom结点搜索
 * @return NodeList 符合条件的dom结点数组
 */
export const queryAndSaveRaw = async (
  dom: Document | Element,
): Promise<HTMLElement[]> => {
  const notRenderSelectors = await notRenderSelector();
  const mermaidDomList = await queryContainers(dom, notRenderSelectors);
  const filteredDomList = await matchMermaidExp(mermaidDomList);
  await saveRawCode(filteredDomList);
  return filteredDomList;
};

/**
 * Check if we're running in Firefox (where mermaid must run in MAIN world)
 */
const isFirefox = typeof navigator !== "undefined" && navigator.userAgent.includes("Firefox");

let renderCounter = 0;

const detectTheme = (): string =>
  window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "default";

/**
 * Render via MAIN world bridge (for Firefox)
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

/**
 * 渲染mermaid图
 */
export const render = async (
  mermaid: Mermaid | null,
  domList: HTMLElement[],
): Promise<void> => {
  const securityLevel = (await enableSandbox()) ? "sandbox" : "strict";

  if (isFirefox) {
    await renderViaBridge(domList, securityLevel);
  } else {
    const theme = detectTheme();
    mermaid!.initialize({ securityLevel, startOnLoad: false, theme });
    try {
      await mermaid!.run({ nodes: domList });
    } catch (e) {
      console.error(e);
    }
  }

  await mermaidHover(domList, false);
};
