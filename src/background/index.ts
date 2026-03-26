import { action, runtime, scripting, type Tabs } from "webextension-polyfill";
import previewerJsUrl from "url:~/previewer.ts";
import downloaderJsUrl from "url:~/downloader.ts";
import mermaidBridgeJsUrl from "url:~/mermaid-bridge.ts";
import fontawesomeCssUrl from "url:~/resources/fontawesome.css";
import { getDownloadSelectorList, getExcludeURL, getMatchSelectorList, watchStorage } from "~core/options";

const isFirefox = !!(globalThis as any).browser;

const actionOnClicked = (_: Tabs.Tab) => {
  (async () => {
    // 打开配置页
    await runtime.openOptionsPage();
  })();
};

if (!action.onClicked.hasListener(actionOnClicked)) {
  // 扩展图标点击事件
  action.onClicked.addListener(actionOnClicked);
}

registerContentScripts().then(_ => {});

// 编程式动态声明
watchStorage(async () => {
  await unregisterAllDynamicContentScripts();

  await registerContentScripts();
});

function getJsFilename(url: string): string {
  return url.substring(url.lastIndexOf("/") + 1, url.lastIndexOf(".")) + ".js";
}

function getCssFilename(url: string): string {
  return url.substring(url.lastIndexOf("/") + 1, url.lastIndexOf(".")) + ".css";
}

async function registerContentScripts() {
  const excludeConfigs = await getExcludeURL();
  const matchSelectors = await getMatchSelectorList();
  const downloadSelectors = await getDownloadSelectorList();

  const excludeMatches = excludeConfigs.flatMap(config => config.match !== undefined ? [config.match] : []);
  const matches = matchSelectors.flatMap(config => config.match !== undefined ? [config.match] : []);
  const downloadMatches = downloadSelectors.flatMap(config => config.match !== undefined ? [config.match] : []);

  console.log(excludeMatches, matches, downloadMatches);

  if (isFirefox) {
    // Firefox: inject mermaid + bridge into MAIN world (Function() is blocked in ISOLATED world)
    await scripting.registerContentScripts([
      {
        id: "mermaid",
        allFrames: true,
        excludeMatches,
        matches,
        js: ["mermaid.min.js"],
        world: "MAIN",
        runAt: "document_start",
      }
    ]);

    await scripting.registerContentScripts([
      {
        id: "mermaid-bridge",
        allFrames: true,
        excludeMatches,
        matches,
        js: [getJsFilename(mermaidBridgeJsUrl)],
        world: "MAIN",
        runAt: "document_start",
      }
    ]);
  } else {
    // Chrome: inject mermaid into ISOLATED world (same as previewer)
    await scripting.registerContentScripts([
      {
        id: "mermaid",
        allFrames: true,
        excludeMatches,
        matches,
        js: ["mermaid.min.js"]
      }
    ]);
  }

  await scripting.registerContentScripts([
    {
      id: "previewer",
      allFrames: true,
      excludeMatches,
      matches,
      js: [getJsFilename(previewerJsUrl)],
      css: [getCssFilename(fontawesomeCssUrl)]
    }
  ]);

  await scripting.registerContentScripts([
    {
      id: "downloader",
      allFrames: true,
      excludeMatches,
      matches: downloadMatches,
      js: [getJsFilename(downloaderJsUrl)],
    }
  ]);
}

async function unregisterAllDynamicContentScripts() {
  try {
    const scripts = await scripting.getRegisteredContentScripts();
    const scriptIds = scripts.map(script => script.id);
    return scripting.unregisterContentScripts({ ids: scriptIds });
  } catch (error) {
    const message = [
      "An unexpected error occurred while",
      "unregistering dynamic content scripts.",
    ].join(" ");
    throw new Error(message, {cause : error});
  }
}
