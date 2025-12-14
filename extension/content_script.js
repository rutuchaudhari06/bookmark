/*
Content script for AI Chat Bookmark.
- Shows a small 🔖 button when hovering over likely message elements.
- Clicking captures a snippet, attaches data-ai-bookmark-id to the element, and stores the bookmark via chrome.runtime messaging.
- Listens for jump requests from the popup to scroll to saved replies.
*/

const BUTTON_ID = 'ai-chat-bookmark-btn-v1';

function getCandidateMessageElements() {
  const candidates = [];
  const all = document.querySelectorAll('div, p, article, li, section');
  all.forEach(el => {
    const text = (el.innerText || '').trim();
    if (!text) return;
    const tlen = text.length;
    if (tlen < 30 || tlen > 2000) return;
    const rect = el.getBoundingClientRect();
    if (rect.width < 50 || rect.height < 20) return;
    if (el.closest('nav, footer, header')) return;
    candidates.push(el);
  });
  return candidates;
}

function attachHoverButtons() {
  const candidates = getCandidateMessageElements();
  candidates.forEach(el => {
    if (el.dataset.bookmarkHoverAttached) return;
    el.dataset.bookmarkHoverAttached = '1';
    el.addEventListener('mouseenter', onMouseEnter);
    el.addEventListener('mouseleave', onMouseLeave);
  });
}

let currentBtn = null;
let hoveredEl = null;

function createButton() {
  const btn = document.createElement('button');
  btn.id = BUTTON_ID;
  btn.textContent = '🔖';
  Object.assign(btn.style, {
    position: 'absolute',
    zIndex: 2147483647,
    padding: '6px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
    background: 'white',
    fontSize: '14px'
  });
  btn.title = 'Bookmark this response';
  btn.addEventListener('click', onBookmarkClick);
  btn.addEventListener('mouseenter', () => { if (currentBtn) currentBtn.dataset.over = '1'; });
  btn.addEventListener('mouseleave', () => { if (currentBtn) currentBtn.dataset.over = ''; });
  return btn;
}

function onMouseEnter(e) {
  hoveredEl = e.currentTarget;
  if (!currentBtn) {
    currentBtn = createButton();
    document.body.appendChild(currentBtn);
  }
  positionButton(hoveredEl);
}

function onMouseLeave() {
  setTimeout(() => {
    if (!currentBtn) return;
    if (currentBtn.dataset.over === '1') return; // mouse moved to button
    currentBtn.remove();
    currentBtn = null;
    hoveredEl = null;
  }, 120);
}

function positionButton(targetEl) {
  if (!currentBtn || !targetEl) return;
  const rect = targetEl.getBoundingClientRect();
  currentBtn.style.top = (window.scrollY + rect.top + 6) + 'px';
  currentBtn.style.left = (window.scrollX + rect.right - 36) + 'px';
}

function onBookmarkClick(e) {
  e.stopPropagation();
  e.preventDefault();
  const el = hoveredEl;
  if (!el) return alert('No message selected');
  const text = (el.innerText || '').trim();
  const snippet = text.slice(0, 200);
  const id = 'ai-bookmark-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
  try { el.dataset.aiBookmarkId = id; } catch (err) {}
  el.style.transition = 'box-shadow 0.2s';
  el.style.boxShadow = '0 0 0 3px rgba(255,200,0,0.6)';
  setTimeout(() => { el.style.boxShadow = ''; }, 1200);

  const bookmark = {
    id,
    snippet,
    fullText: text.slice(0, 1000),
    url: location.href,
    title: document.title,
    selectorHint: getSelectorHint(el),
    createdAt: new Date().toISOString()
  };

  chrome.runtime.sendMessage({type: 'saveBookmark', bookmark}, (resp) => {
    if (chrome.runtime.lastError) {
      // fallback to local storage write if messaging failed
      chrome.storage.local.get({bookmarks: []}, (res) => {
        const bookmarks = res.bookmarks || [];
        bookmarks.unshift(bookmark);
        chrome.storage.local.set({bookmarks});
      });
    }
    // Notify panel if it exists
    window.postMessage({type: 'bookmarkAdded'}, '*');
    alert('Bookmarked response! Click the 🔖 button to view your bookmarks.');
  });
}

function getSelectorHint(el) {
  const parts = [];
  let cur = el;
  while (cur && cur.nodeType === 1 && parts.length < 6) {
    let part = cur.nodeName.toLowerCase();
    if (cur.id) {
      part += '#' + cur.id;
      parts.unshift(part);
      break;
    }
    if (cur.className) {
      const cls = (cur.className + '').trim().split(/\s+/)[0];
      if (cls) part += '.' + cls;
    } else {
      const parent = cur.parentNode;
      if (parent) {
        const idx = Array.prototype.indexOf.call(parent.children, cur) + 1;
        part += `:nth-child(${idx})`;
      }
    }
    parts.unshift(part);
    cur = cur.parentElement;
  }
  return parts.join(' > ');
}

