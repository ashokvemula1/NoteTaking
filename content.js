// Utility Functions
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

// Message Listener
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_CHAT_KEY") {
    sendResponse({ chatKey: getChatKey() });
    return;
  }

  if (msg.type === "GET_CHAT_TITLE") {
    sendResponse({ title: getChatTitle() });
    return;
  }

  if (msg.type === "SYNC_HIGHLIGHTS") {
    loadHighlights();
    sendResponse({ success: true });
    return;
  }
});

// ========================================
// TEXT HIGHLIGHTING FEATURE
// ========================================

let highlights = [];
let currentHighlightIndex = -1;
const COLORS = {
  yellow: '#ffd700',
  green: '#10b981',
  blue: '#3b82f6',
  pink: '#ec4899',
  purple: '#8b5cf6'
};

// Create highlight popup
let highlightPopup = null;
let navigationWidget = null;
let noteDialog = null;
let selectedRange = null;
let selectedText = '';

function createHighlightPopup() {
  if (highlightPopup) return;

  highlightPopup = document.createElement('div');
  highlightPopup.id = 'chat-highlight-popup';
  highlightPopup.innerHTML = `
    <div class="highlight-popup-content">
      <div class="highlight-colors">
        <button class="color-btn" data-color="yellow" style="background: ${COLORS.yellow}"></button>
        <button class="color-btn" data-color="green" style="background: ${COLORS.green}"></button>
        <button class="color-btn" data-color="blue" style="background: ${COLORS.blue}"></button>
        <button class="color-btn" data-color="pink" style="background: ${COLORS.pink}"></button>
        <button class="color-btn" data-color="purple" style="background: ${COLORS.purple}"></button>
      </div>
      <button class="note-btn" title="Add note">📝</button>
    </div>
  `;

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    #chat-highlight-popup {
      position: absolute;
      z-index: 999999;
      background: #2a2a2a;
      border: 2px solid #3a3a3a;
      border-radius: 8px;
      padding: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      display: none;
      animation: popupFadeIn 0.2s ease;
    }

    @keyframes popupFadeIn {
      from {
        opacity: 0;
        transform: translateY(-5px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .highlight-popup-content {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .highlight-colors {
      display: flex;
      gap: 6px;
    }

    .color-btn {
      width: 28px;
      height: 28px;
      border: 2px solid #fff;
      border-radius: 50%;
      cursor: pointer;
      transition: transform 0.2s ease;
    }

    .color-btn:hover {
      transform: scale(1.2);
      box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
    }

    .note-btn {
      background: #667eea;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      transition: background 0.2s ease;
      margin-left: 4px;
    }

    .note-btn:hover {
      background: #764ba2;
    }

    .chat-highlight {
      position: relative;
      cursor: pointer;
      padding: 2px 4px;
      border-radius: 3px;
      transition: opacity 0.2s ease;
    }

    .chat-highlight:hover {
      opacity: 0.8;
    }

    .chat-highlight[data-color="yellow"] {
      background-color: rgba(255, 215, 0, 0.3);
      border-bottom: 2px solid ${COLORS.yellow};
    }

    .chat-highlight[data-color="green"] {
      background-color: rgba(16, 185, 129, 0.3);
      border-bottom: 2px solid ${COLORS.green};
    }

    .chat-highlight[data-color="blue"] {
      background-color: rgba(59, 130, 246, 0.3);
      border-bottom: 2px solid ${COLORS.blue};
    }

    .chat-highlight[data-color="pink"] {
      background-color: rgba(236, 72, 153, 0.3);
      border-bottom: 2px solid ${COLORS.pink};
    }

    .chat-highlight[data-color="purple"] {
      background-color: rgba(139, 92, 246, 0.3);
      border-bottom: 2px solid ${COLORS.purple};
    }

    #highlight-navigation {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999998;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 30px;
      padding: 12px 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      display: none;
      align-items: center;
      gap: 12px;
      animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .nav-btn {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .nav-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .nav-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .nav-info {
      color: white;
      font-size: 13px;
      font-weight: 500;
    }

    #note-dialog {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 9999999;
      background: #2a2a2a;
      border: 2px solid #667eea;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      display: none;
      min-width: 400px;
      animation: dialogFadeIn 0.3s ease;
    }

    @keyframes dialogFadeIn {
      from {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.9);
      }
      to {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
    }

    #note-dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 9999998;
      display: none;
    }

    .note-dialog-header {
      color: #ffffff;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
    }

    .note-dialog-text {
      color: #cccccc;
      font-size: 14px;
      margin-bottom: 16px;
      padding: 12px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 6px;
      max-height: 100px;
      overflow-y: auto;
    }

    #note-textarea {
      width: 100%;
      min-height: 100px;
      background: #1e1e1e;
      color: #ffffff;
      border: 2px solid #3a3a3a;
      border-radius: 8px;
      padding: 12px;
      font-size: 14px;
      font-family: inherit;
      resize: vertical;
      margin-bottom: 16px;
    }

    #note-textarea:focus {
      outline: none;
      border-color: #667eea;
    }

    .note-dialog-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .note-dialog-btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .note-dialog-btn.primary {
      background: #667eea;
      color: white;
    }

    .note-dialog-btn.primary:hover {
      background: #764ba2;
    }

    .note-dialog-btn.secondary {
      background: #3a3a3a;
      color: white;
    }

    .note-dialog-btn.secondary:hover {
      background: #4a4a4a;
    }

    .highlight-note-indicator {
      display: inline-block;
      margin-left: 4px;
      font-size: 12px;
      opacity: 0.7;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(highlightPopup);

  // Add event listeners
  highlightPopup.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const color = btn.dataset.color;
      applyHighlight(color);
      hideHighlightPopup();
    });
  });

  highlightPopup.querySelector('.note-btn').addEventListener('click', () => {
    hideHighlightPopup();
    showNoteDialog(null, selectedText);
  });
}

