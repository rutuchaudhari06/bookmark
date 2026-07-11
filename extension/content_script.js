/*
Content script for AI Chat Bookmark.
- Shows a small 🔖 button when hovering over likely message elements.
- Clicking captures a snippet, attaches data-ai-bookmark-id to the element, and stores the bookmark via chrome.runtime messaging.
- Listens for jump requests from the popup to scroll to saved replies.
*/

const AUTH_STORAGE_KEY = 'firebaseAuth';
const SIGN_IN_MESSAGE = 'Please sign in to AIMarks';
const AUTH_MESSAGE_TYPE = 'AIMARKS_AUTH_TO_EXTENSION';
const AUTH_CLEAR_TYPE = 'AIMARKS_AUTH_CLEAR';

const TRUSTED_APP_ORIGINS = [
  'http://localhost',
  'http://127.0.0.1',
  'https://flash-card-project-db697.firebaseapp.com',
  'https://flash-card-project-db697.web.app',
];

function isTrustedAppOrigin(origin) {
  if (!origin) return false;

  return TRUSTED_APP_ORIGINS.some((trustedOrigin) => {
    if (origin === trustedOrigin) return true;
    if (origin.startsWith(trustedOrigin + ':')) return true;
    return false;
  });
}

function saveAuthToExtension(auth) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'syncFirebaseAuth', auth }, () => {
      resolve();
    });
  });
}

function clearAuthInExtension() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'clearFirebaseAuth' }, () => {
      resolve();
    });
  });
}

function getCurrentUserInfo() {
  return new Promise((resolve) => {
    chrome.storage.local.get([AUTH_STORAGE_KEY], (res) => {
      const stored = res && res[AUTH_STORAGE_KEY];

      if (!stored || !stored.userId || !stored.accessToken) {
        resolve({
          userId: null,
          accessToken: null,
          isAuthenticated: false,
        });
        return;
      }

      const isExpired = stored.expirationTime && Date.now() >= stored.expirationTime;
      if (isExpired) {
        resolve({
          userId: null,
          accessToken: null,
          isAuthenticated: false,
          expired: true,
          error: SIGN_IN_MESSAGE,
        });
        return;
      }

      resolve({
        userId: stored.userId,
        accessToken: stored.accessToken,
        isAuthenticated: true,
      });
    });
  });
}

window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (!isTrustedAppOrigin(event.origin)) return;

  if (event.data && event.data.type === AUTH_MESSAGE_TYPE && event.data.payload) {
    saveAuthToExtension(event.data.payload);
    return;
  }

  if (event.data && event.data.type === AUTH_CLEAR_TYPE) {
    clearAuthInExtension();
  }
});

async function querySubjectFolders(userInfo) {
  if (!userInfo || !userInfo.userId || !userInfo.accessToken) {
    return { folders: [], error: SIGN_IN_MESSAGE };
  }

  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: 'getFolders', userId: userInfo.userId, accessToken: userInfo.accessToken },
      (resp) => {
        if (chrome.runtime.lastError) {
          resolve({ folders: [], error: chrome.runtime.lastError.message });
          return;
        }

        if (!resp || resp.status === 'error') {
          resolve({
            folders: [],
            error: (resp && resp.message) || 'Failed to load folders',
          });
          return;
        }

        const remoteFolders = (resp.folders || []).map((subject) => ({
          id: subject.id,
          name: subject.subjectName || subject.name || 'Untitled',
        }));

        resolve({ folders: remoteFolders });
      }
    );
  });
}

async function createSubjectFolder(name, userInfo) {
  const folderName = (name || '').trim() || 'Untitled';

  if (!userInfo || !userInfo.userId || !userInfo.accessToken) {
    throw new Error(SIGN_IN_MESSAGE);
  }

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: 'createFolder',
        name: folderName,
        userId: userInfo.userId,
        accessToken: userInfo.accessToken,
      },
      (resp) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!resp || resp.status === 'error') {
          reject(new Error((resp && resp.message) || 'Failed to create folder'));
          return;
        }
        resolve(resp.folder);
      }
    );
  });
}

async function saveBookmarkToFirestore(bookmark, subjectId, userInfo) {
  if (!userInfo || !userInfo.userId || !userInfo.accessToken) {
    throw new Error(SIGN_IN_MESSAGE);
  }

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: 'saveBookmarkToFirestore',
        subjectId,
        bookmark,
        userId: userInfo.userId,
        accessToken: userInfo.accessToken,
      },
      (resp) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!resp || resp.status === 'error') {
          reject(new Error((resp && resp.message) || 'Failed to save bookmark'));
          return;
        }
        resolve(resp.bookmarkId || resp.noteId);
      }
    );
  });
}

