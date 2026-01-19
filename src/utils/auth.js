
import { setUserEmail, setUserImageUrl, useLocalStorage } from "./helpers";
import { extensionExchangeUrl } from "./url_helpers";

export const [getAuthToken, setAuthToken, clearAuthToken] = useLocalStorage("nota_api_token");

export async function pollForPairingExchangeToken({
  pairingToken,
  exchangePairingToken,
  timeoutMs = 2 * 60 * 1000,
  pollIntervalMs = 1500,
  shouldCancel = () => false,
}) {
  const startMs = Date.now();

  while (Date.now() - startMs < timeoutMs) {
    if (shouldCancel()) {
      const error = new Error("canceled");
      error.code = "canceled";
      throw error;
    }

    try {
      const result = await exchangePairingToken(pairingToken);
      if (result?.token) {
        await setAuthToken(result.token)
        await setUserEmail(result.email)
        await setUserImageUrl(result.avatar_url)

        return
      }
    } catch {
      // Not ready yet; keep polling
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  const error = new Error("timeout");
  error.code = "timeout";
  throw error;
}

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

export async function exchangePairingToken(state) {

  return authedRequest(
    extensionExchangeUrl(state),
    { method: "GET" }
  );
}
