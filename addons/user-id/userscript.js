export default function ({ addon }) {
	let usernameHeader = document.querySelector("header-text").firstElementChild;
	const userId = Object.assign(document.createElement("font"), {
		innerText: `#${Scratch.INIT_DATA.PROFILE.model.userId}`,
		className: "sa-user-id"
	});
	userId.style.color = "lightgrey";
	userId.style.size = 2;
	
	usernameHeader.appendChild(userId)
}
