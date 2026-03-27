# Mermaid Previewer (forked)

A Chrome/Firefox extension for previewing and exporting mermaid images in web pages, fully rendering mermaid locally without involving remote api calls.

On websites that meet the preset rules, you can preview or export by setting the code block language in markdown to mermaid:
```mermaid
graph LR
A --> B
```

At the same time, it also provides the function of custom rule configuration. This is a fork of <https://www.github.com/zephyraft/mermaid-previewer>. Thank you to @zephyraft!

## What is this fork? 

This fork adds support for Firefox, auto detected dark mode, Bitbucket Pull Request rendering (description + diff views), and configurable diff selectors. Wanted this as we use Bitbucket at work, and while GitHub can render Mermaid, why can't bitbucket? This existing extension already did a great job at normal rendering ut needed some work to get it working in PR's and in the Diff view.

**Chrome**: https://github.com/nathandaven/mermaid-previewer/releases/download/1.6.0/chrome-mv3-prod.zip

**Firefox**: https://github.com/nathandaven/mermaid-previewer/releases/download/1.6.0/firefox-mv3-prod.xpi

<img width="1172" height="734" alt="Screenshot 2026-03-26 at 12 26 38PM" src="https://github.com/user-attachments/assets/2c8027b1-23e7-4dd9-bfc0-d6cb2784d768" />

Here's a repo where you can test the extension: <https://bitbucket.org/marcozaccari2/markdown-diagrams-browser-extension/src/master/doc/examples/mermaid.md>

## Fork Changes

- **Firefox Support**: Mermaid runs in the page's MAIN world to avoid Firefox CSP restrictions on `Function()` in content scripts. A bridge script handles cross-world communication via `postMessage`.
- **Dark Mode**: Automatically detects `prefers-color-scheme: dark` and uses mermaid's dark theme.
- **Bitbucket PR Description Rendering**: Renders mermaid in PR description code blocks.
- **Diff View Rendering**: Extracts mermaid from ` ```mermaid ` fenced code blocks in git diff views and renders diagrams inline below the code fence. Works with both unified and side-by-side diffs.
- **Configurable Diff Selectors**: Diff rendering is configurable in the extension settings page with match patterns, diff wrapper selectors, code line selectors, and fence markers. Default config targets Bitbucket pull request diffs.
- **Download JPG**: Adds a download JPG button in addition to the Download SVG button.
- **Fullscreen view**: Adds a fullscreen button to see it in fullscreen.

## Preset Rules

- Exclude Urls
  - `https://chromewebstore.google.com/*`
- Matching Selectors
  - `div.codehilite > pre` under `*://bitbucket.org/*`
    - Support Bitbucket preview and export
  - `#pull-request-description-panel [data-ds--code--code-block] > code` under `*://bitbucket.org/*`
    - Support Bitbucket PR description mermaid rendering
  - `body > pre` under `file:///*.mmd` and `file:///*.mermaid`
    - Support preview and export of `.mmd` and `.mermaid` files
- Download Selectors
  - `div.mermaid-view div.mermaid` under `https://viewscreen.githubusercontent.com/markdown/mermaid*`
    - Support GitHub export
  - `div#app` under `https://gitlab.com/-/sandbox/mermaid`
    - Support Gitlab export
- Diff Selectors
  - `.bitkit-diff-wrapper-diff` with `.code-diff` under `*://bitbucket.org/*/pull-requests/*`
    - Renders mermaid diagrams found in Bitbucket PR diff views
    - Honestly IDK if this configuration will allow for other sites like Github. but, have it here for testing. Feel free to PR for that.
