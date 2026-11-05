/* PromptSaver – Options Page Script */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

let prompts = [];
let enabledSites = [];
let editingId = null;

const ICONS = {
  edit: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>`,
  delete: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/></svg>`,
  remove: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m18 6-12 12M6 6l12 12"/></svg>`,
};

/* ============ Tabs ============ */
$$(".tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$(".tab").forEach((t) => t.classList.remove("active"));
    $$(".tab").forEach((t) => t.setAttribute("aria-selected", "false"));
    $$(".tab-panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");
    $(`#tab-${btn.dataset.tab}`).classList.add("active");
  });

  btn.addEventListener("keydown", (event) => {
    const tabs = [...$$(".tab")];
    const currentIndex = tabs.indexOf(btn);
    let nextIndex;

    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    else return;

    event.preventDefault();
    tabs[nextIndex].focus();
    tabs[nextIndex].click();
  });
});

/* ============ Toast ============ */
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2000);
}

/* ============ Data ============ */
async function loadAll() {
  const data = await chrome.storage.local.get(["prompts", "enabledSites"]);
  prompts = data.prompts || [];
  enabledSites = data.enabledSites || [];
  renderPrompts();
  renderSites();
}

async function savePrompts() {
  await chrome.storage.local.set({ prompts });
}
async function saveSites() {
  await chrome.storage.local.set({ enabledSites });
}

/* ============ Prompts ============ */
function renderPrompts() {
  const container = $("#promptContainer");
  container.innerHTML = "";

  if (prompts.length === 0) {
    $("#emptyPrompts").style.display = "block";
    return;
  }
  $("#emptyPrompts").style.display = "none";

  for (const p of prompts) {
    const card = document.createElement("div");
    card.className = "card prompt-card";
    card.innerHTML = `
      <div class="info">
        <div class="name">${esc(p.name)}</div>
        <span class="trigger">${esc(p.trigger)}</span>
        <div class="body">${esc(p.body)}</div>
      </div>
      <div class="actions">
        <button class="edit" type="button" data-id="${p.id}" title="Edit prompt" aria-label="Edit prompt">${ICONS.edit}<span>Edit</span></button>
        <button class="delete" type="button" data-id="${p.id}" title="Delete prompt" aria-label="Delete prompt">${ICONS.delete}<span>Delete</span></button>
      </div>`;
    container.appendChild(card);
  }
}

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

/* Add / Edit form */
$("#showAddForm").addEventListener("click", () => {
  editingId = null;
  $("#fName").value = "";
  $("#fTrigger").value = "";
  $("#fBody").value = "";
  $("#addForm").classList.add("visible");
  $("#showAddForm").style.display = "none";
  $("#fName").focus();
});
$("#cancelAdd").addEventListener("click", closeForm);

function closeForm() {
  editingId = null;
  $("#addForm").classList.remove("visible");
  $("#showAddForm").style.display = "";
}

$("#savePrompt").addEventListener("click", async () => {
  const name = $("#fName").value.trim();
  const trigger = $("#fTrigger").value.trim();
  const body = $("#fBody").value.trim();
  if (!name || !trigger || !body) {
    toast("Please fill in all fields.");
    return;
  }

  if (editingId) {
    const idx = prompts.findIndex((p) => p.id === editingId);
    if (idx !== -1) prompts[idx] = { ...prompts[idx], name, trigger, body };
    toast("Prompt updated!");
  } else {
    prompts.push({ id: crypto.randomUUID(), name, trigger, body });
    toast("Prompt saved!");
  }

  await savePrompts();
  closeForm();
  renderPrompts();
});

/* Prompt list actions (delegated) */
$("#promptContainer").addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const id = btn.dataset.id;

  if (btn.classList.contains("delete")) {
    if (!confirm("Delete this prompt?")) return;
    prompts = prompts.filter((p) => p.id !== id);
    await savePrompts();
    renderPrompts();
    toast("Prompt deleted.");
  }

  if (btn.classList.contains("edit")) {
    const p = prompts.find((p) => p.id === id);
    if (!p) return;
    editingId = id;
    $("#fName").value = p.name;
    $("#fTrigger").value = p.trigger;
    $("#fBody").value = p.body;
    $("#addForm").classList.add("visible");
    $("#showAddForm").style.display = "none";
    $("#fName").focus();
  }
});

/* ============ Sites ============ */
function renderSites() {
  const list = $("#siteList");
  list.innerHTML = "";
  for (const s of enabledSites) {
    const li = document.createElement("li");
    li.className = "site-item";
    li.innerHTML = `<span>${esc(s)}</span><button type="button" data-site="${esc(s)}" title="Remove site" aria-label="Remove site">${ICONS.remove}</button>`;
    list.appendChild(li);
  }
}

$("#siteList").addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const site = btn.dataset.site;
  enabledSites = enabledSites.filter((s) => s !== site);
  await saveSites();
  renderSites();
  toast("Site removed.");
});

$("#addSite").addEventListener("click", async () => {
  const val = $("#newSite").value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
  if (!val) return;
  if (enabledSites.includes(val)) {
    toast("Site already in list.");
    return;
  }
  enabledSites.push(val);
  await saveSites();
  $("#newSite").value = "";
  renderSites();
  toast("Site added!");
});

/* ============ Import / Export ============ */
$("#exportBtn").addEventListener("click", async () => {
  const data = await chrome.storage.local.get(["prompts", "enabledSites"]);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "promptsaver-backup.json";
  a.click();
  URL.revokeObjectURL(url);
  toast("Exported!");
});

$("#importBtn").addEventListener("click", () => {
  $("#importFile").click();
});

$("#importFile").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    // Merge prompts (skip duplicates by id)
    if (Array.isArray(data.prompts)) {
      const existingIds = new Set(prompts.map((p) => p.id));
      for (const p of data.prompts) {
        if (!existingIds.has(p.id)) {
          prompts.push(p);
        }
      }
      await savePrompts();
    }

    // Merge sites
    if (Array.isArray(data.enabledSites)) {
      const set = new Set(enabledSites);
      for (const s of data.enabledSites) {
        set.add(s);
      }
      enabledSites = [...set];
      await saveSites();
    }

    renderPrompts();
    renderSites();
    toast("Imported successfully!");
  } catch {
    toast("Invalid file format.");
  }
  e.target.value = "";
});

/* Reset */
$("#resetBtn").addEventListener("click", async () => {
  if (!confirm("This will delete ALL prompts and reset site settings. Continue?")) return;
  await chrome.storage.local.clear();
  prompts = [];
  enabledSites = [];
  renderPrompts();
  renderSites();
  toast("Everything has been reset.");
});

/* ============ Init ============ */
loadAll();