// Inject panel script
function injectPanel() {
  if (document.getElementById('ai-bookmark-panel-script-injected')) return;
  const script = document.createElement('script');
  script.id = 'ai-bookmark-panel-script-injected';
  script.src = chrome.runtime.getURL('panel.js');
  script.onload = function() {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);
}

// Inject panel when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectPanel);
} else {
  injectPanel();
}

// Listen for messages from panel
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'bookmarkPanelMessage') {
    const { action, index, text, bookmark } = event.data;
    
    if (action === 'getBookmarks') {
      chrome.storage.local.get({ bookmarks: [] }, (res) => {
        window.postMessage({
          type: 'bookmarkContentScriptResponse',
          action: 'bookmarksList',
          bookmarks: res.bookmarks || []
        }, '*');
      });
    } else if (action === 'removeBookmark') {
      chrome.storage.local.get({ bookmarks: [] }, (res) => {
        const bookmarks = res.bookmarks || [];
        bookmarks.splice(index, 1);
        chrome.storage.local.set({ bookmarks }, () => {
          window.postMessage({
            type: 'bookmarkContentScriptResponse',
            action: 'bookmarksList',
            bookmarks: bookmarks
          }, '*');
        });
      });
    } else if (action === 'updateDescription') {
      chrome.storage.local.get({ bookmarks: [] }, (res) => {
        const bookmarks = res.bookmarks || [];
        if (bookmarks[index]) {
          bookmarks[index].description = text;
          chrome.storage.local.set({ bookmarks });
        }
      });
    } else if (action === 'clearAllBookmarks') {
      chrome.storage.local.clear(() => {
        window.postMessage({
          type: 'bookmarkContentScriptResponse',
          action: 'bookmarksList',
          bookmarks: []
        }, '*');
      });
    } else if (action === 'jumpToBookmark') {
      const { id, snippet } = bookmark;
      let found = false;
      if (id) {
        try {
          const el = document.querySelector('[data-ai-bookmark-id="' + id + '"]');
          if (el) { scrollToElement(el); found = true; }
        } catch (err) {}
      }
      if (!found && snippet) {
        const searchText = snippet.slice(0, 40);
        const matches = Array.from(document.querySelectorAll('body *')).filter(e => {
          try {
            const t = (e.innerText || '').trim();
            return t && t.includes(searchText);
          } catch (err) {
            return false;
          }
        });
        if (matches.length) {
          scrollToElement(matches[0]);
          found = true;
        }
      }
      if (!found && bookmark.url) {
        window.open(bookmark.url, '_blank');
      }
    }
  }
  
  // Also handle direct jump messages (for backward compatibility)
  if (event.data && event.data.type === 'jumpToBookmark') {
    const {id, snippet} = event.data;
    let found = false;
    if (id) {
      try {
        const el = document.querySelector('[data-ai-bookmark-id="' + id + '"]');
        if (el) { scrollToElement(el); found = true; }
      } catch (err) {}
    }
    if (!found && snippet) {
      const searchText = snippet.slice(0, 40);
      const matches = Array.from(document.querySelectorAll('body *')).filter(e => {
        try {
          const t = (e.innerText || '').trim();
          return t && t.includes(searchText);
        } catch (err) {
          return false;
        }
      });
      if (matches.length) {
        scrollToElement(matches[0]);
        found = true;
      }
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'jumpToBookmark') {
    const {id, snippet} = message;
    let found = false;
    if (id) {
      try {
        const el = document.querySelector('[data-ai-bookmark-id="' + id + '"]');
        if (el) { scrollToElement(el); found = true; }
      } catch (err) {}
    }
    if (!found && snippet) {
      const searchText = snippet.slice(0, 40);
      const matches = Array.from(document.querySelectorAll('body *')).filter(e => {
        try {
          const t = (e.innerText || '').trim();
          return t && t.includes(searchText);
        } catch (err) {
          return false;
        }
      });
      if (matches.length) {
        scrollToElement(matches[0]);
        found = true;
      }
    }
    sendResponse({found});
  }
  return true; // Keep channel open for async response
});

function scrollToElement(el) {
  try {
    el.scrollIntoView({behavior: 'smooth', block: 'center'});
    const orig = el.style.boxShadow || '';
    el.style.transition = 'box-shadow 0.3s';
    el.style.boxShadow = '0 0 0 6px rgba(0,200,255,0.6)';
    setTimeout(() => { el.style.boxShadow = orig; }, 2000);
  } catch (err) {}
}

// Listen for storage changes and notify panel
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.bookmarks) {
    window.postMessage({ type: 'bookmarkAdded' }, '*');
  }
});

// attach initially and periodically for dynamic chat UIs
attachHoverButtons();
setInterval(attachHoverButtons, 1500);
