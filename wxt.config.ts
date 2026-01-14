import { defineConfig } from "wxt";

/**
 * WXT configuration for the Nota extension.  This file defines the extension's
 * manifest and registers the React module so that TypeScript and JSX
 * compilation work seamlessly.  Content scripts are discovered based on
 * filename conventions in the `src/entrypoints` directory, so no explicit
 * contentScripts key is needed.
 */
export default defineConfig({
  // Enable React support provided by WXT's module-react plugin.  This
  // automatically configures Vite and esbuild for JSX transformation.
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Nota Extension",
    description: "Display and add notes to email threads inside Gmail.",
    version: "0.1.1",
    manifest_version: 3,
    // Storage permission allows us to store the API token in chrome.storage.local.
    permissions: ["storage", "scripting"],
    // We only need host permissions for Gmail so that our content script can
    // run on mail.google.com.  WXT will automatically add the content
    // script to the manifest based on the entrypoint file name.
    host_permissions: ["https://mail.google.com/*"],
    web_accessible_resources: [
      {
        resources: ["pageWorld.js", "pageWorld.js.map"],
        matches: ["https://mail.google.com/*"],
      },
    ],
  },
});
