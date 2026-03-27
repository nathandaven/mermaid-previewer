import { DocumentCopyFilled } from "@fluentui/react-icons";
import cssText from "data-text:./style.css";
import type { PlasmoCSConfig } from "plasmo";

import { sendToBackground } from "@plasmohq/messaging";
import browser from "webextension-polyfill";

import { rawDataKey } from "~core/render";
import { enableSandbox } from "~core/options";

// noinspection JSUnusedGlobalSymbols
export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true,
};

export const getStyle = () => {
  const style = document.createElement("style");
  style.textContent = cssText;
  return style;
};

const containsFontAwesome = (svgData: string): boolean => {
  return svgData.includes('<i class="fa');
};

// 将base64字符串解析为二进制数据
function base64ToBinary(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}

// 将二进制数据转换为文本
function binaryToText(binaryData: Uint8Array) {
  const decoder = new TextDecoder();
  return decoder.decode(binaryData);
}

function parseDOM(domString: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(domString, "text/html");
  return doc.body.firstChild;
}

const getSvgDataUrl = async () => {
  if (await enableSandbox()) {
    return getSvgDataUrlFromIframe();
  } else {
    return getSvgDataUrlFromSvgDom();
  }
};

const getSvgDataUrlFromIframe = () => {
  // @ts-ignore
  const iframeDom = window.mermaidPreviewerExporterDom;
  if (iframeDom == null) {
    console.warn("Cannot found iframe dom.");
    return;
  }

  try {
    const htmlBase64 = iframeDom.getAttribute("src");
    const base64 = htmlBase64.substring("data:text/html;base64,".length);
    const binary = base64ToBinary(base64);
    const domString = binaryToText(binary);
    const dom = parseDOM(domString) as HTMLElement;

    let svgData = new XMLSerializer().serializeToString(dom);
    console.log("svgData", svgData);

    if (containsFontAwesome(svgData)) {
      const styleIndex = svgData.indexOf("<style>");
      // noinspection JSUnresolvedLibraryURL
      const fontAwesomeCSS =
        '<link xmlns="http://www.w3.org/1999/xhtml" rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" type="text/css"/>';
      svgData = `${svgData.substring(
        0,
        styleIndex,
      )}${fontAwesomeCSS}${svgData.substring(styleIndex)}`;
    }
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);
  } catch (e) {
    let svgData = new XMLSerializer().serializeToString(iframeDom);
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);
  }
};

const getSvgDataUrlFromSvgDom = () => {
  // @ts-ignore
  const svgDom = window.mermaidPreviewerExporterDom;
  if (svgDom == null) {
    console.warn("Cannot found svg dom.");
    return;
  }

  let svgData = new XMLSerializer().serializeToString(svgDom);
  if (containsFontAwesome(svgData)) {
    const styleIndex = svgData.indexOf("<style>");
    // noinspection JSUnresolvedLibraryURL
    const fontAwesomeCSS =
      '<link xmlns="http://www.w3.org/1999/xhtml" rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" type="text/css"/>';
    svgData = `${svgData.substring(
      0,
      styleIndex,
    )}${fontAwesomeCSS}${svgData.substring(styleIndex)}`;
  }
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);
};

const getMermaidRawCode = () => {
  // @ts-ignore
  const svgDom = window.mermaidPreviewerExporterDom;
  if (svgDom == null) {
    console.warn("Cannot found svg dom.");
    return;
  }
  return svgDom.parentElement.getAttribute(rawDataKey);
};

const unescapeHTML = (str) => {
  const doc = new DOMParser().parseFromString(str, "text/html");
  return doc.documentElement.textContent;
};

const svgToJpg = async (svgDataUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const svgText = decodeURIComponent(svgDataUrl.split(",")[1] || "");
    // Parse viewBox to get width/height (4 values: minX minY width height)
    const vbMatch = svgText.match(
      /viewBox="[\d.\-]+\s+[\d.\-]+\s+([\d.]+)\s+([\d.]+)"/,
    );
    const vbW = vbMatch ? parseFloat(vbMatch[1]) : 0;
    const vbH = vbMatch ? parseFloat(vbMatch[2]) : 0;

    const img = new Image();
    img.onload = () => {
      const rawW = vbW || img.naturalWidth || 800;
      const rawH = vbH || img.naturalHeight || 600;
      const maxW = 4000;
      const scale = Math.min(maxW / rawW, 3);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(rawW * scale);
      canvas.height = Math.round(rawH * scale);
      const ctx = canvas.getContext("2d")!;
      const isDark = window.matchMedia?.(
        "(prefers-color-scheme: dark)",
      ).matches;
      ctx.fillStyle = isDark ? "#1f2020" : "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.src = svgDataUrl;
  });
};

const FULLSCREEN_ID = "mermaid-previewer-fullscreen";

