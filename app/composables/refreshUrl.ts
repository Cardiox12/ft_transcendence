export async function refreshUrl() {
	try {
		const user = await getRefreshedUserAuthenticate();
		const route = useRoute();
		if (route.params.username !== user.value.username) {
			console.log("refresh page");
			await redirectIfConnected (route.fullPath.replace(String(route?.params?.username), user.value.username), '/');
		}
	}
	catch {
		navigateTo('/');
	}
}