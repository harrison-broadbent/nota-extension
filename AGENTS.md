# Agents

## Project overview

Nota Extension is a Chrome extension that adds a notes sidebar to Gmail. Built with [WXT](https://wxt.dev), React, TailwindCSS, and InboxSDK.
The extension mounts a shadow DOM panel inside Gmail to avoid clobbering Gmail's styles.

## You and your goals

1. Help me develop this extension by adding new features etc.
2. Write clean, simple code. I'm not a React/Javascript developer by default, so please lean to clean, simple implementations that are easy to understand, maintain, and refactor.

## Tech stack

- **WXT** — browser extension framework (handles manifest, dev server, bundling)
- **React** — UI components
- **TailwindCSS** — styling
- **InboxSDK** — Gmail integration (thread views, mailbox info) (link: https://inboxsdk.github.io/inboxsdk-docs/)

## Auth flow

Auth is token-based via a hit to a backend Ruby on Rails app. The token is stored in `browser.storage`. When unauthenticated, the extension opens a pairing URL in a new tab.
The background script persists the token; `browser.storage.onChanged` triggers a re-check in the content script.

## Backend

This extension communicates with a Ruby on Rails backend via API calls.
