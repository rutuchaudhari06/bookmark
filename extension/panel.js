// Draggable Panel for AI Chat Bookmarks (runs in page context)
(function () {
  'use strict';

  const PANEL_ID = 'ai-bookmark-panel';
  const TOGGLE_BUTTON_ID = 'ai-bookmark-toggle-btn';
  const DRAG_HANDLE_ID = 'ai-bookmark-drag-handle';

  // Check if panel already exists
  if (document.getElementById(PANEL_ID)) {
    return;
  }

  // Create panel HTML structure
  function createPanelHTML() {
    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.innerHTML = `
      <div id="${DRAG_HANDLE_ID}" class="bookmark-panel-header">
        <span class="bookmark-panel-title">AI Chat Bookmarks</span>
        <div class="bookmark-panel-controls">
          <button id="bookmark-panel-close" class="bookmark-btn-icon" title="Close">×</button>
        </div>
      </div>
      <div class="bookmark-panel-content">
        <input id="bookmark-panel-search" class="bookmark-search" placeholder="Search bookmarks..." />
        <div id="bookmark-panel-list" class="bookmark-list"></div>
        <div class="bookmark-panel-footer">
          <button id="bookmark-panel-clear-all" class="bookmark-btn-secondary">Clear All</button>
        </div>
      </div>
    `;
    return panel;
  }

  // Create toggle button
  function createToggleButton() {
    const btn = document.createElement('button');
    btn.id = TOGGLE_BUTTON_ID;
    btn.innerHTML = '🔖';
    btn.title = 'Toggle Bookmarks Panel';
    btn.className = 'bookmark-toggle-btn';
    return btn;
  }

  // Inject CSS
  function injectStyles() {
    if (document.getElementById('ai-bookmark-panel-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'ai-bookmark-panel-styles';
    style.textContent = `
      #${TOGGLE_BUTTON_ID} {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: #2563eb;
        color: white;
        border: none;
        cursor: pointer;
        font-size: 24px;
        z-index: 2147483646;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      #${TOGGLE_BUTTON_ID}:hover {
        background: #1d4ed8;
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(0,0,0,0.2);
      }
      #${PANEL_ID} {
        position: fixed;
        top: 80px;
        right: 20px;
        width: 400px;
        max-width: calc(100vw - 40px);
        max-height: calc(100vh - 100px);
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        z-index: 2147483647;
        display: none;
        flex-direction: column;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      }
      #${PANEL_ID}.bookmark-panel-visible {
        display: flex;
      }
      .bookmark-panel-header {
        background: #2563eb;
        color: white;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: move;
        user-select: none;
      }
      .bookmark-panel-title {
        font-weight: 600;
        font-size: 16px;
      }
      .bookmark-panel-controls {
        display: flex;
        gap: 8px;
      }
      .bookmark-btn-icon {
        background: transparent;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background 0.2s;
      }
      .bookmark-btn-icon:hover {
        background: rgba(255,255,255,0.2);
      }
      .bookmark-panel-content {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: #f7f8fa;
      }
      .bookmark-search {
        padding: 12px;
        border: none;
        border-bottom: 1px solid #e5e7eb;
        font-size: 14px;
        outline: none;
      }
      .bookmark-search:focus {
        border-bottom-color: #2563eb;
      }
      .bookmark-list {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
        min-height: 200px;
        max-height: 500px;
      }
      .bookmark-item {
        background: white;
        padding: 12px;
        margin-bottom: 8px;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .bookmark-item-meta {
        font-size: 12px;
        color: #666;
        margin-bottom: 6px;
        display: flex;
        justify-content: space-between;
      }
      .bookmark-item-snippet {
        font-size: 13px;
        margin-bottom: 8px;
        white-space: pre-wrap;
        max-height: 84px;
        overflow: auto;
        color: #111;
      }
      .bookmark-item-controls {
        display: flex;
        gap: 6px;
        margin-bottom: 8px;
      }
      .bookmark-btn {
        padding: 6px 12px;
        border-radius: 6px;
        border: none;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      }
      .bookmark-btn-primary {
        background: #2563eb;
        color: white;
      }
      .bookmark-btn-primary:hover {
        background: #1d4ed8;
      }
      .bookmark-btn-danger {
        background: #ef4444;
        color: white;
      }
      .bookmark-btn-danger:hover {
        background: #dc2626;
      }
      .bookmark-btn-secondary {
        background: #e5e7eb;
        color: #111;
      }
      .bookmark-btn-secondary:hover {
        background: #d1d5db;
      }
      .bookmark-item-notes {
        margin-top: 8px;
      }
      .bookmark-item-notes textarea {
        width: 100%;
        box-sizing: border-box;
        padding: 6px;
        border-radius: 6px;
        border: 1px solid #ddd;
        resize: vertical;
        font-size: 12px;
        font-family: inherit;
      }
      .bookmark-panel-footer {
        padding: 12px;
        border-top: 1px solid #e5e7eb;
        background: white;
      }
      .bookmark-empty {
        text-align: center;
        color: #666;
        font-size: 13px;
        padding: 40px 20px;
      }
    `;
    document.head.appendChild(style);
  }

  // Drag functionality
  let isDragging = false;
  let currentX, currentY, initialX, initialY;
  let xOffset = 0, yOffset = 0;

  function dragStart(e) {
    if (e.target.id !== DRAG_HANDLE_ID && !e.target.closest(`#${DRAG_HANDLE_ID}`)) {
      return;
    }
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    if (e.type === 'touchstart') {
      initialX = e.touches[0].clientX - xOffset;
      initialY = e.touches[0].clientY - yOffset;
    }
    if (document.getElementById(PANEL_ID).contains(e.target)) {
      isDragging = true;
    }
  }

  function dragEnd() {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
  }

  function drag(e) {
    if (!isDragging) return;
    e.preventDefault();
    if (e.type === 'touchmove') {
      currentX = e.touches[0].clientX - initialX;
      currentY = e.touches[0].clientY - initialY;
    } else {
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
    }
    xOffset = currentX;
    yOffset = currentY;
    setTranslate(currentX, currentY, document.getElementById(PANEL_ID));
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
  }

  // Communication with content script
  function sendToContentScript(message) {
    window.postMessage({ type: 'bookmarkPanelMessage', ...message }, '*');
  }

  // Bookmark management functions (communicate with content script)
  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleString();
    } catch (e) {
      return iso;
    }
  }

  function buildBookmarkCard(b, index) {
    const card = document.createElement('div');
    card.className = 'bookmark-item';

    const meta = document.createElement('div');
    meta.className = 'bookmark-item-meta';
    const title = document.createElement('span');
    title.textContent = b.title || '';
    const date = document.createElement('span');
    date.textContent = formatDate(b.createdAt || '');
    meta.appendChild(title);
    meta.appendChild(date);

    const snippet = document.createElement('div');
    snippet.className = 'bookmark-item-snippet';
    snippet.textContent = b.snippet || '';

    const controls = document.createElement('div');
    controls.className = 'bookmark-item-controls';

    const jumpBtn = document.createElement('button');
    jumpBtn.className = 'bookmark-btn bookmark-btn-primary';
    jumpBtn.textContent = 'Jump';
    jumpBtn.addEventListener('click', () => {
      sendToContentScript({ action: 'jumpToBookmark', bookmark: b });
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'bookmark-btn bookmark-btn-danger';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => {
      sendToContentScript({ action: 'removeBookmark', index });
    });

    const exportBtn = document.createElement('button');
    exportBtn.className = 'bookmark-btn bookmark-btn-secondary';
    exportBtn.textContent = 'Export';
    exportBtn.addEventListener('click', () => {
      const data = JSON.stringify(b, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (b.id || 'bookmark') + '.json';
      a.click();
      URL.revokeObjectURL(url);
    });

    controls.appendChild(jumpBtn);
    controls.appendChild(deleteBtn);
    controls.appendChild(exportBtn);

    const notesWrap = document.createElement('div');
    notesWrap.className = 'bookmark-item-notes';
    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Short description (notes)...';
    textarea.rows = 2;
    textarea.value = b.description || '';
    let updateTimeout;
    textarea.addEventListener('input', (e) => {
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(() => {
        sendToContentScript({ action: 'updateDescription', index, text: e.target.value });
      }, 500);
    });
    notesWrap.appendChild(textarea);

    card.appendChild(meta);
    card.appendChild(snippet);
    card.appendChild(controls);
    card.appendChild(notesWrap);

    return card;
  }

  function renderList(bookmarks) {
    const listEl = document.getElementById('bookmark-panel-list');
    listEl.innerHTML = '';
    if (!bookmarks || bookmarks.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'bookmark-empty';
      empty.textContent = 'No bookmarks yet. Hover over a chat response and click the 🔖 button to create one.';
      listEl.appendChild(empty);
      return;
    }
    const searchInput = document.getElementById('bookmark-panel-search');
    const q = (searchInput.value || '').trim().toLowerCase();
    bookmarks.forEach((b, i) => {
      if (q) {
        const hay = ((b.snippet || '') + ' ' + (b.description || '') + ' ' + (b.title || '')).toLowerCase();
        if (!hay.includes(q)) return;
      }
      const card = buildBookmarkCard(b, i);
      listEl.appendChild(card);
    });
  }

  function requestBookmarks() {
    sendToContentScript({ action: 'getBookmarks' });
  }

  // Initialize panel
  function initPanel() {
    injectStyles();
    
    const toggleBtn = createToggleButton();
    const panel = createPanelHTML();
    
    document.body.appendChild(toggleBtn);
    document.body.appendChild(panel);

    // Toggle panel visibility
    toggleBtn.addEventListener('click', () => {
      const panelEl = document.getElementById(PANEL_ID);
      panelEl.classList.toggle('bookmark-panel-visible');
      if (panelEl.classList.contains('bookmark-panel-visible')) {
        requestBookmarks();
      }
    });

    // Close button
    document.getElementById('bookmark-panel-close').addEventListener('click', () => {
      document.getElementById(PANEL_ID).classList.remove('bookmark-panel-visible');
    });

    // Drag functionality
    const dragHandle = document.getElementById(DRAG_HANDLE_ID);
    dragHandle.addEventListener('mousedown', dragStart);
    dragHandle.addEventListener('touchstart', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag);
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchend', dragEnd);

    // Search functionality
    document.getElementById('bookmark-panel-search').addEventListener('input', () => {
      requestBookmarks();
    });

    // Clear all button
    document.getElementById('bookmark-panel-clear-all').addEventListener('click', () => {
      if (!confirm('Clear all bookmarks?')) return;
      sendToContentScript({ action: 'clearAllBookmarks' });
    });

    // Listen for messages from content script
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'bookmarkContentScriptResponse') {
        if (event.data.action === 'bookmarksList') {
          renderList(event.data.bookmarks);
        }
      }
      if (event.data && event.data.type === 'bookmarkAdded') {
        const panelEl = document.getElementById(PANEL_ID);
        if (panelEl && panelEl.classList.contains('bookmark-panel-visible')) {
          requestBookmarks();
        }
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPanel);
  } else {
    initPanel();
  }
})();
