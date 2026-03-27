import { action, runtime, scripting, downloads, type Tabs } from "webextension-polyfill";
import previewerJsUrl from "url:~/previewer.ts";
import downloaderJsUrl from "url:~/downloader.ts";
import mermaidBridgeJsUrl from "url:~/mermaid-bridge.ts";
import fontawesomeCssUrl from "url:~/resources/fontawesome.css";
import { getDownloadSelectorList, getExcludeURL, getMatchSelectorList, watchStorage } from "~core/options";

const actionOnClicked = (_: Tabs.Tab) => {
  (async () => {
    await runtime.openOptionsPage();
  })();
};

if (!action.onClicked.hasListener(actionOnClicked)) {
  action.onClicked.addListener(actionOnClicked);
}

// Handle download messages directly
runtime.onMessage.addListener((message) => {
  if (message?.name === "download" && message?.body) {
    const { url, filename } = message.body;
    // Firefox blocks data: URLs in downloads.download, convert to blob
    if (url.startsWith("data:") && typeof URL.createObjectURL === "function") {
      return fetch(url)
        .then((r) => r.blob())
        .then((blob) => URL.createObjectURL(blob))
        .then((blobUrl) => downloads.download({ filename, url: blobUrl }))
        .then(() => ({ message: "success" }));
    }
    return downloads.download({ filename, url }).then(() => ({ message: "success" }));
  }
});

registerContentScripts().catch((e) => {
  unregisterAllDynamicContentScripts()
    .then(() => registerContentScripts())
    .catch((e2) => console.error("Failed to register content scripts:", e2));
});

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

  // Inject mermaid + bridge into MAIN world for both Chrome and Firefox
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