function updateLocalBookmarkFolder(index, folder) {
  return new Promise((resolve) => {
    chrome.storage.local.get({ bookmarks: [] }, (res) => {
      const bookmarks = (res && res.bookmarks) || [];
      if (!bookmarks[index]) {
        resolve(bookmarks);
        return;
      }

      bookmarks[index].folderId = folder ? folder.id : null;
      bookmarks[index].folderName = folder ? folder.name : null;
      bookmarks[index].savedToFirestore = Boolean(folder);

      chrome.storage.local.set({ bookmarks }, () => {
        resolve(bookmarks);
      });
    });
  });
}

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
    try {
      if (el.dataset.bookmarkHoverAttached) return;
      el.dataset.bookmarkHoverAttached = '1';
      el.addEventListener('mouseenter', onMouseEnter);
      el.addEventListener('mouseleave', onMouseLeave);
    } catch (err) {
      console.error('attachHoverButtons error', err);
    }
  });
}

let currentBtn = null;
let hoveredEl = null;

function createButton() {
  const btn = document.createElement('button');
  btn.id = BUTTON_ID;
  btn.type = 'button';
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
  btn.addEventListener('mouseenter', () => {
    try {
      if (currentBtn) currentBtn.dataset.over = '1';
    } catch (err) {
      console.error('button mouseenter error', err);
    }
  });
  btn.addEventListener('mouseleave', () => {
    try {
      if (currentBtn) currentBtn.dataset.over = '';
    } catch (err) {
      console.error('button mouseleave error', err);
    }
  });
  return btn;
}

function onMouseEnter(e) {
  try {
    const target = e.currentTarget;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    hoveredEl = target;
    if (!currentBtn) {
      currentBtn = createButton();
      if (document.body) {
        document.body.appendChild(currentBtn);
      } else {
        currentBtn = null;
        return;
      }
    }
    positionButton(hoveredEl);
  } catch (err) {
    console.error('onMouseEnter error', err);
  }
}

function cleanupHoverButton() {
  if (!currentBtn) return;
  try {
    if (currentBtn.parentNode && typeof currentBtn.parentNode.removeChild === 'function') {
      currentBtn.parentNode.removeChild(currentBtn);
    }
  } catch (err) {
    // ignore context invalidation and detached nodes
  } finally {
    currentBtn = null;
    hoveredEl = null;
  }
}

function onMouseLeave() {
  setTimeout(() => {
    try {
      if (!currentBtn) return;
      if (currentBtn.dataset && currentBtn.dataset.over === '1') return;
      cleanupHoverButton();
    } catch (err) {
      console.error('onMouseLeave inner error', err);
    }
  }, 120);
}

function positionButton(targetEl) {
  try {
    if (!currentBtn || !targetEl || typeof targetEl.getBoundingClientRect !== 'function') return;
    const rect = targetEl.getBoundingClientRect();
    if (!rect) return;
    currentBtn.style.top = (window.scrollY + rect.top + 6) + 'px';
    currentBtn.style.left = (window.scrollX + rect.right - 36) + 'px';
  } catch (err) {
    console.error('positionButton error', err);
  }
}

function saveBookmarkFallback(bookmark) {
  try {
    const raw = localStorage.getItem('ai_bookmarks');
    const bookmarks = raw ? JSON.parse(raw) : [];
    bookmarks.unshift(bookmark);
    localStorage.setItem('ai_bookmarks', JSON.stringify(bookmarks));
  } catch (err) {
    console.error('saveBookmarkFallback error', err);
  }
}

