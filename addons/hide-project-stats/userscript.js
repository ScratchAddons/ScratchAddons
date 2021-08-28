export default async function ({ addon, global, console, msg, safeMsg: m }) {
    let loves = {state: false};
    let favorites = {state: false};

    function toggleLabels(manualState) {
        console.log('State toggled')
        toggleOnButton(loves, 'love', manualState);
        toggleOnButton(favorites, 'favorite', manualState);
    }

    function toggleOnButton(button, name, manualState) {
        if (typeof(manualState) == 'boolean') {
            button.state = manualState;
        }
        if (button.element == undefined) {
            button.element = document.getElementsByClassName(`project-${name}s`)[0];
        }
        if (addon.settings.get(`${name}s`) != button.state || (addon.self.disabled && button.state)) {
            if (addon.settings.get(`${name}s`) && !addon.self.disabled) {
                // Setting was turned on
                button.count = button.element.textContent;
                button.element.innerText = m(name);
                button.state = true;
            } else {
                // Setting was turned off
                button.element.innerText = button.count;
                button.state = false;
            }
            // Prevents flash of count before addon loads
            button.element.style = 'visibility: visible;';
        }
    }

    toggleLabels();

    addon.settings.addEventListener("change", () => { toggleLabels(); });
    addon.self.addEventListener("disabled", () => { toggleLabels(); });
    addon.self.addEventListener("reenabled", () => { toggleLabels(); });
    addon.tab.redux.addEventListener("statechanged", (data) => {
        if (data.detail.action.type === "SET_LOVED") { toggleLabels(false); }
        if (data.detail.action.type === "SET_FAVED") { toggleLabels(false); }
    });
}