// DOM Elements
const textarea = document.getElementById("note");
const status = document.getElementById("status");
const chatTitleEl = document.getElementById("chatTitle");
const favoriteBtn = document.getElementById("favoriteBtn");
const tabBtns = document.querySelectorAll(".tab-btn");
const tabPanes = document.querySelectorAll(".tab-pane");
const charCount = document.getElementById("charCount");
const wordCount = document.getElementById("wordCount");
const highlightedChatsList = document.getElementById("highlightedChatsList");
const highlightDetailView = document.getElementById("highlightDetailView");
const backToListBtn = document.getElementById("backToList");
const refreshHighlightsBtn = document.getElementById("refreshHighlights");
const favoritesSidebar = document.getElementById("favoritesSidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const favoritesList = document.getElementById("favoritesList");

let currentChatKey = null;
let currentTabId = null;

// Initialize
init();

function init() {
  setupTabSwitching();
  setupSidebarToggle();
  loadFavorites();

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab?.id) {
      status.textContent = "No active tab found";
      return;
    }

    currentTabId = tab.id;

    chrome.tabs.sendMessage(tab.id, { type: "GET_CHAT_KEY" }, (res) => {
      if (chrome.runtime.lastError || !res?.chatKey) {
        status.textContent = "Open a ChatGPT or Gemini chat";
        textarea.disabled = true;
        favoriteBtn.disabled = true;
        return;
      }

      currentChatKey = res.chatKey;
      textarea.disabled = false;
      favoriteBtn.disabled = false;

      loadNote();
      loadFavoriteStatus();

      chrome.tabs.sendMessage(tab.id, { type: "GET_CHAT_TITLE" }, (t) => {
        if (t?.title) {
          chatTitleEl.textContent = t.title;
        }
      });

      status.textContent = "Ready";
    });
  });
}

// Tab Switching
function setupTabSwitching() {
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTab = btn.dataset.tab;

      tabBtns.forEach(b => b.classList.remove("active"));
      tabPanes.forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(targetTab + "Tab").classList.add("active");

      if (targetTab === "highlights") {
        loadHighlightedChats();
      }
    });
  });
}

// Notes Functionality
function loadNote() {
  chrome.storage.local.get([currentChatKey], (data) => {
    textarea.value = data[currentChatKey] || "";
    updateCounts();
  });
}

textarea.addEventListener("input", () => {
  if (!currentChatKey) return;

  chrome.storage.local.set({
    [currentChatKey]: textarea.value
  });

  updateCounts();
});

function updateCounts() {
  const text = textarea.value;
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  charCount.textContent = `${chars} characters`;
  wordCount.textContent = `${words} words`;
}

// Favorites Functionality
function setupSidebarToggle() {
  sidebarToggle.addEventListener("click", () => {
    favoritesSidebar.classList.toggle("collapsed");
  });
}

favoriteBtn.addEventListener("click", toggleFavorite);

function toggleFavorite() {
  if (!currentChatKey) return;

  chrome.storage.local.get(["favorites"], (data) => {
    const favorites = data.favorites || [];
    const index = favorites.findIndex(f => f.chatKey === currentChatKey);

    if (index > -1) {
      favorites.splice(index, 1);
      favoriteBtn.classList.remove("favorited");
      favoriteBtn.textContent = "☆";
      status.textContent = "Removed from favorites";
    } else {
      chrome.tabs.sendMessage(currentTabId, { type: "GET_CHAT_TITLE" }, (t) => {
        favorites.push({
          chatKey: currentChatKey,
          title: t?.title || "Untitled Chat",
          timestamp: Date.now()
        });

        chrome.storage.local.set({ favorites }, () => {
          favoriteBtn.classList.add("favorited");
          favoriteBtn.textContent = "★";
          status.textContent = "Added to favorites";
          loadFavorites();
        });
      });
    }

    if (index > -1) {
      chrome.storage.local.set({ favorites }, loadFavorites);
    }
  });
}

function loadFavoriteStatus() {
  chrome.storage.local.get(["favorites"], (data) => {
    const favorites = data.favorites || [];
    const isFavorited = favorites.some(f => f.chatKey === currentChatKey);

    if (isFavorited) {
      favoriteBtn.classList.add("favorited");
      favoriteBtn.textContent = "★";
    } else {
      favoriteBtn.classList.remove("favorited");
      favoriteBtn.textContent = "☆";
    }
  });
}

function loadFavorites() {
  chrome.storage.local.get(["favorites"], (data) => {
    const favorites = data.favorites || [];

    if (favorites.length === 0) {
      favoritesList.innerHTML = '<div class="empty-state">No favorites yet</div>';
      return;
    }

    favoritesList.innerHTML = favorites.map((fav, index) => `
      <div class="favorite-item" draggable="true" data-index="${index}" data-chat-key="${fav.chatKey}">
        <div class="favorite-item-title">${fav.title}</div>
        <div class="favorite-item-key">${fav.chatKey}</div>
        <button class="favorite-item-remove" data-chat-key="${fav.chatKey}">×</button>
      </div>
    `).join("");

    setupDragAndDrop();
    setupFavoriteRemove();
    setupFavoriteClick();
  });
}

