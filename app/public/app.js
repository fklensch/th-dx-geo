// Minimal vanilla frontend for the headless concierge demo.

const conversationId = "web-" + Math.random().toString(36).slice(2);

const els = {
  modeBadge: document.getElementById("mode-badge"),
  statusLine: document.getElementById("status-line"),
  accountList: document.getElementById("account-list"),
  createForm: document.getElementById("create-form"),
  chatLog: document.getElementById("chat-log"),
  chatForm: document.getElementById("chat-form"),
  chatInput: document.getElementById("chat-input"),
};

const state = { mock: true, loginUrl: "" };

const ICONS = {
  chevron:
    '<svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
  external:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>',
};

const ensureHttp = (u) => (/^https?:\/\//i.test(u) ? u : "https://" + u);

async function api(path, options) {
  const res = await fetch(path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// --- status ---------------------------------------------------------------
async function loadStatus() {
  try {
    const s = await api("/api/status");
    state.mock = s.mock;
    state.loginUrl = s.loginUrl || "";
    if (s.mock) {
      els.modeBadge.textContent = "MOCK MODE";
      els.modeBadge.classList.remove("live");
      els.statusLine.textContent =
        "Mock mode — serving canned data. Configure app/.env to connect a real Salesforce org.";
    } else {
      els.modeBadge.textContent = "LIVE";
      els.modeBadge.classList.add("live");
      els.statusLine.textContent =
        `Live — Data REST API v${s.apiVersion} · Agent API ${s.agentConfigured ? "configured" : "NOT configured"} · ${s.loginUrl || ""}`;
    }
  } catch (e) {
    els.statusLine.textContent = "Status unavailable: " + e.message;
  }
}

// --- accounts (Layer 1) ---------------------------------------------------
function renderAccounts(accounts) {
  if (!accounts.length) {
    els.accountList.innerHTML =
      '<li class="empty">No accounts yet — add one above or ask the agent.</li>';
    return;
  }
  els.accountList.innerHTML = accounts.map(accountItem).join("");
}

function accountItem(a) {
  const meta = [a.BillingCity, a.Industry].filter(Boolean).join(" · ") || "—";

  const rows = [
    ["City", a.BillingCity ? escapeHtml(a.BillingCity) : null],
    ["Phone", a.Phone ? escapeHtml(a.Phone) : null],
    ["Industry", a.Industry ? escapeHtml(a.Industry) : null],
    ["Website", a.Website
      ? `<a href="${escapeHtml(ensureHttp(a.Website))}" target="_blank" rel="noopener noreferrer">${escapeHtml(a.Website)}</a>`
      : null],
    ["Description", a.Description ? escapeHtml(a.Description) : null],
  ].filter(([, v]) => v);

  const dl = rows.length
    ? rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")
    : '<dd class="detail-empty">No additional fields on this record.</dd>';

  const orgLink =
    !state.mock && state.loginUrl && a.Id
      ? `<a class="btn-link" href="${escapeHtml(state.loginUrl + "/lightning/r/Account/" + a.Id + "/view")}" target="_blank" rel="noopener noreferrer">View in Salesforce ${ICONS.external}</a>`
      : '<span class="detail-note">Open in Salesforce is available in live mode.</span>';

  return `<li class="account" data-id="${escapeHtml(a.Id || "")}">
    <button type="button" class="account-trigger" aria-expanded="false">
      <span class="account-main">
        <span class="account-name">${escapeHtml(a.Name)}</span>
        <span class="account-meta">${escapeHtml(meta)}</span>
      </span>
      ${ICONS.chevron}
    </button>
    <div class="account-detail"><div class="account-detail-inner"><div class="detail-body">
      <dl class="detail-grid">${dl}</dl>
      <div class="detail-actions">${orgLink}</div>
    </div></div></div>
  </li>`;
}

async function loadAccounts() {
  try {
    const { accounts } = await api("/api/accounts");
    renderAccounts(accounts);
  } catch (e) {
    els.accountList.innerHTML = `<li class="empty">Error: ${escapeHtml(e.message)}</li>`;
  }
}

els.createForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = new FormData(els.createForm);
  const body = { Name: form.get("Name"), BillingCity: form.get("BillingCity") || undefined };
  try {
    await api("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    els.createForm.reset();
    loadAccounts();
  } catch (e) {
    alert("Could not create account: " + e.message);
  }
});

// --- agent (Layer 2) ------------------------------------------------------
function addMsg(text, cls) {
  const div = document.createElement("div");
  div.className = "msg " + cls;
  div.textContent = text;
  els.chatLog.appendChild(div);
  els.chatLog.scrollTop = els.chatLog.scrollHeight;
  return div;
}

async function sendToAgent(agentText, displayText) {
  addMsg(displayText || agentText, "user");
  const typing = addMsg("", "agent typing");
  typing.innerHTML = 'Thinking<span class="dots"></span>';
  try {
    const data = await api("/api/agent/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: agentText, conversationId }),
    });
    typing.remove();
    addMsg(data.reply, "agent");
    // The agent may have created/changed records — refresh the list.
    loadAccounts();
  } catch (e) {
    typing.remove();
    addMsg(e.message, "error");
  }
}

els.chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = els.chatInput.value.trim();
  if (!text) return;
  els.chatInput.value = "";
  sendToAgent(text);
});

