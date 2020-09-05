export default async function ({addon, console}) {
	document.querySelector(".youtube-player").setAttribute("allowfullscreen", true);
	document.querySelector(".youtube-player").src += ""; // reload video
};
