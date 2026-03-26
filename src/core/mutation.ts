import { queryAndSaveRaw, rawDataKey, render } from "./render";
import { HadRenderedKey, queryContainers, renderedSelector } from "./selectors";
import { type Mermaid } from "mermaid";

let mermaidPreviewerMutationObserver: MutationObserver | undefined = undefined;

/**
 * 解决bitbucket预览加载问题
 * 加载缓存的原始mermaid，重新进行渲染
 */
const bitbucketPreviewHack = async (
  mermaid: Mermaid | null,
  mutation: MutationRecord,
): Promise<void> => {
  if (
    mutation.target ===
      document.querySelector("div#editor-container.maskable") &&
    mutation.removedNodes.length !== 0
  ) {
    const mermaidDomList = await queryContainers(
      document,
      await renderedSelector(),
    );
    if (mermaidDomList.length !== 0) {
      for (const mermaidDom of mermaidDomList) {
        const rawData = mermaidDom.getAttribute(rawDataKey);
        if (rawData != null) {
          mermaidDom.innerHTML = rawData;
          mermaidDom.removeAttribute(HadRenderedKey);
        }
      }
      await render(mermaid, mermaidDomList);
    }
  }
};

/**
 * dom树改变时触发的回调
 */
const mermaidPreviewerMutationCallback = async (
  mermaid: Mermaid | null,
  mutations: MutationRecord[],
): Promise<void> => {
  for (const mutation of mutations) {
    for (const node of Array.from(mutation.addedNodes)) {
      if (!(node instanceof HTMLElement)) {
        continue;
      }

      const mermaidDomList = await queryAndSaveRaw(node);
      if (mermaidDomList.length !== 0) {
        await render(mermaid, mermaidDomList);
      }
    }

    await bitbucketPreviewHack(mermaid, mutation);
  }
};

/**
 * 监听动态插入的dom，渲染其中符合条件的部分
 */
export const watchDomMutation = async (mermaid: Mermaid | null): Promise<void> => {
  if (mermaidPreviewerMutationObserver != null) {
    mermaidPreviewerMutationObserver.disconnect();
  }

  const mutationObserver = async (
    mutations: MutationRecord[],
  ): Promise<void> => {
    await mermaidPreviewerMutationCallback(mermaid, mutations);
  };

  const observer = new window.MutationObserver(
    mutationObserver as (mutations: MutationRecord[]) => void,
  );
  observer.observe(document, {
    childList: true,
    subtree: true,
  });

  mermaidPreviewerMutationObserver = observer;
};