function onBookmarkClick(e) {
  try {
    e.stopPropagation();
    e.preventDefault();
    const el = hoveredEl;
    if (!el) {
      alert('No message selected');
      return;
    }
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

    try {
      if (chrome && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
        chrome.runtime.sendMessage({type: 'saveBookmark', bookmark}, (resp) => {
          if (chrome.runtime.lastError) {
            saveBookmarkFallback(bookmark);
          }
          window.postMessage({type: 'bookmarkAdded'}, '*');
          alert('Bookmarked response! Click the 🔖 button to view your bookmarks.');
        });
      } else {
        saveBookmarkFallback(bookmark);
        window.postMessage({type: 'bookmarkAdded'}, '*');
        alert('Bookmarked response! Click the 🔖 button to view your bookmarks.');
      }
    } catch (err) {
      console.error('onBookmarkClick sendMessage error', err);
      saveBookmarkFallback(bookmark);
      window.postMessage({type: 'bookmarkAdded'}, '*');
      alert('Bookmarked response! Click the 🔖 button to view your bookmarks.');
    }
  } catch (err) {
    console.error('onBookmarkClick error', err);
  }
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

window.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'bookmarkPanelMessage') {
    const { action, index, text, bookmark } = event.data;

    if (action === 'getBookmarks') {
      try {
        chrome.storage.local.get({ bookmarks: [] }, (res) => {
          try {
            window.postMessage({
              type: 'bookmarkContentScriptResponse',
              action: 'bookmarksList',
              bookmarks: (res && res.bookmarks) || [],
            }, '*');
          } catch (err) {
            console.error('getBookmarks callback error', err);
          }
        });
      } catch (e) {
        window.postMessage({
          type: 'bookmarkContentScriptResponse',
          action: 'bookmarksList',
          bookmarks: [],
        }, '*');
      }
    } else if (action === 'getFolders') {
      const userInfo = await getCurrentUserInfo();
      if (!userInfo.isAuthenticated) {
        window.postMessage({
          type: 'bookmarkContentScriptResponse',
          action: 'foldersList',
          folders: [],
          error: userInfo.error || SIGN_IN_MESSAGE,
        }, '*');
        return;
      }

      const folderResult = await querySubjectFolders(userInfo);
      if (folderResult.error) {
        window.postMessage({
          type: 'bookmarkContentScriptResponse',
          action: 'foldersList',
          folders: [],
          error: folderResult.error,
        }, '*');
        return;
      }

      window.postMessage({
        type: 'bookmarkContentScriptResponse',
        action: 'foldersList',
        folders: folderResult.folders,
      }, '*');
    } else if (action === 'createFolder') {
      const name = event.data && event.data.name ? event.data.name : '';
      const userInfo = await getCurrentUserInfo();

      try {
        await createSubjectFolder(name, userInfo);
        const folderResult = await querySubjectFolders(userInfo);
        window.postMessage({
          type: 'bookmarkContentScriptResponse',
          action: 'foldersList',
          folders: folderResult.folders || [],
          justCreated: true,
          error: folderResult.error,
        }, '*');
        if (folderResult.error) {
          alert(folderResult.error);
        }
      } catch (err) {
        window.postMessage({
          type: 'bookmarkContentScriptResponse',
          action: 'foldersList',
          folders: [],
          error: err.message,
        }, '*');
        alert(err.message);
      }
    } else if (action === 'saveBookmarkToFolder') {
      const { index, folderId } = event.data;

      try {
        const userInfo = await getCurrentUserInfo();
        if (!userInfo.isAuthenticated) {
          alert(SIGN_IN_MESSAGE);
          return;
        }

        const folderResult = await querySubjectFolders(userInfo);
        const folder = folderResult.folders.find((f) => f.id === folderId);

        if (!folder) {
          alert('Folder not found. Please refresh the folder list and try again.');
          return;
        }

        const bookmarks = await new Promise((resolve) => {
          chrome.storage.local.get({ bookmarks: [] }, (res) => {
            resolve((res && res.bookmarks) || []);
          });
        });

        const bookmark = bookmarks[index];
        if (!bookmark) {
          alert('Bookmark not found.');
          return;
        }

        await saveBookmarkToFirestore(bookmark, folder.id, userInfo);
        const updatedBookmarks = await updateLocalBookmarkFolder(index, folder);

        window.postMessage({
          type: 'bookmarkContentScriptResponse',
          action: 'bookmarksList',
          bookmarks: updatedBookmarks,
        }, '*');

        alert('Bookmark saved to "' + folder.name + '"!');
      } catch (err) {
        console.error('saveBookmarkToFolder error', err);
        alert(err.message || 'Failed to save bookmark.');
      }
    } else if (action === 'removeBookmark') {
      try {
        chrome.storage.local.get({ bookmarks: [] }, (res) => {
          try {
            const bookmarks = (res && res.bookmarks) || [];
            bookmarks.splice(index, 1);
            chrome.storage.local.set({ bookmarks }, () => {
              window.postMessage({
                type: 'bookmarkContentScriptResponse',
                action: 'bookmarksList',
                bookmarks,
              }, '*');
            });
          } catch (err) {
            console.error('removeBookmark callback error', err);
          }
        });
      } catch (e) {
        console.error('removeBookmark error', e);
      }
    } else if (action === 'updateDescription') {
      try {
        chrome.storage.local.get({ bookmarks: [] }, (res) => {
          try {
            const bookmarks = (res && res.bookmarks) || [];
            if (bookmarks[index]) {
              bookmarks[index].description = text;
              chrome.storage.local.set({ bookmarks });
            }
          } catch (err) {
            console.error('updateDescription callback error', err);
          }
        });
      } catch (e) {
        console.error('updateDescription error', e);
      }
    } else if (action === 'clearAllBookmarks') {
      try {
        chrome.storage.local.set({ bookmarks: [] }, () => {
          window.postMessage({
            type: 'bookmarkContentScriptResponse',
            action: 'bookmarksList',
            bookmarks: [],
          }, '*');
        });
      } catch (e) {
        console.error('clearAllBookmarks error', e);
      }
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
  return true;
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

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.bookmarks) {
    window.postMessage({ type: 'bookmarkAdded' }, '*');
  }
});

attachHoverButtons();
setInterval(attachHoverButtons, 1500);
