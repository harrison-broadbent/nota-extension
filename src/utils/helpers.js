export const [getUserEmail, setUserEmail, clearUserEmail] = useLocalStorage("nota_user_email");
export const [getUserImageUrl, setUserImageUrl, clearUserImageUrl] = useLocalStorage("nota_user_image_url");
export const [getAuthToken, setAuthToken, clearAuthToken] = useLocalStorage("nota_api_token");

export function useLocalStorage(key) {
	const storageKey = `local:${key}`;

	const getValue = async () => {
		const value = await storage.getItem(storageKey);
		return value ?? null;
	};

	const setValue = async (value) => { await storage.setItem(storageKey, value) };
	const clearValue = async () => { await storage.removeItem(storageKey) };

	return [getValue, setValue, clearValue];
}