function setupFavoriteClick() {
  document.querySelectorAll(".favorite-item").forEach(item => {
    item.addEventListener("click", (e) => {
      if (e.target.classList.contains("favorite-item-remove")) return;

      const chatKey = item.dataset.chatKey;

      // Try to navigate to this chat
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (!tab) return;

        let url = "";
        if (chatKey.startsWith("chatgpt_")) {
          const id = chatKey.replace("chatgpt_", "");
          url = `https://chatgpt.com/c/${id}`;
        } else if (chatKey.startsWith("gemini_")) {
          const id = chatKey.replace("gemini_", "");
          url = `https://gemini.google.com/app/${id}`;
        }

        if (url) {
          chrome.tabs.update(tab.id, { url });
          status.textContent = "Navigating to chat...";
        }
      });
    });
  });
}

function setupFavoriteRemove() {
  document.querySelectorAll(".favorite-item-remove").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const chatKey = btn.dataset.chatKey;
      removeFavorite(chatKey);
    });
  });
}

function removeFavorite(chatKey) {
  chrome.storage.local.get(["favorites"], (data) => {
    const favorites = data.favorites || [];
    const filtered = favorites.filter(f => f.chatKey !== chatKey);

    chrome.storage.local.set({ favorites: filtered }, () => {
      loadFavorites();
      if (currentChatKey === chatKey) {
        favoriteBtn.classList.remove("favorited");
        favoriteBtn.textContent = "☆";
      }
    });
  });
}

// Drag and Drop for Favorites
let draggedItem = null;

function setupDragAndDrop() {
  const items = document.querySelectorAll(".favorite-item");

  items.forEach(item => {
    item.addEventListener("dragstart", handleDragStart);
    item.addEventListener("dragover", handleDragOver);
    item.addEventListener("drop", handleDrop);
    item.addEventListener("dragend", handleDragEnd);
  });
}

function handleDragStart(e) {
  draggedItem = this;
  this.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";

  const afterElement = getDragAfterElement(favoritesList, e.clientY);
  if (afterElement == null) {
    favoritesList.appendChild(draggedItem);
  } else {
    favoritesList.insertBefore(draggedItem, afterElement);
  }
}

function handleDrop(e) {
  e.stopPropagation();
  return false;
}

function handleDragEnd(e) {
  this.classList.remove("dragging");

  const items = Array.from(document.querySelectorAll(".favorite-item"));
  const newOrder = items.map(item => parseInt(item.dataset.index));

  chrome.storage.local.get(["favorites"], (data) => {
    const favorites = data.favorites || [];
    const reordered = newOrder.map(index => favorites[index]);
    chrome.storage.local.set({ favorites: reordered });
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll(".favorite-item:not(.dragging)")];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Highlights Functionality
refreshHighlightsBtn.addEventListener("click", loadHighlightedChats);
backToListBtn.addEventListener("click", () => {
  highlightDetailView.classList.add("hidden");
  highlightedChatsList.classList.remove("hidden");
});

function loadHighlightedChats() {
  chrome.storage.local.get(null, (data) => {
    const highlightedChats = [];

    for (const key in data) {
      if (key.startsWith("highlights_")) {
        const chatKey = key.replace("highlights_", "");
        const highlights = data[key];

        if (Array.isArray(highlights) && highlights.length > 0) {
          highlightedChats.push({
            chatKey,
            highlights,
            count: highlights.length,
            title: data[`title_${chatKey}`] || chatKey
          });
        }
      }
    }

    if (highlightedChats.length === 0) {
      highlightedChatsList.innerHTML = '<div class="empty-state">No highlighted chats yet</div>';
      return;
    }

    highlightedChatsList.innerHTML = highlightedChats.map(chat => `
      <div class="chat-item" data-chat-key="${chat.chatKey}">
        <div class="chat-item-title">
          ${chat.title}
          <span class="highlight-badge">${chat.count}</span>
        </div>
        <div class="chat-item-count">${chat.count} highlight${chat.count !== 1 ? 's' : ''}</div>
      </div>
    `).join("");

    document.querySelectorAll(".chat-item").forEach(item => {
      item.addEventListener("click", () => {
        showHighlightDetails(item.dataset.chatKey);
      });
    });
  });
}

function showHighlightDetails(chatKey) {
  chrome.storage.local.get([`highlights_${chatKey}`, `title_${chatKey}`], (data) => {
    const highlights = data[`highlights_${chatKey}`] || [];
    const title = data[`title_${chatKey}`] || chatKey;

    document.getElementById("detailChatTitle").textContent = title;

    const highlightsList = document.getElementById("highlightsList");
    highlightsList.innerHTML = highlights.map((h, index) => `
      <div class="highlight-item" data-color="${h.color}">
        <div class="highlight-text">${h.text}</div>
        ${h.note ? `<div class="highlight-note">${h.note}</div>` : ''}
      </div>
    `).join("");

    highlightedChatsList.classList.add("hidden");
    highlightDetailView.classList.remove("hidden");
  });
}

// Request highlight data from content script on tab switch
chrome.tabs.onActivated.addListener(() => {
  if (currentChatKey) {
    requestHighlightSync();
  }
});

function requestHighlightSync() {
  if (!currentTabId) return;

  chrome.tabs.sendMessage(currentTabId, { type: "SYNC_HIGHLIGHTS" }, () => {
    if (chrome.runtime.lastError) {
      // Ignore errors
    }
  });
}
