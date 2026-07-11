// Vanilla JS popup for AI Chat Bookmarks
(function () {
  const listEl = document.getElementById('list');
  const searchInput = document.getElementById('searchInput');
  const clearAllBtn = document.getElementById('clearAllBtn');

  function formatDate(iso) {
    try { return new Date(iso).toLocaleString(); } catch (e) { return iso; }
  }

  function loadBookmarks(callback) {
    chrome.storage.local.get({ bookmarks: [] }, (res) => {
      const bookmarks = res.bookmarks || [];
      callback(bookmarks);
    });
  }

  function saveBookmarks(bookmarks, cb) {
    chrome.storage.local.set({ bookmarks }, cb || function () {});
  }

  function buildBookmarkCard(b, index) {
    const card = document.createElement('div');
    card.className = 'bookmark';

    const meta = document.createElement('div');
    meta.className = 'meta';
    const title = document.createElement('span');
    title.className = 'small';
    title.textContent = b.title || '';
    const date = document.createElement('span');
    date.className = 'small';
    date.style.float = 'right';
    date.textContent = formatDate(b.createdAt || '');

    meta.appendChild(title);
    meta.appendChild(date);

    const snippet = document.createElement('div');
    snippet.className = 'snippet';
    snippet.textContent = b.snippet || '';

    const controls = document.createElement('div');

    const jumpBtn = document.createElement('button');
    jumpBtn.className = 'btn';
    jumpBtn.textContent = 'Jump';
    jumpBtn.addEventListener('click', () => jumpToBookmark(b));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn';
    deleteBtn.style.marginLeft = '8px';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => {
      removeBookmark(index);
    });

    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn';
    exportBtn.style.marginLeft = '8px';
    exportBtn.textContent = 'Export';
    exportBtn.addEventListener('click', () => exportSingle(b));

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn';
    saveBtn.style.marginLeft = '8px';
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', () => {
      const name = prompt('Enter folder name to save bookmark (existing or new):', b.folderName || '');
      if (!name) return;
      // persist folder list and bookmark
      chrome.storage.local.get({ folders: [] }, (res) => {
        const folders = res.folders || [];
        if (!folders.find(f => f.name === name)) {
          folders.push({ id: 'folder-' + Date.now() + '-' + Math.floor(Math.random()*10000), name, createdAt: new Date().toISOString() });
          chrome.storage.local.set({ folders });
        }
        loadBookmarks((bookmarks) => {
          if (bookmarks[index]) {
            bookmarks[index].folderName = name;
            saveBookmarks(bookmarks, () => reloadAndRender());
          }
        });
      });
    });

    controls.appendChild(jumpBtn);
    controls.appendChild(deleteBtn);
    controls.appendChild(saveBtn);
    controls.appendChild(exportBtn);

    const textareaWrap = document.createElement('div');
    textareaWrap.style.marginTop = '8px';
    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Short description (notes)...';
    textarea.rows = 2;
    textarea.style.width = '100%';
    textarea.value = b.description || '';
    textarea.addEventListener('input', (e) => {
      updateDescription(index, e.target.value);
    });
    textareaWrap.appendChild(textarea);

    card.appendChild(meta);
    card.appendChild(snippet);
    card.appendChild(controls);
    card.appendChild(textareaWrap);

    return card;
  }

  function renderList(bookmarks) {
    listEl.innerHTML = '';
    if (!bookmarks || bookmarks.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'small';
      empty.textContent = 'No bookmarks yet. Hover over a chat response and click the 🔖 button to create one.';
      listEl.appendChild(empty);
      return;
    }
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

  function reloadAndRender() {
    loadBookmarks(renderList);
  }

  function removeBookmark(idx) {
    loadBookmarks((bookmarks) => {
      bookmarks.splice(idx, 1);
      saveBookmarks(bookmarks, () => reloadAndRender());
    });
  }

  function updateDescription(idx, text) {
    loadBookmarks((bookmarks) => {
      if (!bookmarks[idx]) return;
      bookmarks[idx].description = text;
      saveBookmarks(bookmarks, () => {});
    });
  }

  function exportSingle(b) {
    const data = JSON.stringify(b, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (b.id || 'bookmark') + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportAll(bookmarks) {
    const data = JSON.stringify(bookmarks, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-bookmarks.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function jumpToBookmark(b) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return;
      chrome.tabs.sendMessage(tabs[0].id, { type: 'jumpToBookmark', id: b.id, snippet: b.snippet }, (resp) => {
        if (chrome.runtime.lastError) {
          alert('Could not connect to page. Make sure the page allows content scripts and try reloading it.');
          return;
        }
        if (!resp || !resp.found) {
          if (b.url) {
            chrome.tabs.create({ url: b.url });
          } else {
            alert('Could not find the element on this page.');
          }
        }
      });
    });
  }

  // --- wire up UI
  clearAllBtn.addEventListener('click', () => {
    if (!confirm('Clear all bookmarks?')) return;
    chrome.storage.local.clear(() => {
      reloadAndRender();
    });
  });

  searchInput.addEventListener('input', () => {
    loadBookmarks(renderList);
  });

  // context menu: export all by Ctrl+E (optional)
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
      loadBookmarks((bookmarks) => {
        exportAll(bookmarks || []);
      });
    }
  });

  // initial render
  reloadAndRender();
})();