function createNavigationWidget() {
  if (navigationWidget) return;

  navigationWidget = document.createElement('div');
  navigationWidget.id = 'highlight-navigation';
  navigationWidget.innerHTML = `
    <button class="nav-btn" id="prev-highlight">← Prev</button>
    <span class="nav-info" id="highlight-counter">0 / 0</span>
    <button class="nav-btn" id="next-highlight">Next →</button>
  `;

  document.body.appendChild(navigationWidget);

  document.getElementById('prev-highlight').addEventListener('click', navigateToPrevious);
  document.getElementById('next-highlight').addEventListener('click', navigateToNext);
}

function createNoteDialog() {
  if (noteDialog) return;

  const overlay = document.createElement('div');
  overlay.id = 'note-dialog-overlay';
  document.body.appendChild(overlay);

  noteDialog = document.createElement('div');
  noteDialog.id = 'note-dialog';
  noteDialog.innerHTML = `
    <div class="note-dialog-header">Add Note to Highlight</div>
    <div class="note-dialog-text" id="dialog-highlight-text"></div>
    <textarea id="note-textarea" placeholder="Add your note here..."></textarea>
    <div class="note-dialog-actions">
      <button class="note-dialog-btn secondary" id="cancel-note">Cancel</button>
      <button class="note-dialog-btn primary" id="save-note">Save Note</button>
    </div>
  `;

  document.body.appendChild(noteDialog);

  let currentHighlightId = null;

  overlay.addEventListener('click', hideNoteDialog);
  document.getElementById('cancel-note').addEventListener('click', hideNoteDialog);
  document.getElementById('save-note').addEventListener('click', () => {
    const note = document.getElementById('note-textarea').value.trim();
    if (currentHighlightId !== null) {
      saveNote(currentHighlightId, note);
    } else {
      // Apply highlight with note
      const color = 'yellow'; // default color
      applyHighlight(color, note);
    }
    hideNoteDialog();
  });

  window.showNoteDialog = function(highlightId, text) {
    currentHighlightId = highlightId;
    document.getElementById('dialog-highlight-text').textContent = text;

    if (highlightId !== null) {
      const highlight = highlights.find(h => h.id === highlightId);
      document.getElementById('note-textarea').value = highlight?.note || '';
    } else {
      document.getElementById('note-textarea').value = '';
    }

    overlay.style.display = 'block';
    noteDialog.style.display = 'block';
    document.getElementById('note-textarea').focus();
  };

  function hideNoteDialog() {
    overlay.style.display = 'none';
    noteDialog.style.display = 'none';
    currentHighlightId = null;
  }
}

// Text selection handling
document.addEventListener('mouseup', handleTextSelection);

function handleTextSelection(e) {
  const selection = window.getSelection();
  const text = selection.toString().trim();

  if (text.length === 0 || text.length > 500) {
    hideHighlightPopup();
    return;
  }

  // Check if selection is within chat messages
  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;
  const messageElement = container.nodeType === 3
    ? container.parentElement?.closest('[data-message-author-role], .model-response, .user-message, article')
    : container.closest('[data-message-author-role], .model-response, .user-message, article');

  if (!messageElement) {
    hideHighlightPopup();
    return;
  }

  selectedRange = range;
  selectedText = text;

  showHighlightPopup(e.pageX, e.pageY);
}

function showHighlightPopup(x, y) {
  if (!highlightPopup) createHighlightPopup();

  highlightPopup.style.display = 'block';
  highlightPopup.style.left = `${x}px`;
  highlightPopup.style.top = `${y - 60}px`;
}

