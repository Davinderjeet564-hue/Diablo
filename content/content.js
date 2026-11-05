/*  PromptSaver – Content Script
    ==============================
    Watches editable elements for trigger words and expands them.
    Works with plain <input> / <textarea> AND contenteditable divs
    (ChatGPT, Claude, etc. use contenteditable).
*/

(() => {
  "use strict";

  let prompts = [];
  let enabledSites = [];
  let triggerMap = new Map(); // trigger → body

  /* ---- Bootstrap ---- */
  async function loadPrompts() {
    try {
      const data = await chrome.runtime.sendMessage({ type: "GET_PROMPTS" });
      prompts = data.prompts || [];
      enabledSites = data.enabledSites || [];
      rebuildMap();
    } catch {
      // Extension context may be invalidated on update; silently ignore.
    }
  }

  function rebuildMap() {
    triggerMap.clear();
    for (const p of prompts) {
      if (p.trigger) triggerMap.set(p.trigger, p.body);
    }
  }

  function isSiteEnabled() {
    const host = location.hostname.replace(/^www\./, "");
    return enabledSites.some(
      (s) => host === s || host.endsWith("." + s)
    );
  }

  /* ---- Expansion logic ---- */

  // For <input> and <textarea>
  function expandInInput(el) {
    const val = el.value;
    for (const [trigger, body] of triggerMap) {
      const idx = val.lastIndexOf(trigger);
      if (idx === -1) continue;
      // Only expand if the trigger is at the very end (possibly followed by whitespace)
      const after = val.slice(idx + trigger.length);
      if (after.trim().length > 0) continue;

      const before = val.slice(0, idx);
      el.value = before + body + after;

      // Put cursor right after the expanded text
      const cur = before.length + body.length;
      el.setSelectionRange(cur, cur);

      // Fire input event so frameworks pick up the change
      el.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    }
    return false;
  }

  // For contenteditable elements (ChatGPT, Claude, etc.)
  function expandInContentEditable(el) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;

    // Walk text nodes to find a trigger at the cursor position
    const range = sel.getRangeAt(0);
    const node = range.endContainer;
    if (node.nodeType !== Node.TEXT_NODE) return false;

    const text = node.textContent;
    for (const [trigger, body] of triggerMap) {
      const idx = text.lastIndexOf(trigger);
      if (idx === -1) continue;
      // Trigger must end at or very near the cursor
      const endOfTrigger = idx + trigger.length;
      const afterTrigger = text.slice(endOfTrigger).trim();
      if (afterTrigger.length > 0) continue;

      // Replace trigger text with body
      const before = text.slice(0, idx);
      const after = text.slice(endOfTrigger);
      node.textContent = before + body + after;

      // Move cursor right after body
      const newOffset = before.length + body.length;
      const newRange = document.createRange();
      newRange.setStart(node, newOffset);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);

      // Fire input event so the site reacts
      el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }));
      return true;
    }
    return false;
  }

  /* ---- Event handling ---- */

  function onInput(e) {
    if (!isSiteEnabled()) return;

    const el = e.target;
    if (
      el.tagName === "INPUT" ||
      el.tagName === "TEXTAREA"
    ) {
      expandInInput(el);
    } else if (el.isContentEditable || el.closest("[contenteditable]")) {
      expandInContentEditable(el.closest("[contenteditable]") || el);
    }
  }

  // Use a short debounce to avoid processing every keystroke when typing fast
  let debounceTimer = null;
  function debouncedOnInput(e) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => onInput(e), 120);
  }

  /* ---- Init ---- */
  loadPrompts().then(() => {
    document.addEventListener("input", debouncedOnInput, true);
  });

  // Reload prompts whenever storage changes
  chrome.storage.onChanged.addListener(() => {
    loadPrompts();
  });
})();