// --- Call transcript → recommended actions --------------------------------
const SAMPLE_TRANSCRIPT = `Rep: Thanks for hopping on, Maria. So you're opening a new property?
Maria: Yes — the Pacific Crest Hotel, a 140-room boutique hotel in Monterey, California. We go live next spring.
Rep: Congrats! Is it under the same group as your Santa Cruz location?
Maria: Same group, but Pacific Crest is its own entity. Best number for the property is (831) 555-0142, and the website will be pacificcresthotel.com.
Rep: Perfect, I'll get it set up — we don't have Pacific Crest in our system yet.
Maria: Right, it's brand new. Could you also pull up our Santa Cruz account to check the contract end date?
Rep: Will do.`;

function buildTranscriptPrompt(t) {
  return [
    "You are reviewing a sales call transcript for a hotel sales rep.",
    "1) Give a 1–2 sentence summary of the call.",
    "2) Recommend specific CRM actions for the hotel accounts mentioned — e.g. create a new hotel Account (extract the name, city, phone, and website) or look up an existing account.",
    "3) Do NOT create or change anything yet. List the recommended actions and ask me to confirm before you act.",
    "",
    "Transcript:",
    '"""',
    t,
    '"""',
  ].join("\n");
}

const tx = {
  toggle: document.getElementById("transcript-toggle"),
  box: document.getElementById("transcript-box"),
  input: document.getElementById("transcript-input"),
  sample: document.getElementById("transcript-sample"),
  cancel: document.getElementById("transcript-cancel"),
  run: document.getElementById("transcript-run"),
};

function setTranscriptOpen(open) {
  tx.box.hidden = !open;
  tx.toggle.setAttribute("aria-expanded", open ? "true" : "false");
  if (open) tx.input.focus();
}

tx.toggle.addEventListener("click", () => setTranscriptOpen(tx.box.hidden));
tx.cancel.addEventListener("click", () => setTranscriptOpen(false));
tx.sample.addEventListener("click", () => {
  tx.input.value = SAMPLE_TRANSCRIPT;
  tx.input.focus();
});
tx.run.addEventListener("click", () => {
  const t = tx.input.value.trim();
  if (!t) { tx.input.focus(); return; }
  setTranscriptOpen(false);
  tx.input.value = "";
  sendToAgent(
    buildTranscriptPrompt(t),
    "📋 Analyze this call transcript and recommend CRM actions"
  );
});

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

// Expand / collapse account details (event delegation).
els.accountList.addEventListener("click", (e) => {
  const trigger = e.target.closest(".account-trigger");
  if (!trigger || !els.accountList.contains(trigger)) return;
  const li = trigger.closest(".account");
  const open = li.classList.toggle("open");
  trigger.setAttribute("aria-expanded", open ? "true" : "false");
});

// Status first (so account rows know live-vs-mock for the org deep link).
loadStatus().then(loadAccounts);
