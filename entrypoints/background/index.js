import { defineBackground } from "wxt/utils/define-background";

// This registers the MV3 messaging/scripting bridge InboxSDK expects
import "@inboxsdk/core/background.js";

export default defineBackground(() => {
  // no runtime code needed here; InboxSDK background.js wires itself up
});
