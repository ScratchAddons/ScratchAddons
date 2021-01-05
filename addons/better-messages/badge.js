//FIX https://api.scratch.mit.edu/users/user/messages/count message count

export default async function ({
	addon
}) {
	if (addon.auth.isLoggedIn) {
		// get id/xtoken info and save it to cookie for script.js to read
		var settingUsers = addon.settings.get("alt_accs").split(/[^a-zA-Z0-9_-]+/)
		var cookieUsers
		try {
			cookieUsers = JSON.parse(getCookie("sa-accounts"))
		} catch {
			cookieUsers = []
		}
		var users = []
		var parseCookie = {
			name: [],
			token: [],
			id: []
		}
		cookieUsers.forEach((user, index) => {
			// parse the stored cookie containing IDs and XTokens to make the next loop simpler
			var uValue = Object.values(user)
			var uKeys = Object.keys(user)
			parseCookie.name[index] = uKeys.indexOf("name") > -1 ? uValue[uKeys.indexOf("name")] : ""
			parseCookie.token[index] = uKeys.indexOf("token") > -1 ? uValue[uKeys.indexOf("token")] : ""
			parseCookie.id[index] = uKeys.indexOf("id") > -1 ? uValue[uKeys.indexOf("id")] : ""
		})
		settingUsers.forEach((user, index) => {
			// get the IDs and XTokens of each user that will have messages combined
			users[index] = {}
			users[index]["name"] = user
			if (user == addon.auth.username) {
				// get the current user's ID and XToken from the addon.auth API
				users[index]["token"] = addon.auth.xToken
				users[index]["id"] = addon.auth.userId
			} else {
				// try getting other accounts' IDs and XTokens from the cookie
				users[index]["token"] = parseCookie.token[parseCookie.name.indexOf(user)]
				users[index]['id'] = parseCookie.id[parseCookie.name.indexOf(user)]
			}
		})
		setCookie("accounts", JSON.stringify(users))
	}
}