const textarea = document.getElementById("note");
const status = document.getElementById("status");
const chatTitleEl = document.getElementById("chatTitle");

let currentChatKey = null;

/* ---------- Auto-height (simple & safe) ---------- */
function autoHeight(el) {
  const maxHeight = 360; // must match CSS max-height
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
}

/* ---------- Get active tab ---------- */
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab?.id) return;

  // Get chat key
  chrome.tabs.sendMessage(tab.id, { type: "GET_CHAT_KEY" }, (res) => {
    if (!res?.chatKey) {
      status.textContent = "Open a ChatGPT or Gemini chat.";
      textarea.disabled = true;
      return;
    }

    currentChatKey = res.chatKey;
    textarea.disabled = false;

    loadNote();

    // Get chat title
    chrome.tabs.sendMessage(tab.id, { type: "GET_CHAT_TITLE" }, (t) => {
      if (t?.title) {
        chatTitleEl.textContent = t.title;
      }
    });
  });
});

/* ---------- Load note ---------- */
function loadNote() {
  chrome.storage.local.get([currentChatKey], (data) => {
    textarea.value = data[currentChatKey] || "";
    autoHeight(textarea);
  });
}

/* ---------- Save note ---------- */
textarea.addEventListener("input", () => {
  if (!currentChatKey) return;

  chrome.storage.local.set({
    [currentChatKey]: textarea.value
  });

  autoHeight(textarea);
});
