const FIREBASE_PROJECT_ID = 'flash-card-project-db697';
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;
const AUTH_STORAGE_KEY = 'firebaseAuth';

chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Chat Bookmark installed');
});

function parseFirestoreValue(value) {
  if (!value || typeof value !== 'object') return null;
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.integerValue !== undefined) return Number(value.integerValue);
  if (value.doubleValue !== undefined) return Number(value.doubleValue);
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.nullValue !== undefined) return null;
  if (value.timestampValue !== undefined) return value.timestampValue;
  if (value.arrayValue !== undefined) {
    const values = value.arrayValue.values || [];
    return values.map(parseFirestoreValue);
  }
  if (value.mapValue !== undefined) {
    const fields = value.mapValue.fields || {};
    const parsed = {};
    Object.keys(fields).forEach((key) => {
      parsed[key] = parseFirestoreValue(fields[key]);
    });
    return parsed;
  }
  return null;
}

function parseFirestoreDocument(document) {
  if (!document) return null;
  const fields = document.fields || {};
  const parsed = {
    id: document.name ? document.name.split('/').pop() : null,
  };
  Object.keys(fields).forEach((key) => {
    parsed[key] = parseFirestoreValue(fields[key]);
  });
  return parsed;
}

function toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (typeof value === 'boolean') return { booleanValue: value };
  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map((item) => toFirestoreValue(item)),
      },
    };
  }
  return { stringValue: String(value) };
}

function authHeaders(accessToken) {
  const headers = { 'Content-Type': 'application/json' };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
}

async function runFirestoreQuery(accessToken, structuredQuery) {
  const url = `${FIRESTORE_BASE_URL}:runQuery`;
  const response = await fetch(url, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify({ structuredQuery }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Firestore query failed ${response.status}: ${text}`);
  }

  return response.json();
}

async function createBookmark(accessToken, subjectId, bookmark, userId) {

  console.log("===== CREATE BOOKMARK =====");
  console.log("subjectId:", subjectId);
  console.log("bookmark:", bookmark);

  const url = `${FIRESTORE_BASE_URL}/subjects/${subjectId}/bookmarks`;

  console.log("POST URL:", url);

  const body = {
    fields: {
      title: toFirestoreValue(bookmark.title || ""),
      snippet: toFirestoreValue(bookmark.snippet || ""),
      fullText: toFirestoreValue(bookmark.fullText || ""),
      url: toFirestoreValue(bookmark.url || ""),
      description: toFirestoreValue(bookmark.description || ""),
      createdBy: toFirestoreValue(userId),
      createdAt: {
        timestampValue: new Date().toISOString()
      }
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify(body),
  });

  console.log("Status:", response.status);

  const text = await response.text();
  console.log("Response:", text);

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Save bookmark failed ${response.status}: ${text}`);
  }

  const json = await response.json();
  return parseFirestoreDocument(json);
}

async function queryUserSubjects(userId, accessToken) {
  if (!userId || !accessToken) {
    return [];
  }

  const ownerQuery = {
    from: [{ collectionId: 'subjects' }],
    where: {
      fieldFilter: {
        field: { fieldPath: 'ownerId' },
        op: 'EQUAL',
        value: { stringValue: userId },
      },
    },
  };

  const collaboratorQuery = {
    from: [{ collectionId: 'subjects' }],
    where: {
      fieldFilter: {
        field: { fieldPath: 'collaborators' },
        op: 'ARRAY_CONTAINS',
        value: { stringValue: userId },
      },
    },
  };

  const results = [];
  const seenIds = new Set();

  for (const structuredQuery of [ownerQuery, collaboratorQuery]) {
    try {
      const queryResponse = await runFirestoreQuery(accessToken, structuredQuery);
      if (Array.isArray(queryResponse)) {
        queryResponse.forEach((item) => {
          const doc = item.document;
          if (!doc) return;
          const parsed = parseFirestoreDocument(doc);
          if (parsed && parsed.id && !seenIds.has(parsed.id)) {
            seenIds.add(parsed.id);
            results.push(parsed);
          }
        });
      }
    } catch (err) {
      console.error('Firestore query error:', err);
    }
  }

  return results;
}

