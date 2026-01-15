
export const BACKEND_BASE_URL = "http://localhost:3000";
export const BACKEND_API_BASE_URL = `${BACKEND_BASE_URL}/api/v1`;

export const emailThreadsWebUrl = () => { return BACKEND_BASE_URL + "/email_threads" }
export const emailThreadWebUrl = (threadId) => { return BACKEND_BASE_URL + "/email_threads/" + encodeURIComponent(threadId); }
export const emailThreadUrl = (threadId) => { return BACKEND_API_BASE_URL + "/email_threads/" + encodeURIComponent(threadId); }
export const emailThreadEmailNotesUrl = (threadId) => { return BACKEND_API_BASE_URL + "/email_threads/" + encodeURIComponent(threadId) + "/email_notes" }
export const extensionPairingUrl = (pairingState) => { return BACKEND_BASE_URL + "/extension/pair?state=" + encodeURIComponent(pairingState); }
export const extensionExchangeUrl = (pairingState) => { return BACKEND_API_BASE_URL + "/extension/exchange?state=" + encodeURIComponent(pairingState); }

export function urlWithQueryParams(baseUrl, queryParams = {}) {
	const urlObject = new URL(baseUrl);

	for (const [queryParamKey, queryParamValue] of Object.entries(queryParams)) {
		if (queryParamValue === undefined || queryParamValue === null) continue;

		if (Array.isArray(queryParamValue)) {
			// Represent arrays as repeated params: ?tag=a&tag=b
			for (const arrayValue of queryParamValue) { urlObject.searchParams.append(queryParamKey, String(arrayValue)); }
		} else {
			urlObject.searchParams.set(queryParamKey, String(queryParamValue));
		}
	}

	return urlObject.toString();
}
