/* PromptSaver – Popup Script */

const $list = document.getElementById("promptList");
const $empty = document.getElementById("emptyState");
const $search = document.getElementById("search");
const $quickAdd = document.getElementById("quickAdd");
const $btnAdd = document.getElementById("btnAdd");
const $siteBadge = document.getElementById("siteBadge");
const $siteLabel = document.getElementById("siteLabel");

let allPrompts = [];
let editingId = null; // non-null when editing an existing prompt

/* ---- Data helpers ---- */

async function load() {
  const { prompts } = await chrome.storage.local.get("prompts");
  allPrompts = prompts || [];
  render();
}

async function save() {
  await chrome.storage.local.set({ prompts: allPrompts });
}

/* ---- Site badge ---- */

async function updateSiteBadge() {
  const { enabledSites } = await chrome.storage.local.get("enabledSites");
  const sites = enabledSites || [];

  // Get the active tab's hostname
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) return;
  try {
    const host = new URL(tab.url).hostname.replace(/^www\./, "");
    const active = sites.some((s) => host === s || host.endsWith("." + s));
    $siteBadge.className = "site-badge " + (active ? "active" : "inactive");
    $siteLabel.textContent = active
      ? `Active on ${host}`
      : `Not active on ${host}`;
  } catch {
    // chrome:// or extension pages
  }
}

/* ---- Render list ---- */

function render(filter = "") {
  const q = filter.toLowerCase();
  const filtered = q
    ? allPrompts.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.trigger.toLowerCase().includes(q) ||
          p.body.toLowerCase().includes(q)
      )
    : allPrompts;

  $list.innerHTML = "";
  if (filtered.length === 0) {
    $empty.style.display = "block";
    return;
  }
  $empty.style.display = "none";

  for (const p of filtered) {
    const li = document.createElement("li");
    li.className = "prompt-item";
    li.innerHTML = `
      <div class="prompt-info">
        <div class="prompt-name" title="${esc(p.body)}">${esc(p.name)}</div>
        <span class="prompt-trigger">${esc(p.trigger)}</span>
      </div>
      <div class="prompt-actions">
        <button class="edit" title="Edit" data-id="${p.id}">✏️</button>
        <button class="delete" title="Delete" data-id="${p.id}">🗑️</button>
      </div>`;
    $list.appendChild(li);
  }
}

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

/* ---- Events ---- */

$search.addEventListener("input", () => render($search.value));

$list.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const id = btn.dataset.id;

  if (btn.classList.contains("delete")) {
    allPrompts = allPrompts.filter((p) => p.id !== id);
    await save();
    render($search.value);
  }

  if (btn.classList.contains("edit")) {
    const p = allPrompts.find((p) => p.id === id);
    if (!p) return;
    editingId = id;
    document.getElementById("qaName").value = p.name;
    document.getElementById("qaTrigger").value = p.trigger;
    document.getElementById("qaBody").value = p.body;
    $quickAdd.classList.add("visible");
    $btnAdd.style.display = "none";
  }
});

$btnAdd.addEventListener("click", () => {
  editingId = null;
  document.getElementById("qaName").value = "";
  document.getElementById("qaTrigger").value = "";
  document.getElementById("qaBody").value = "";
  $quickAdd.classList.add("visible");
  $btnAdd.style.display = "none";
  document.getElementById("qaName").focus();
});

document.getElementById("qaCancel").addEventListener("click", closeForm);

document.getElementById("qaSave").addEventListener("click", async () => {
  const name = document.getElementById("qaName").value.trim();
  const trigger = document.getElementById("qaTrigger").value.trim();
  const body = document.getElementById("qaBody").value.trim();
  if (!name || !trigger || !body) return;

  if (editingId) {
    const idx = allPrompts.findIndex((p) => p.id === editingId);
    if (idx !== -1) {
      allPrompts[idx] = { ...allPrompts[idx], name, trigger, body };
    }
  } else {
    allPrompts.push({ id: crypto.randomUUID(), name, trigger, body });
  }

  await save();
  closeForm();
  render($search.value);
});

function closeForm() {
  editingId = null;
  $quickAdd.classList.remove("visible");
  $btnAdd.style.display = "";
}

/* Open full settings page */
document.getElementById("openSettings").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

/* ---- Init ---- */
load();
updateSiteBadge();

