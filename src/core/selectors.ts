import { getMatchSelectorList } from "~core/options";

/**
 * 用于判断是否已被渲染的key，由mermaid jsapi定义
 * @type {string}
 */
export const HadRenderedKey = "data-processed";
export const HadRenderedSelector = `[${HadRenderedKey}=true]`;

const getNotSelector = (selector: string): string => {
  return `:not(${selector})`;
};

const mapSelector = async (selectorSuffix: string): Promise<string> => {
  const matchSelectorList = await getMatchSelectorList();
  return matchSelectorList
    .map((it) => it.selector)
    .map((selector) => {
      selector += selectorSuffix;
      return selector;
    })
    .join(", ");
};

/**
 * 未渲染selector
 * @return string 未渲染selector
 */
export const notRenderSelector = async (): Promise<string> => {
  return await mapSelector(getNotSelector(HadRenderedSelector));
};

/**
 * 已渲染selector
 * @return string 已渲染selector
 */
export const renderedSelector = async (): Promise<string> => {
  return await mapSelector(HadRenderedSelector);
};

/**
 * 匹配符合条件的dom
 * @param dom 从这个dom结点搜索
 * @param selectors dom selector
 * @return NodeList 符合条件的dom结点数组
 */
export const queryContainers = async (
  dom: Document | Element,
  selectors: string,
): Promise<HTMLElement[]> => {
  // console.debug("selectors", selectors)
  if (selectors === "") {
    return [];
  }
  const mermaidDomList = dom.querySelectorAll<HTMLElement>(selectors);
  mermaidDomList.forEach((mermaidDom) => {
    // 去除内部多余的html tag，主要是为了兼容bitbucket
    // Bitbucket PR code blocks have line numbers via CSS ::before on .ds-line-number spans.
    // Skip those spans and extract text only from code content children.
    const rows = mermaidDom.querySelectorAll("[data-ds--code--row]");
    let mermaidText: string;
    if (rows.length > 0) {
      mermaidText = Array.from(rows).map((r) => {
        let line = "";
        r.childNodes.forEach((child) => {
          // Skip line number elements (have class containing "linenumber" or "line-number")
          if (child instanceof HTMLElement &&
              (child.classList.contains("ds-line-number") ||
               child.classList.contains("linenumber") ||
               child.hasAttribute("data-ds--line-number"))) return;
          line += child.textContent || "";
        });
        return line;
      }).join("");
    } else {
      mermaidText = mermaidDom.innerText;
    }
    // 防止Dom based XSS
    mermaidDom.innerHTML = "";
    mermaidDom.textContent = mermaidText;
    // console.debug(
    //   "innerHTML",
    //   mermaidDom.innerHTML,
    //   "textContent",
    //   mermaidDom.textContent
    // )
  });
  return Array.from(mermaidDomList);
};
