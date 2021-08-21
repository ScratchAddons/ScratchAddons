export default async function ({ addon, global, console }) {
	//Emojis
	const emojis = [
		{text: "_meow_", image: "/images/emoji/meow.png"},
		{text: "_gobo_", image: "/images/emoji/gobo.png"},
		{text: "_:)_", image: "/images/emoji/cat.png"},
		{text: "_:D_", image: "/images/emoji/aww-cat.png"},
		{text: "_B)_", image: "/images/emoji/cool-cat.png"},
		{text: "_:P_", image: "/images/emoji/tongue-out-cat.png"},
		{text: "_;P_", image: "/images/emoji/wink-cat.png"},
		{text: "_:'P_", image: "/images/emoji/lol-cat.png"},
		{text: "_P:_", image: "/images/emoji/upside-down-cat.png"},
		{text: "_:3_", image: "/images/emoji/huh-cat.png"},
		{text: "_<3_", image: "/images/emoji/love-it-cat.png"},
		{text: "_**_", image: "/images/emoji/fav-it-cat.png"},
		{text: "_:))_", image: "/images/emoji/rainbow-cat.png"},
		{text: "_:D<_", image: "/images/emoji/pizza-cat.png"},
		{text: "_10mil_", image: "/images/emoji/10mil.png"},
		{text: "_waffle_", image: "/images/emoji/waffle.png"},
		{text: "_taco_", image: "/images/emoji/taco.png"},
		{text: "_sushi_", image: "/images/emoji/sushi.png"},
		{text: "_apple_", image: "/images/emoji/apple.png"},
		{text: "_broccoli_", image: "/images/emoji/broccoli.png"},
		{text: "_pizza_", image: "/images/emoji/pizza.png"},
		{text: "_candycorn_", image: "/images/emoji/candycorn.png"},
		{text: "_map_", image: "/images/emoji/map.png"},
		{text: "_camera_", image: "/images/emoji/camera.png"},
		{text: "_suitcase_", image: "/images/emoji/suitcase.png"},
		{text: "_compass_", image: "/images/emoji/compass.png"},
		{text: "_binoculars_", image: "/images/emoji/binoculars.png"},
		{text: "_cupcake_", image: "/images/emoji/cupcake.png"},
		{text: "_pride_", image: "/images/emoji/pride.png"},
		{text: "_blm_", image: "/images/emoji/blm.png"}
	];
	//Create picker
	var emojiPicker = document.createElement("div");
	emojiPicker.id = "sa-emoji-picker";
	addon.tab.displayNoneWhileDisabled(emojiPicker, {display: "inline-block"});
	//Create picker items
	emojis.forEach(
		(emoji) => {
			//Container for emoji picker item
			let container = document.createElement("span");
			container.classList.add("sa-emoji-picker-item");
			//The actual item
			let item = document.createElement("img");
			item.dataset.text = emoji.text;
			item.src = emoji.image;
			item.classList.add("sa-emoji-picker-item-inner");
			item.classList.add("emoji");
			//Append
			container.appendChild(item);
			emojiPicker.appendChild(container);
		}
	);
	
	//Function for showing the emoji picker
	const showEmojiPicker = function() {
		this.appendChild(emojiPicker);
		//Also add effect on emoji button
		this.children[0].classList.add("sa-emoji-button-selected");
	}
	
	//Hide emoji picker when clicked outside of
	document.addEventListener('mouseup', function(event) {
		if (!emojiPicker.contains(event.target)) {
			emojiPicker.remove();
		}
		//Also deselect emoji buttons
		document.querySelectorAll(".sa-emoji-button.sa-emoji-button-selected").forEach(
			(e) => e.classList.remove("sa-emoji-button-selected")
		);
	});
	
	//Add emoji buttons
	while (true) {
		const textBox = await addon.tab.waitForElement('textarea[id*="frc-compose-comment"]', {
			markAsSeen: true,
			reduxCondition: (state) => {
				if (!state.scratchGui) return true;
				return state.scratchGui.mode.isPlayerOnly;
			},
		});
		const textContainer = textBox.parentElement;
		//The emoji button
		let emojiButton = document.createElement("div");
		emojiButton.classList.add("sa-emoji-button-container");
		emojiButton.onclick = showEmojiPicker;
		//Text inside the emoji button
		let emojiButtonText = document.createElement("span");
		emojiButtonText.textContent = "🙂";
		emojiButtonText.title = "Button added by the Scratch Addons browser extension"
		emojiButtonText.classList.add("sa-emoji-button");
		emojiButton.appendChild(emojiButtonText);
		addon.tab.displayNoneWhileDisabled(emojiPicker, {display: "inline-block"});
		//Append
		textContainer.appendChild(emojiButton);
	}
}