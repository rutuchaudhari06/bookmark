/**
 * Sends Firebase auth from the AIMarks React app to the Chrome extension.
 *
 * Uses window.postMessage (picked up by the extension content script on this origin)
 * and optionally chrome.runtime.sendMessage when VITE_EXTENSION_ID is configured.
 */

const AUTH_MESSAGE_TYPE = "AIMARKS_AUTH_TO_EXTENSION";
const AUTH_CLEAR_TYPE = "AIMARKS_AUTH_CLEAR";

function postAuthMessage(type, payload) {
  window.postMessage({ type, payload }, window.location.origin);
}

function sendAuthToExtensionDirect(message) {
  const extensionId = import.meta.env.VITE_EXTENSION_ID;
  if (!extensionId || !window.chrome?.runtime?.sendMessage) {
    return;
  }

  try {
    window.chrome.runtime.sendMessage(extensionId, message, () => {
      // Ignore errors when extension is not installed.
      void window.chrome.runtime.lastError;
    });
  } catch {
    // Extension API unavailable outside a browser with the extension installed.
  }
}

export async function syncAuthToExtension(user) {
  if (!user) {
    clearAuthFromExtension();
    return;
  }

  const accessToken = await user.getIdToken();
  const tokenResult = await user.getIdTokenResult();
  const expirationTime = new Date(tokenResult.expirationTime).getTime();

  const auth = {
    userId: user.uid,
    accessToken,
    expirationTime,
    syncedAt: Date.now(),
  };

  // Primary: direct message to extension background (works without content script).
  sendAuthToExtensionDirect({ type: "syncFirebaseAuth", auth });
  // Fallback: content script on AIMarks pages relays this into chrome.storage.local.
  postAuthMessage(AUTH_MESSAGE_TYPE, auth);
}

export function clearAuthFromExtension() {
  sendAuthToExtensionDirect({ type: "clearFirebaseAuth" });
  postAuthMessage(AUTH_CLEAR_TYPE, null);
}