function hideHighlightPopup() {
  if (highlightPopup) {
    highlightPopup.style.display = 'none';
  }
}

function applyHighlight(color, note = '') {
  if (!selectedRange) return;

  const chatKey = getChatKey();
  if (!chatKey) return;

  const span = document.createElement('span');
  span.className = 'chat-highlight';
  span.dataset.color = color;
  span.dataset.highlightId = Date.now().toString();

  if (note) {
    span.dataset.note = note;
    span.innerHTML = selectedRange.toString() + '<span class="highlight-note-indicator">📝</span>';
  } else {
    span.textContent = selectedRange.toString();
  }

  try {
    selectedRange.deleteContents();
    selectedRange.insertNode(span);
  } catch (e) {
    console.error('Failed to apply highlight:', e);
    return;
  }

  // Save to storage
  const highlight = {
    id: span.dataset.highlightId,
    text: selectedText,
    color: color,
    note: note,
    timestamp: Date.now()
  };

  highlights.push(highlight);
  saveHighlights(chatKey);

  // Add click listener for notes
  span.addEventListener('click', (e) => {
    e.stopPropagation();
    showNoteDialog(highlight.id, highlight.text);
  });

  updateNavigationWidget();
  selectedRange = null;
  selectedText = '';
}

function saveNote(highlightId, note) {
  const highlight = highlights.find(h => h.id === highlightId);
  if (!highlight) return;

  highlight.note = note;

  // Update DOM
  const span = document.querySelector(`[data-highlight-id="${highlightId}"]`);
  if (span) {
    span.dataset.note = note;
    if (note) {
      if (!span.querySelector('.highlight-note-indicator')) {
        span.innerHTML = span.textContent.replace('📝', '') + '<span class="highlight-note-indicator">📝</span>';
      }
    } else {
      const indicator = span.querySelector('.highlight-note-indicator');
      if (indicator) indicator.remove();
    }
  }

  const chatKey = getChatKey();
  if (chatKey) {
    saveHighlights(chatKey);
  }
}

function saveHighlights(chatKey) {
  const storageKey = `highlights_${chatKey}`;
  const titleKey = `title_${chatKey}`;

  chrome.storage.local.set({
    [storageKey]: highlights,
    [titleKey]: getChatTitle()
  });
}

function loadHighlights() {
  const chatKey = getChatKey();
  if (!chatKey) return;

  const storageKey = `highlights_${chatKey}`;

  chrome.storage.local.get([storageKey], (data) => {
    highlights = data[storageKey] || [];

    // Reapply highlights to DOM
    highlights.forEach(highlight => {
      const existingSpan = document.querySelector(`[data-highlight-id="${highlight.id}"]`);
      if (existingSpan) {
        existingSpan.addEventListener('click', (e) => {
          e.stopPropagation();
          showNoteDialog(highlight.id, highlight.text);
        });
      }
    });

    updateNavigationWidget();
  });
}

function updateNavigationWidget() {
  if (!navigationWidget) createNavigationWidget();

  if (highlights.length === 0) {
    navigationWidget.style.display = 'none';
    return;
  }

  navigationWidget.style.display = 'flex';
  const counter = document.getElementById('highlight-counter');
  counter.textContent = `${highlights.length} highlight${highlights.length !== 1 ? 's' : ''}`;
}

function navigateToNext() {
  if (highlights.length === 0) return;

  currentHighlightIndex = (currentHighlightIndex + 1) % highlights.length;
  scrollToHighlight(currentHighlightIndex);
}

function navigateToPrevious() {
  if (highlights.length === 0) return;

  currentHighlightIndex = currentHighlightIndex <= 0 ? highlights.length - 1 : currentHighlightIndex - 1;
  scrollToHighlight(currentHighlightIndex);
}

function scrollToHighlight(index) {
  const highlight = highlights[index];
  if (!highlight) return;

  const span = document.querySelector(`[data-highlight-id="${highlight.id}"]`);
  if (span) {
    span.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Flash effect
    span.style.animation = 'none';
    setTimeout(() => {
      span.style.animation = 'highlightFlash 0.6s ease';
    }, 10);
  }

  document.getElementById('highlight-counter').textContent = `${index + 1} / ${highlights.length}`;
}

// Add flash animation
const flashStyle = document.createElement('style');
flashStyle.textContent = `
  @keyframes highlightFlash {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
`;
document.head.appendChild(flashStyle);

// Initialize highlighting features
createHighlightPopup();
createNavigationWidget();
createNoteDialog();

// Load highlights when page loads
setTimeout(() => {
  loadHighlights();
}, 1000);

// Reload highlights when URL changes
let lastUrl = location.href;
setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    highlights = [];
    currentHighlightIndex = -1;
    setTimeout(loadHighlights, 500);
  }
}, 1000);
