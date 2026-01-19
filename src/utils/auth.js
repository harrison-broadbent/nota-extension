
import { BACKEND_BASE_URL, extensionExchangeUrl } from "./url_helpers";
import { getUserEmail, getUserImageUrl, setUserEmail, setUserImageUrl, getAuthToken, setAuthToken } from "../../src/utils/helpers";

/**
 * InboxSDK can throw depending on timing / Gmail context, so centralize this.
 */
export function getMailboxEmailAddressFromInboxSdk(sdk) {
  try {
    return sdk.User.getEmailAddress();
  } catch {
    return "";
  }
}

function extractExtensionStateFromUrl(url) {
  const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
  const hashParams = new URLSearchParams(hash);

  return hashParams.get("extension_state");
}

export async function handleBackgroundAuth(url) {
  if (url.origin === BACKEND_BASE_URL) {
    const extensionState = extractExtensionStateFromUrl(url);

    if (!extensionState) return;
    if (await getAuthToken() !== null) return;

    try {
      await exchangeExtensionStateForAuthToken(extensionState);
      console.log(">>> done!")
      console.log(">>> auth token", await getAuthToken())
      console.log(">>> user", await getUserEmail())
      console.log(">>> image", await getUserImageUrl())

      // Scrub the hash from the URL so it doesn't linger in the address bar.
      url.hash = ""
      await browser.tabs.update(tabId, { url: url.toString() });
    } catch (error) {
      console.error("Failed to exchange extension state:", error);
    }
  }
}

export async function exchangeExtensionStateForAuthToken(extensionState) {
  const response = await fetch(extensionExchangeUrl(extensionState), {
    method: "GET",
    credentials: "omit",
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Extension exchange failed: ${response.status} ${responseText}`);
  }

  const responseJson = await response.json();
  if (!responseJson || !responseJson.token) {
    throw new Error("Extension exchange response missing token");
  }

  await setAuthToken(responseJson.token)
  await setUserEmail(responseJson.email)
  await setUserImageUrl(responseJson.avatar_url)
}
