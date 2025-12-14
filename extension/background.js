chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Chat Bookmark installed');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'saveBookmark') {
    chrome.storage.local.get({bookmarks: []}, (res) => {
      const bookmarks = res.bookmarks || [];
      bookmarks.unshift(message.bookmark);
      chrome.storage.local.set({bookmarks}, () => {
        sendResponse({status: 'ok'});
      });
    });
    return true; // indicates async response
  }
});