const showFullscreen = async () => {
  if (document.getElementById(FULLSCREEN_ID)) return;
  const svgUrl = await getSvgDataUrl();
  if (!svgUrl) return;
  const overlay = document.createElement("div");
  overlay.id = FULLSCREEN_ID;
  const isDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  overlay.style.cssText = `position:fixed;inset:0;z-index:999999;background:${isDark ? "rgba(15,15,15,0.92)" : "rgba(255,255,255,0.92)"};backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;cursor:zoom-out;`;
  const img = document.createElement("img");
  img.src = svgUrl;
  img.style.cssText = "max-width:95vw;max-height:95vh;object-fit:contain;";
  overlay.appendChild(img);
  const close = () => overlay.remove();
  overlay.onclick = close;
  document.addEventListener("keydown", function handler(e) {
    if (e.key === "Escape") {
      close();
      document.removeEventListener("keydown", handler);
    }
  });
  document.documentElement.appendChild(overlay);
};

const ExportButton = () => {
  return (
    <div className={"flex flex-col gap-y-1"}>
      <button
        id={"download"}
        title={"Download SVG"}
        onClick={async () => {
          const url = await getSvgDataUrl();
          browser.runtime
            .sendMessage({
              name: "download",
              body: { url, filename: `${crypto.randomUUID()}.svg` },
            })
            .catch((e) => console.error("download error", e));
        }}
        type="button"
        className="text-xl border box-border border-gray-80 text-gray-100 bg-gray-10 hover:bg-gray-30 rounded">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="1em"
          height="1em"
          viewBox="0 0 24 24">
          <g fill="none">
            <path
              d="M11 6.5a5.5 5.5 0 0 1 5-5.478v5.77l-1.646-1.646a.5.5 0 0 0-.708.708l2.5 2.5a.5.5 0 0 0 .708 0l2.5-2.5a.5.5 0 0 0-.708-.708L17 6.793v-5.77A5.5 5.5 0 1 1 11 6.5zm8.5 3A.5.5 0 0 0 19 9h-5a.5.5 0 0 0 0 1h5a.5.5 0 0 0 .5-.5zM6.25 4h4.248a6.451 6.451 0 0 0-.422 1.5H6.25A1.75 1.75 0 0 0 4.5 7.25V8h5.674c.125.528.314 1.03.558 1.5H4.5V14h4.558c.382 0 .692.31.692.692v.058a2.25 2.25 0 0 0 4.5 0v-.058c0-.382.31-.692.692-.692H19.5v-1.732A6.518 6.518 0 0 0 21 11.19v7.56A3.25 3.25 0 0 1 17.75 22H6.25A3.25 3.25 0 0 1 3 18.75V7.25A3.25 3.25 0 0 1 6.25 4z"
              fill="currentColor"></path>
          </g>
        </svg>
      </button>
      <button
        id={"download-jpg"}
        title={"Download JPG"}
        onClick={async () => {
          const svgUrl = await getSvgDataUrl();
          const jpgUrl = await svgToJpg(svgUrl);
          browser.runtime
            .sendMessage({
              name: "download",
              body: { url: jpgUrl, filename: `${crypto.randomUUID()}.jpg` },
            })
            .catch((e) => console.error("download error", e));
        }}
        type="button"
        className="text-xl border box-border border-gray-80 text-gray-100 bg-gray-10 hover:bg-gray-30 rounded">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="1em"
          height="1em"
          viewBox="0 0 24 24">
          <g fill="none">
            <path
              d="M18 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3zm-6 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM6 19a1 1 0 0 1-1-1v-2.46l3.3-3.3a1 1 0 0 1 1.4 0L14 16.54l2.3-2.3a1 1 0 0 1 1.4 0L19 15.54V18a1 1 0 0 1-1 1H6z"
              fill="currentColor"></path>
          </g>
        </svg>
      </button>
      <button
        id={"copy"}
        title={"copy"}
        onClick={() => {
          const rawCode = getMermaidRawCode();

          navigator.clipboard
            .writeText(unescapeHTML(rawCode))
            .catch((error) => {
              console.error("write to clipboard error", error);
            });
        }}
        type="button"
        className="text-xl border box-border border-gray-80 text-gray-100 bg-gray-10 hover:bg-gray-30 rounded">
        <DocumentCopyFilled width="1em" height="1em" />
      </button>
      <button
        id={"fullscreen"}
        title={"Fullscreen preview"}
        onClick={showFullscreen}
        type="button"
        className="text-xl border box-border border-gray-80 text-gray-100 bg-gray-10 hover:bg-gray-30 rounded">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="1em"
          height="1em"
          viewBox="0 0 24 24">
          <path
            d="M3 3h7v2H5v5H3V3zm11 0h7v7h-2V5h-5V3zM5 14v5h5v2H3v-7h2zm14 0v5h-5v2h7v-7h-2z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  );
};

export default ExportButton;
