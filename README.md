# Mermaid Previewer (forked)

A Chrome/Firefox extension for previewing and exporting mermaid images in web pages, fully rendering mermaid locally without involving remote api calls.

On websites that meet the preset rules, you can preview or export by setting the code block language in markdown to mermaid:
```mermaid
graph LR
A --> B
```

At the same time, it also provides the function of custom rule configuration.

## What is this fork? 

This fork adds support for Firefox, auto detected dark mode, and adds Bitbucket Pull Requests to the default settings with support for it.

**Chrome**: https://github.com/nathandaven/mermaid-previewer/releases/download/1.5.4/chrome-mv3-prod.zip

**Firefox**: https://github.com/nathandaven/mermaid-previewer/releases/download/1.5.4/firefox-mv3-prod.xpi

<img width="1172" height="734" alt="Screenshot 2026-03-26 at 12 26 38 PM" src="https://github.com/user-attachments/assets/2c8027b1-23e7-4dd9-bfc0-d6cb2784d768" />

Here's a repo where you can test the extension: https://bitbucket.org/marcozaccari2/markdown-diagrams-browser-extension/src/master/doc/examples/mermaid.md


## Preset Rules

- Exclude Urls
  - `https:\/\/.*chrome\.google\.com.*`
  - `chrome:\/\/.*`
  - `chrome-extension:\/\/.*`
- Matching Selectors
  - `div.codehilite > pre` under `.*bitbucket\.org.*`
    - Support Bitbucket preview and export
  - `body > pre` under `file:\/\/.*.mmd` and `file:\/\/.*.mermaid`
    - Support preview and export of `.mmd` and `.mermaid` files
- Download Selectors
  - `div.mermaid-view div.mermaid` under `https:\/\/viewscreen\.githubusercontent\.com.*`
    - Support GitHub export
  - `div#app` under `https:\/\/.*gitlab\.com.*`
    - Support Gitlab export
  - `div.highlight-source-mermaid > pre.notranslate` under `.*gist\.github\.com.*`
    - Support Gist export

