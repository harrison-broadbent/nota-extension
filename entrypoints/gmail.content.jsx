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
  runAt: "document_end",
  async main() {
    InboxSDK.load(2, INBOX_SDK_APP_ID).then((sdk) => {
      sdk.Conversations.registerThreadViewHandler((threadView) => {
        // Create a container element for the React app.
        const container = document.createElement("div");

        // Use InboxSDK to add a sidebar panel to the thread view.  Passing
        // our container here ensures that the panel will host our React app.
        const panel = threadView.addSidebarContentPanel({
          el: container,
          title: "Nota Inbox *",
          hideTitleBar: false,
        });

        // Mount the React NotesApp component into the container.
        const root = createRoot(container);
        root.render(<NotesApp sdk={sdk} threadView={threadView} />);

        // Clean up when the panel is destroyed.  This happens when the user
        // navigates away from the thread.  Unmounting prevents memory leaks.
        panel.on("destroy", () => {
          root.unmount();
        });
      });
    });
  },
});
