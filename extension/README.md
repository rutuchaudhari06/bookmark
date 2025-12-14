# AI Chat Bookmark - Chrome Extension

What it does
- Lets you bookmark a specific AI chat response by hovering over a message and clicking the small 🔖 button that appears.
- Stores bookmarks (snippet, page URL, time) in Chrome storage.
- Popup UI lists bookmarks; click Jump to scroll to the response on the page. Add short descriptions/notes.

How to load for development
1. Save these files into a folder.
2. In Chrome, open chrome://extensions and enable Developer mode.
3. Click 'Load unpacked' and select the folder.
4. Visit any AI chat page (ChatGPT etc.), hover over responses and click the 🔖 button to bookmark.

Notes
- Uses heuristics to find message elements. Works best on sites where responses are distinct elements.
- Jump uses a stored data attribute or snippet search; dynamic sites may need a reload for the bookmark to be found.
- popup.html uses babel-standalone and remote React for dev ease. For production, bundle the popup into static JS.
