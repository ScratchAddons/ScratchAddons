<img src="https://raw.githubusercontent.com/ScratchAddons/ScratchAddons/master/images/icon.svg" alt="Scratch Addons logo" align="right" width="128px"></img>
# Scratch Addons browser extension

[![](https://img.shields.io/chrome-web-store/v/fbeffbjdlemaoicjdapfpikkikjoneco?style=flat-square&logo=google-chrome&logoColor=white&label=version&color=E23A2E)](https://chrome.google.com/webstore/detail/fbeffbjdlemaoicjdapfpikkikjoneco)
[![](https://img.shields.io/amo/v/scratch-messaging-extension?style=flat-square&logo=firefox-browser&logoColor=white&label=version&color=FF7139)](https://addons.mozilla.org/firefox/addon/scratch-messaging-extension/)
[![](https://img.shields.io/badge/dynamic/json?style=flat-square&logo=microsoftedge&label=version&prefix=v&color=067FD8&query=%24.version&url=https%3A%2F%2Fmicrosoftedge.microsoft.com%2Faddons%2Fgetproductdetailsbycrxid%2Filiepgjnemckemgnledoipfiilhajdjj)](https://microsoftedge.microsoft.com/addons/detail/scratch-addons/iliepgjnemckemgnledoipfiilhajdjj)
[![](https://img.shields.io/github/v/release/ScratchAddons/ScratchAddons?style=flat-square&logo=github&logoColor=white&label=version&color=181717)](https://github.com/ScratchAddons/ScratchAddons/releases)

[![](https://img.shields.io/github/license/ScratchAddons/ScratchAddons?style=flat-square)](https://github.com/ScratchAddons/ScratchAddons/blob/master/LICENSE)
[![](https://img.shields.io/badge/chat-on_discord-7289da.svg?style=flat-square)](https://discord.gg/R5NBqwMjNc)
[![](https://img.shields.io/badge/website-scratchaddons.com-ff7b26.svg?style=flat-square)](https://scratchaddons.com)

## About

[Scratch Addons](https://github.com/ScratchAddons) combines new and existing features and themes for the Scratch website and project editor into one easy-to-access and configurable browser extension. The mission is to provide a centralized, up-to-date platform for community development of new features and themes for Scratch.

### What is an addon?

An addon is one or more [userscripts](https://scratchaddons.com/docs/develop/userscripts/) or [userstyles](https://scratchaddons.com/docs/develop/userstyles/) that run on the Scratch website or project editor.

Userscripts can use the `addon.*` JavaScript APIs provided by Scratch Addons, which allows them to obtain Scratch-related information like the currently logged in user and use extension APIs like sending notifications.

See the [documentation](https://scratchaddons.com/docs/develop/getting-started/addon-basics/) for more information about addons.

### If everything is an addon, what does Scratch Addons do?

Scratch Addons by itself is just an addon loader. Its main tasks are to:

- Allow users to enable, disable and configure addons.
- Run addons and provide APIs to them.
- Provide global state to addons (for example, the `addon.auth` API).
- Pollute prototypes for use by addon userscripts.
- Provide ways to access and modify Redux state.
- Avoid addons from interfering with each other.
- Avoid duplicate work from different addons.

## Install

[![Chrome Web Store](images/badges/cws-badge.png)](https://chrome.google.com/webstore/detail/fbeffbjdlemaoicjdapfpikkikjoneco)
[![Firefox Add-ons](images/badges/ff-addon-badge.png)](https://chrome.google.com/webstore/detail/fbeffbjdlemaoicjdapfpikkikjoneco)
[![Edge Add-ons](images/badges/unofficial-edge-badge.svg)](https://microsoftedge.microsoft.com/addons/detail/iliepgjnemckemgnledoipfiilhajdjj)

No build is required to install from source, just download the source and load it into a web browser.


```
git clone https://github.com/ScratchAddons/ScratchAddons.git
```

For other installation methods and browser support, check [the documentation](https//scratchaddons.com/docs/getting-started/installing).

### Load the extension (Chrome)

Use this method on Google Chrome, Microsoft Edge, Opera, Brave, Vivaldi and other Chromium-based browsers.

1. Type `chrome://extensions` into your address bar to open the Extension Management page.
2. Enable the Developer Mode toggle in the top-right corner.
3. Click the `Load unpacked` button on the top and select the extension folder which has the `manifest.json` file in it. 

### Load the extension (Firefox)

1. Type `about:debugging` into the address bar to open the debugging page by typing it into your address bar.
2. Click `This Firefox` on the left-hand menu.
3. Click `Load Temporary Add-on...` and select the `manifest.json` file.

Note that Firefox extensions loaded this way are removed when the browser is closed.

## Screenshots

![Scratch Addons demo](images/demo.png)

## Contribute

### Suggestions and bug reports

If you found a bug or have a suggestion, checking for duplicates and [create an issue](https://github.com/ScratchAddons/ScratchAddons/issues/new/choose) if there isn't one already.

### Code

Before contributing code, please read our [contributing guidelines](https://github.com/ScratchAddons/ScratchAddons/blob/master/.github/CONTRIBUTING.md).

Follow the installation instructions above to setup the extension. Please only submit pull requests for open issues and test your changes.

We recommend Visual Studio Code as the code editor.

### Translations

Translations are handled by Transifex. If you are interested in translating the extension, read [Joining the Localization Team](https://scratchaddons.com/docs/localization/joining-the-localization-team/)

### Documentation

Most documentation is located in the [website-v2](https://github.com/ScratchAddons/website-v2) repository in [/content/docs](https://github.com/ScratchAddons/website-v2/tree/master/content/docs) as markdown files.

## License

Scratch Addons is licensed under the terms of the [GNU General Public License v3.0](https://github.com/ScratchAddons/ScratchAddons/blob/master/LICENSE).

Other third-party libraries used are listed on [/libraries/README.md](https://github.com/ScratchAddons/ScratchAddons/tree/master/libraries#readme).