async function createSubjectDocument(accessToken, subjectName, userId) {
  const url = `${FIRESTORE_BASE_URL}/subjects`;
  const body = {
    fields: {
      subjectName: toFirestoreValue(subjectName),
      ownerId: toFirestoreValue(userId),
      collaborators: toFirestoreValue([]),
      shareToken: toFirestoreValue(''),
      createdAt: { timestampValue: new Date().toISOString() },
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Create subject failed ${response.status}: ${text}`);
  }

  const json = await response.json();
  return parseFirestoreDocument(json);
}

function saveFirebaseAuth(auth) {
  if (!auth || !auth.userId || !auth.accessToken) {
    return Promise.reject(new Error('Invalid auth payload'));
  }

  return chrome.storage.local.set({
    [AUTH_STORAGE_KEY]: {
      userId: auth.userId,
      accessToken: auth.accessToken,
      expirationTime: auth.expirationTime || null,
      syncedAt: auth.syncedAt || Date.now(),
    },
  });
}

function clearFirebaseAuth() {
  return chrome.storage.local.remove(AUTH_STORAGE_KEY);
}

function handleExtensionMessage(message, sendResponse) {
  if (message.type === 'syncFirebaseAuth') {
    saveFirebaseAuth(message.auth)
      .then(() => {
        sendResponse({ status: 'ok' });
      })
      .catch((err) => {
        console.error('syncFirebaseAuth failed:', err);
        sendResponse({ status: 'error', message: err.message });
      });
    return true;
  }

  if (message.type === 'clearFirebaseAuth') {
    clearFirebaseAuth()
      .then(() => {
        sendResponse({ status: 'ok' });
      })
      .catch((err) => {
        console.error('clearFirebaseAuth failed:', err);
        sendResponse({ status: 'error', message: err.message });
      });
    return true;
  }

  if (message.type === 'saveBookmark') {
    chrome.storage.local.get({ bookmarks: [] }, (res) => {
      const bookmarks = res.bookmarks || [];
      bookmarks.unshift(message.bookmark);
      chrome.storage.local.set({ bookmarks }, () => {
        sendResponse({ status: 'ok' });
      });
    });
    return true;
  }

  if (message.type === 'getFolders') {
    const { userId, accessToken } = message;

    if (!userId || !accessToken) {
      sendResponse({ status: 'error', message: 'Please sign in to AIMarks', folders: [] });
      return true;
    }

    queryUserSubjects(userId, accessToken)
      .then((folders) => {
        sendResponse({ status: 'ok', folders });
      })
      .catch((err) => {
        console.error('getFolders failed:', err);
        sendResponse({ status: 'error', message: err.message, folders: [] });
      });
    return true;
  }

  if (message.type === 'createFolder') {
    const { userId, accessToken, name } = message;

    if (!userId || !accessToken) {
      sendResponse({ status: 'error', message: 'Please sign in to AIMarks' });
      return true;
    }

    createSubjectDocument(accessToken, name, userId)
      .then((doc) => {
        sendResponse({
          status: 'ok',
          folder: {
            id: doc.id,
            name: doc.subjectName || name,
          },
        });
      })
      .catch((err) => {
        console.error('createFolder failed:', err);
        sendResponse({ status: 'error', message: err.message });
      });
    return true;
  }

  if (message.type === 'saveBookmarkToFirestore') {
    const { userId, accessToken, subjectId, bookmark } = message;

    if (!userId || !accessToken) {
      sendResponse({ status: 'error', message: 'Please sign in to AIMarks' });
      return true;
    }

    createBookmark(accessToken, subjectId, bookmark, userId)
      .then((doc) => {
        sendResponse({ status: 'ok', bookmarkId: doc.id });
      })
      .catch((err) => {
        console.error('saveBookmarkToFirestore failed:', err);
        sendResponse({ status: 'error', message: err.message });
      });
    return true;
  }

  return false;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  return handleExtensionMessage(message, sendResponse);
});

// React app sends auth directly via chrome.runtime.sendMessage(extensionId, …)
chrome.runtime.onMessageExternal.addListener((message, _sender, sendResponse) => {
  return handleExtensionMessage(message, sendResponse);
});
