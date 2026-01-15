import { createRoot } from "react-dom/client";
import InboxSDK from "@inboxsdk/core";

// Import Tailwind styles.  WXT will bundle this CSS and inject it into the page.
import "../src/styles.css";
import NotesApp from "../src/components/NotesApp";

const INBOX_SDK_APP_ID = "sdk_Nota-email_e2bb0155f1";

/**
 * Content script entrypoint for the Nota extension.  This script is only
 * executed on Gmail pages (mail.google.com).  It waits for InboxSDK to load
 * and then registers a handler for each thread view.  The handler creates
 * a sidebar panel and mounts the React NotesApp into it.  When the panel
 * is destroyed (e.g. when navigating away from the thread), the React
 * component is unmounted to free resources.
 */
export default defineContentScript({
  matches: ["https://mail.google.com/*"],
  runAt: "document_idle",
  cssInjectionMode: "ui",
  async main(ctx) {
    const sdk = await InboxSDK.load(2, INBOX_SDK_APP_ID);
    sdk.Conversations.registerThreadViewHandler((threadView) => {
      const container = document.createElement("div");
      const panel = threadView.addSidebarContentPanel({
        el: container,
        title: "Nota Inbox *",
        hideTitleBar: true,
        iconUrl: chrome.runtime.getURL("icons/notes.png"),
      });

      (async () => {
        let reactRoot;
        const ui = await createShadowRootUi(ctx, {
          name: "nota-sidebar-ui",
          position: "inline",
          anchor: container,
          onMount: (shadowContainer) => {
            const wrapper = document.createElement("div");
            shadowContainer.append(wrapper);
            reactRoot = createRoot(wrapper);
            reactRoot.render(<NotesApp sdk={sdk} threadView={threadView} />);
          },
          onRemove: () => {
            reactRoot?.unmount();
          },
        });

        ui.mount();
        panel.on("destroy", () => {
          ui.remove();
        });
      })();
    });
  },
});
