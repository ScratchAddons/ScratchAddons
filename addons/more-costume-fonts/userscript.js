export default async function ({ addon, console }) {
	
	const paper = await addon.tab.traps.getPaper();
	const updateImage = paper.tool.onUpdateImage.bind('paper.tool');
	const fonts = [
		{ 'name': 'Sans Serif', 'family': 'Sans Serif' },
		{ 'name': 'Serif', 'family': 'Serif' },
		{ 'name': 'Handwriting', 'family': 'Handwriting' },
		{ 'name': 'Marker', 'family': 'Marker' },
		{ 'name': 'Curly', 'family': 'Curly' },
		{ 'name': 'Pixel', 'family': 'Pixel' },
		{ 'name': '中文', 'family': '"Microsoft YaHei", "微软雅黑", STXihei, "华文细黑"' },
		{ 'name': '日本語', 'family': '"ヒラギノ角ゴ Pro W3", "Hiragino Kaku Gothic Pro", Osaka, "メイリオ", Meiryo, "ＭＳ Ｐゴシック", "MS PGothic"' },
		{ 'name': '한국어', 'family': 'Malgun Gothic' },
		{ 'name': 'Scratch', 'family': 'Scratch' },
		{ 'name': 'Arial', 'family': 'Arial' },
		{ 'name': 'Helvetica', 'family': 'Helvetica' },
		{ 'name': 'Verdana', 'family': 'Verdana' },
		{ 'name': 'Impact', 'family': 'Impact' },
		{ 'name': 'Monospace', 'family': 'Monospace' }
	]
	
	function setFont(font, update) {
		paper.tool.changeFont(font.font);
		document.querySelector("[class*='font-dropdown_mod-unselect']").click();
		updateImage();
	}
	
	function addNewFont(font, previousFont, modContextMenu) {
		const button = document.createElement('span');
		button.className = addon.tab.scratchClass('button_button') + ' ' + addon.tab.scratchClass('font-dropdown_mod-menu-item');
		const label = document.createElement('span');
		label.textContent = font.name;
		label.style.fontFamily = font.family;
		button.appendChild(label);
		modContextMenu.appendChild(button);
		button.addEventListener('click', function(){ setFont(font); }, false);
		button.addEventListener('mouseover', function(){ paper.tool.changeFont(font.family); }, false);
		button.addEventListener('mouseout', function(){ paper.tool.changeFont(previousFont); }, false);
	}

	while (true) {
		const elem = await addon.tab.waitForElement("[class*='font-dropdown_mod-context-menu'], [class*='font-dropdown_displayed-font-name']", {
			markAsSeen: true,
		});
		
		if (elem.classList.contains(addon.tab.scratchClass('font-dropdown_mod-context-menu')) && elem.classList.contains(addon.tab.scratchClass('input-group_input-group'))) {
			elem.textContent = '';
			fonts.forEach((font) => addNewFont(font, paper.tool.font, elem));
			console.log(paper.tool.font);
		} else {
			elem.style.fontFamily = paper.tool.font;
			let observer = new MutationObserver(mutationRecords => {
				elem.style.fontFamily = paper.tool.font;
			});
			observer.observe(elem, {
				subtree: true,
				characterDataOldValue: true,
			});
		}
	}
 }
 