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
      .bookmark-dropdown { background: white; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.18); padding: 10px; font-family: inherit; }
      .bd-list { max-height: 220px; overflow:auto; margin-bottom:8px; }
      .bd-item { display:flex; justify-content:space-between; align-items:center; padding:6px; border-radius:6px; background:#f7f8fa; margin-bottom:6px; }
      .bd-item:hover { background:#eef2ff; }
      .bd-row { display:flex; gap:8px; }
      #bd-new-folder { flex:1; padding:6px; border-radius:6px; border:1px solid #ddd; }
      .bd-name { font-size:13px; color:#111; }
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

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (m) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])
    );
  }

  let activeFolderDropdownClose = null;

  function closeActiveFolderDropdown() {
    if (typeof activeFolderDropdownClose === 'function') {
      activeFolderDropdownClose();
      activeFolderDropdownClose = null;
    }
  }

  // Bookmark management functions (communicate with content script)
  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleString();
    } catch (e) {
      return iso;
    }
  }

  function renderFolderList(listEl, folders, index, onSelect, errorMessage) {
    if (!listEl) return;
    listEl.innerHTML = '';
    if (errorMessage) {
      listEl.textContent = errorMessage;
      return;
    }
    if (!folders || folders.length === 0) {
      listEl.textContent = 'No folders yet';
      return;
    }

    folders.forEach((f) => {
      const row = document.createElement('div');
      row.className = 'bd-item';
      const name = document.createElement('span');
      name.className = 'bd-name';
      name.textContent = f.name;
      const selBtn = document.createElement('button');
      selBtn.className = 'bookmark-btn bookmark-btn-secondary';
      selBtn.textContent = 'Select';
      selBtn.addEventListener('click', () => {
        sendToContentScript({ action: 'saveBookmarkToFolder', index, folderId: f.id });
        if (onSelect) onSelect();
      });
      row.appendChild(name);
      row.appendChild(selBtn);
      listEl.appendChild(row);
    });
  }

  function renderFolderResponse(folders, justCreated, folderIndex, errorMessage) {
    if (errorMessage) {
      const listEl = document.getElementById('bd-folder-list');
      if (listEl) {
        listEl.textContent = errorMessage;
      }
      const modalList = document.getElementById('bookmark-folder-list');
      if (modalList) {
        modalList.textContent = errorMessage;
      }
      return;
    }

    const index = typeof folderIndex === 'number' ? folderIndex : (window._bookmarkFolderIndex || 0);

    const modalList = document.getElementById('bookmark-folder-list');
    if (modalList) {
      renderFolderList(modalList, folders, index, closeFolderModal);
    }

    const listEl = document.getElementById('bd-folder-list');
    if (listEl) {
      renderFolderList(listEl, folders, index, closeActiveFolderDropdown);
    }

    if (justCreated && folders && folders.length) {
      const last = folders[folders.length - 1];
      sendToContentScript({ action: 'saveBookmarkToFolder', index, folderId: last.id });
      closeFolderModal();
      closeActiveFolderDropdown();
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
    // Save to Folder button

    const saveBtn = document.createElement('button');
                    saveBtn.className = 'bookmark-btn bookmark-btn-secondary';
                    saveBtn.textContent = 'Save';
                    saveBtn.title = 'Save to folder';
    
    saveBtn.addEventListener('click', (e) => {
      window._bookmarkFolderIndex = index;
      showFolderDropdown(b, index, e.currentTarget);
    });

    controls.appendChild(saveBtn);
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

    // show folder badge if present
    if (b.folderName) {
      const badge = document.createElement('div');
      badge.style.marginTop = '8px';
      badge.style.fontSize = '12px';
      badge.style.color = '#2563eb';
      badge.textContent = 'Folder: ' + b.folderName;
      card.appendChild(badge);
    }

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

  // Folder modal implementation
  function openFolderModal(bookmark, index) {
    // ensure modal container exists
    let modal = document.getElementById('bookmark-folder-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'bookmark-folder-modal';
      modal.innerHTML = `
        <div class="bookmark-folder-overlay"></div>
        <div class="bookmark-folder-panel">
          <div class="bookmark-folder-header">Save Bookmark</div>
          <div class="bookmark-folder-body">
            <div id="bookmark-folder-list"></div>
            <div style="margin-top:8px;display:flex;gap:6px;">
              <input id="bookmark-new-folder-input" placeholder="New folder name" />
              <button id="bookmark-create-folder" class="bookmark-btn bookmark-btn-primary">Create</button>
            </div>
          </div>
          <div class="bookmark-folder-footer"><button id="bookmark-folder-cancel" class="bookmark-btn">Cancel</button></div>
        </div>
      `;
      document.body.appendChild(modal);

      // styles
      const css = document.createElement('style');
      css.id = 'bookmark-folder-styles';
      css.textContent = `
        #bookmark-folder-modal { position: fixed; inset:0; z-index:2147483650; display:flex; align-items:center; justify-content:center; }
        .bookmark-folder-overlay { position:absolute; inset:0; background:rgba(0,0,0,0.3); }
        .bookmark-folder-panel { position:relative; background:white; width:320px; border-radius:8px; box-shadow:0 8px 32px rgba(0,0,0,0.2); padding:12px; z-index:2; }
        .bookmark-folder-header { font-weight:600; margin-bottom:8px; }
        .bookmark-folder-body { max-height:300px; overflow:auto; }
        #bookmark-folder-list .folder-item { padding:8px; border-radius:6px; margin-bottom:6px; background:#f3f4f6; cursor:pointer; display:flex; justify-content:space-between; align-items:center; }
        #bookmark-folder-list .folder-item:hover { background:#e5e7eb; }
        #bookmark-new-folder-input { flex:1; padding:6px; border-radius:6px; border:1px solid #ddd; }
        #bookmark-create-folder { padding:6px 10px; }
        .bookmark-folder-footer { margin-top:8px; text-align:right; }
      `;
      document.head.appendChild(css);

      // event listeners
      modal.querySelector('#bookmark-folder-cancel').addEventListener('click', () => closeFolderModal());
      modal.querySelector('#bookmark-create-folder').addEventListener('click', () => {
        const name = (document.getElementById('bookmark-new-folder-input').value || '').trim();
        if (!name) return alert('Enter a folder name');
        sendToContentScript({ action: 'createFolder', name });
      });
    }

    modal.style.display = 'flex';
    // fetch current folders
    sendToContentScript({ action: 'getFolders' });

    // populate when response arrives (listen once)
    function onFoldersResponse(event) {
      if (!(event.data && event.data.type === 'bookmarkContentScriptResponse' && event.data.action === 'foldersList')) return;
      const list = document.getElementById('bookmark-folder-list');
      list.innerHTML = '';
      const folders = event.data.folders || [];
      folders.forEach(f => {
        const item = document.createElement('div');
        item.className = 'folder-item';
        const name = document.createElement('span');
        name.textContent = f.name;
        const btn = document.createElement('button');
        btn.className = 'bookmark-btn bookmark-btn-primary';
        btn.textContent = 'Select';
        btn.addEventListener('click', () => {
          sendToContentScript({ action: 'saveBookmarkToFolder', index, folderId: f.id });
          closeFolderModal();
        });
        item.appendChild(name);
        item.appendChild(btn);
        list.appendChild(item);
      });
      // also handle newly created folder responses
      if (event.data.justCreated) {
        // auto-select last created
        const last = event.data.folders && event.data.folders[event.data.folders.length-1];
        if (last) {
          sendToContentScript({ action: 'saveBookmarkToFolder', index, folderId: last.id });
          closeFolderModal();
        }
      }
      window.removeEventListener('message', onFoldersResponse);
    }
    window.addEventListener('message', onFoldersResponse);

  }

  function closeFolderModal() {
    const m = document.getElementById('bookmark-folder-modal');
    if (m) m.style.display = 'none';
  }

  function showFolderDropdown(bookmark, index, anchorEl) {
    closeActiveFolderDropdown();

    const dropdown = document.createElement('div');
    dropdown.id = 'bookmark-folder-dropdown';
    dropdown.className = 'bookmark-dropdown';
    dropdown.innerHTML = `
      <div class="bd-list" id="bd-folder-list">Loading...</div>
      <div class="bd-row">
        <input id="bd-new-folder" placeholder="New folder name" />
        <button id="bd-create" class="bookmark-btn bookmark-btn-primary">Create</button>
      </div>
    `;
    document.body.appendChild(dropdown);

    const rect = anchorEl.getBoundingClientRect();
    dropdown.style.position = 'absolute';
    dropdown.style.zIndex = 2147483650;
    const top = window.scrollY + rect.bottom + 6;
    const left = Math.min(window.scrollX + rect.left, window.innerWidth - 320);
    dropdown.style.top = top + 'px';
    dropdown.style.left = left + 'px';
    dropdown.style.width = '300px';

    function closeDropdown() {
      const d = document.getElementById('bookmark-folder-dropdown');
      if (d) d.remove();
      window.removeEventListener('click', onDocClick);
      window.removeEventListener('message', onFoldersResponse);
      if (activeFolderDropdownClose === closeDropdown) {
        activeFolderDropdownClose = null;
      }
    }

    activeFolderDropdownClose = closeDropdown;

    function onDocClick(ev) {
      if (!dropdown.contains(ev.target) && ev.target !== anchorEl) closeDropdown();
    }
    setTimeout(() => window.addEventListener('click', onDocClick), 0);

    function onFoldersResponse(event) {
      if (!(event.data && event.data.type === 'bookmarkContentScriptResponse' && event.data.action === 'foldersList')) return;
      const listEl = document.getElementById('bd-folder-list');
      if (!listEl) return;

      if (event.data.error) {
        listEl.textContent = event.data.error;
        return;
      }

      renderFolderList(listEl, event.data.folders || [], index, closeDropdown);

      if (event.data.justCreated && event.data.folders && event.data.folders.length) {
        const last = event.data.folders[event.data.folders.length - 1];
        sendToContentScript({ action: 'saveBookmarkToFolder', index, folderId: last.id });
        closeDropdown();
      }
    }
    window.addEventListener('message', onFoldersResponse);

    const createButton = dropdown.querySelector('#bd-create');
    if (createButton) {
      createButton.addEventListener('click', () => {
        const name = (document.getElementById('bd-new-folder').value || '').trim();
        if (!name) return alert('Enter a folder name');
        sendToContentScript({ action: 'createFolder', name });
      });
    }

    sendToContentScript({ action: 'getFolders' });
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
        if (event.data.action === 'foldersList') {
          renderFolderResponse(
            event.data.folders || [],
            event.data.justCreated,
            window._bookmarkFolderIndex,
            event.data.error
          );
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
