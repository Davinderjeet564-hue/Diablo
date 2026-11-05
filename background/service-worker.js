/*  PromptSaver – Background Service Worker
    =========================================
    • Keeps a cached copy of prompts so content scripts can fetch them fast.
    • Listens for storage changes and forwards updates to all tabs.
*/

// Default starter prompt so first-time users see something useful.
const DEFAULT_PROMPTS = [
  {
    id: crypto.randomUUID(),
    name: "Explain",
    trigger: "!E",
    body: "Explain the following text:"
  }
];

// Initialise storage on install.
chrome.runtime.onInstalled.addListener(async () => {
  const { prompts } = await chrome.storage.local.get("prompts");
  if (!prompts || prompts.length === 0) {
    await chrome.storage.local.set({ prompts: DEFAULT_PROMPTS });
  }

  // Default enabled sites
  const { enabledSites } = await chrome.storage.local.get("enabledSites");
  if (!enabledSites) {
    await chrome.storage.local.set({
      enabledSites: [
        "chatgpt.com",
        "chat.openai.com",
        "claude.ai",
        "gemini.google.com",
        "copilot.microsoft.com",
        "poe.com",
        "perplexity.ai"
      ]
    });
  }
});

// Respond to content-script requests.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "GET_PROMPTS") {
    chrome.storage.local.get(["prompts", "enabledSites"]).then(sendResponse);
    return true; // async
  }
});

