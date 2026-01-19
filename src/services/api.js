import { getAuthToken, clearAuthToken } from "../utils/helpers.js";
import { emailThreadEmailNotesUrl, emailThreadUrl, extensionExchangeUrl, extensionPairingUrl, urlWithQueryParams } from "../utils/url_helpers.js";

/**
 * Helper function to perform an HTTP request with automatic Authorization
 * header injection.  It throws an Error if the response status is not
 * successful.  When a 401 is returned, the auth token is cleared so the
 * caller can prompt the user to log in again.
 */
async function authedRequest(path, options) {
  const token = await getAuthToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const response = await fetch(path, {
    ...options,
    headers,
    credentials: "omit",
  });

  if (response.status === 401) {
    await clearAuthToken();
    throw new Error("unauthenticated");
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `Backend returned ${response.status}: ${message || response.statusText}`
    );
  }

  const data = await response.json();
  return data;
}

/**
 * Fetch the details of a thread along with its notes.  The parameters
 * correspond to the Rails EmailThreadsController#show endpoint.  The
 * threadSubject is required when the thread does not yet exist on the backend.
 */
export async function fetchThread(gmailThreadId, subject, mailboxEmailAddress) {
  console.log(">>> fetchThread params:")
  console.log(">>>", subject)
  console.log(">>>", mailboxEmailAddress)

  return authedRequest(
    urlWithQueryParams(emailThreadUrl(gmailThreadId),
      {
        thread_subject: subject,
        mailbox_email_address: mailboxEmailAddress,
      }),
    { method: "GET" }
  );
}

/**
 * Create a new note associated with the given Gmail thread.  On success
 * the backend returns the updated thread and note list.
 */
export async function createNote(gmailThreadId, subject, mailboxEmailAddress, body) {
  const payload = {
    thread_subject: subject,
    mailbox_email_address: mailboxEmailAddress,
    note: { body },
  };

  return authedRequest(emailThreadEmailNotesUrl(gmailThreadId), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
