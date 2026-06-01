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
    els.accountList.innerHTML = '<li class="empty">No accounts yet.</li>';
    return;
  }
  els.accountList.innerHTML = accounts
    .map((a) => {
      const meta = [a.BillingCity, a.Phone, a.Industry].filter(Boolean).join(" · ");
      return `<li>
        <div class="name">${escapeHtml(a.Name)}</div>
        <div class="meta">${escapeHtml(meta || "—")}</div>
      </li>`;
    })
    .join("");
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

els.chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = els.chatInput.value.trim();
  if (!text) return;
  addMsg(text, "user");
  els.chatInput.value = "";
  const typing = addMsg("agent is thinking…", "agent typing");
  try {
    const data = await api("/api/agent/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, conversationId }),
    });
    typing.remove();
    addMsg(data.reply, "agent");
    // The agent may have changed CRM data — refresh the list.
    loadAccounts();
  } catch (e) {
    typing.remove();
    addMsg(e.message, "error");
  }
});

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

loadStatus();
loadAccounts();
