import { defineBackground } from "wxt/utils/define-background";
import { handleBackgroundAuth } from "../../src/utils/auth";
import { extensionPairingUrl } from "../../src/utils/url_helpers";

// This registers the MV3 messaging/scripting bridge InboxSDK expects
import "@inboxsdk/core/background.js";

export default defineBackground(() => {
  // 1) On first install, open the backend pairing URL.
  browser.runtime.onInstalled.addListener(async (details) => {
    if (details.reason !== "install") return;

    await browser.tabs.create({ url: extensionPairingUrl() });
  });

  // 2) Watch for the install page that includes the extension_state anchor.
  //    When detected, exchange it for the real auth token and persist it.
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    const urlString = changeInfo.url || tab.url;
    if (!urlString) return;

    const url = new URL(urlString)
    await handleBackgroundAuth(url)
  });
});
