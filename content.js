function getChatKey() {
  const url = location.href;

  // ChatGPT
  if (url.includes("chatgpt.com") || url.includes("chat.openai.com")) {
    const match = url.match(/\/c\/([a-zA-Z0-9-]+)/);
    if (match) return "chatgpt_" + match[1];
  }

  // Gemini
  if (url.includes("gemini.google.com")) {
    const match = url.match(/\/app\/([a-zA-Z0-9-]+)/);
    if (match) return "gemini_" + match[1];
  }

  return null;
}

function getChatTitle() {
  // ChatGPT title (sidebar active item)
  const chatgptTitle =
    document.querySelector('nav a[aria-current="page"] span') ||
    document.querySelector('h1');

  if (chatgptTitle?.innerText) {
    return chatgptTitle.innerText.trim();
  }

  // Gemini title
  const geminiTitle =
    document.querySelector('header h1') ||
    document.querySelector('[data-test-id="conversation-title"]');

  if (geminiTitle?.innerText) {
    return geminiTitle.innerText.trim();
  }

  return "Chat Notes";
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_CHAT_KEY") {
    sendResponse({ chatKey: getChatKey() });
    return;
  }

  if (msg.type === "GET_CHAT_TITLE") {
    sendResponse({ title: getChatTitle() });
    return;
  }
});
