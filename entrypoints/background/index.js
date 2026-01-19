import { defineBackground } from "wxt/utils/define-background";
import { getAuthToken, setAuthToken } from "../../src/utils/auth";

// This registers the MV3 messaging/scripting bridge InboxSDK expects
import "@inboxsdk/core/background.js";
import { getUserEmail, getUserImageUrl, setUserEmail, setUserImageUrl } from "../../src/utils/helpers";
import { BACKEND_BASE_URL, extensionExchangeUrl, extensionPairingUrl } from "../../src/utils/url_helpers";

function extractExtensionStateFromUrl(url) {
  const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
  const hashParams = new URLSearchParams(hash);

  return hashParams.get("extension_state");
}

// function handleExtensionAuth(tabId, changeInfo, tab) {
//   // Grab initial JWT token
//   if (changeInfo.url && changeInfo.url.includes("attendlist_token=")) {
//     const url = new URL(changeInfo.url);
//     const token = new URLSearchParams(url.hash.substring(1)).get("attendlist_token");

//     if (token) {
//       await setAuthToken(token);
//       const { payload } = decodeJwt(token);
//       console.log("✅ Token saved from postinstall:", payload);
//     }
//   }
// }

async function exchangeExtensionStateForAuthToken(extensionState) {
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

  console.log(">>> responseJson", responseJson)

  await setAuthToken(responseJson.token)
  await setUserEmail(responseJson.email)
  await setUserImageUrl(responseJson.avatar_url)
}

export default defineBackground(() => {
  // 1) On first install, open the backend pairing URL.
  browser.runtime.onInstalled.addListener(async (details) => {
    if (details.reason !== "install") return;

    await browser.tabs.create({ url: extensionPairingUrl() });
  });

  // 2) Watch for the install page that includes the extension_state anchor.
  //    When detected, exchange it for the real auth token and persist it.
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    console.log(">>> running onUpdated listener")
    const urlString = changeInfo.url || tab.url;
    if (!urlString) return;

    const url = new URL(urlString)
    console.log(url, url.origin, url.origin == BACKEND_BASE_URL)

    if (url.origin === BACKEND_BASE_URL) {
      console.log(">>> preparing for pairing")
      const extensionState = extractExtensionStateFromUrl(url);

      console.log(">>>", extensionState)
      if (!extensionState) return;

      if (await getAuthToken() !== null) return;

      try {
        console.log(">>> exchanging")
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
  });
});
