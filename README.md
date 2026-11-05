# PromptSaver ⚡

A lightweight Chromium extension that lets you save frequently used prompts and expand them with short triggers — right inside ChatGPT, Claude, and other AI chat sites.

## Features

- **Save unlimited prompts** with custom names and shortcuts
- **Instant expansion** — type a trigger like `!E` and it becomes your full prompt
- **Works on ChatGPT, Claude, Gemini, Copilot, Poe, Perplexity** and any site you add
- **Private by design** — all data is stored locally in your browser, no account required
- **Import / Export** — back up your prompts as JSON and restore them anywhere
- **Chromium support** — Chrome, Edge, Brave, Opera, Arc, and more

## Quick Start

1. Open `chrome://extensions` (or your browser's equivalent)
2. Enable **Developer mode**
3. Click **Load unpacked** and select this folder
4. Click the PromptSaver icon in the toolbar to add your first prompt
5. Open ChatGPT or Claude, type your trigger, and the full prompt appears!

## Example

| Name    | Trigger | Prompt Text                    |
|---------|---------|--------------------------------|
| Explain | `!E`    | Explain the following text:    |
| Summarize | `!S`  | Summarize this in 3 bullet points: |
| Fix     | `!F`    | Fix the bugs in this code:     |

Type `!E` in the ChatGPT input box → it instantly becomes **"Explain the following text:"**

## How It Works

The extension injects a small content script that listens for `input` events on the active page. When you type a registered trigger at the end of an input field, the trigger text is replaced with the full saved prompt. It works with both standard `<input>`/`<textarea>` elements and `contenteditable` editors (used by ChatGPT, Claude, etc.).

## File Structure

```
promptsaver extension/
├── manifest.json              # Extension manifest (MV3)
├── background/
│   └── service-worker.js      # Initialises defaults, answers content-script queries
├── content/
│   └── content.js             # Watches input fields and expands triggers
├── popup/
│   ├── popup.html             # Toolbar popup UI
│   └── popup.js               # Popup logic
├── options/
│   ├── options.html           # Full settings page
│   └── options.js             # Settings logic (prompts, sites, import/export)
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## Privacy

PromptSaver stores everything in `chrome.storage.local`. No data is ever transmitted to any server. No analytics, no tracking, no accounts.

## License

MIT

