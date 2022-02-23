<img src="https://raw.githubusercontent.com/ScratchAddons/ScratchAddons/master/images/icon.svg" alt="Scratch Addons logo" align="right" width="128px"></img>
# Welcome to Scratch Addons' repository!

[![](https://img.shields.io/github/stars/ScratchAddons/ScratchAddons?color=blue&style=flat-square)](https://github.com/ScratchAddons/ScratchAddons/stargazers) 
[![](https://img.shields.io/github/forks/ScratchAddons/ScratchAddons?color=blue&style=flat-square)](https://github.com/ScratchAddons/ScratchAddons/network/members)
[![](https://img.shields.io/github/watchers/ScratchAddons/ScratchAddons?color=blue&style=flat-square)](https://github.com/ScratchAddons/ScratchAddons/watchers) 
[![](https://img.shields.io/github/issues/ScratchAddons/ScratchAddons?color=green&style=flat-square)](https://github.com/ScratchAddons/ScratchAddons/issues) 
[![](https://img.shields.io/github/issues-pr/ScratchAddons/ScratchAddons?color=green&style=flat-square)](https://github.com/ScratchAddons/ScratchAddons/pulls) 
[![](https://img.shields.io/github/license/ScratchAddons/ScratchAddons?style=flat-square)](https://github.com/ScratchAddons/ScratchAddons/blob/master/LICENSE) <!-- 2 spaces -->  
[![](https://img.shields.io/chrome-web-store/v/fbeffbjdlemaoicjdapfpikkikjoneco?style=flat-square&logo=google-chrome&logoColor=white&label=version&color=4285F4)](https://chrome.google.com/webstore/detail/fbeffbjdlemaoicjdapfpikkikjoneco)
[![](https://img.shields.io/chrome-web-store/users/fbeffbjdlemaoicjdapfpikkikjoneco?style=flat-square&logo=google-chrome&logoColor=white&label=users&color=4285F4)](https://chrome.google.com/webstore/detail/fbeffbjdlemaoicjdapfpikkikjoneco)
[![](https://img.shields.io/amo/v/scratch-messaging-extension?style=flat-square&logo=firefox-browser&logoColor=white&label=version&color=FF7139)](https://addons.mozilla.org/firefox/addon/scratch-messaging-extension/)
[![](https://img.shields.io/amo/users/scratch-messaging-extension?style=flat-square&logo=firefox-browser&logoColor=white&label=users&color=FF7139)](https://addons.mozilla.org/firefox/addon/scratch-messaging-extension/)
[![](https://img.shields.io/github/v/release/ScratchAddons/ScratchAddons?style=flat-square&logo=github&logoColor=white&label=version&color=181717)](https://github.com/ScratchAddons/ScratchAddons/releases)
[![](https://img.shields.io/github/downloads/ScratchAddons/ScratchAddons/total?style=flat-square&logo=github&logoColor=white&label=downloads&color=181717)](https://github.com/ScratchAddons/ScratchAddons/releases)
[![](https://img.shields.io/badge/discuss-on_github-181717.svg?style=flat-square)](https://github.com/ScratchAddons/ScratchAddons/discussions)
[![](https://img.shields.io/badge/chat-on_discord-7289da.svg?style=flat-square)](https://discord.gg/R5NBqwMjNc)
[![](https://img.shields.io/badge/website-scratchaddons.com-ff7b26.svg?style=flat-square)](https://scratchaddons.com)

## About

Scratch Addons is a WebExtension (supports both Chrome and Firefox). Scratch Addons' mission is to combine all existing Scratch extensions, userscripts and userstyles into a single easy-to-access place, while still letting users choose which ones to enable.

### What's actually an "addon"?

An addon is similar to an extension or a userscript, but they use special APIs provided by the Scratch Addons extension. These APIs allow addons to run scripts on a Scratch page (userscripts), run scripts on the background (persistent scripts), or apply styles to the Scratch website (userstyles).

Userscripts and persistent scripts can use the `addon.*` JavaScript APIs, which allow them to obtain Scratch-related information (for example, get the current logged in user) and also use extension APIs (like sending notifications).

Converting an already existing extension/userscript into an addon, or writing your own, is very easy. [Check out the guide](https://scratchaddons.com/docs/develop/getting-started/creating-an-addon/).

### If everything is an addon, then what does Scratch Addons do?

Scratch Addons by itself is just an addon loader. Its main tasks are:

- Allow users to enable, disable and configure addons.
- Run addons and provide APIs to them.
- Provide global state to addons (for example, the `addon.auth` API).
- Pollute prototypes for use by addon userscripts.
- Provide ways to access and modify Redux state.
- Avoid addons from interfering with each other.
- Avoid duplicate work from different addons.

### Addons outside of Scratch Addons itself

Other extensions (and even forks of Scratch) can also provide their users with most addons from Scratch Addons, as long as a compatibility layer for `addon.*` and other parts of the addon loader is present. Notable examples are the [Scratch 3 Developer Tools extension](https://github.com/ScratchAddons/DevtoolsExtension) and the [TurboWarp](https://github.com/TurboWarp/scratch-gui/tree/develop/src/addons) editor. These also inherit translations from the Scratch Addons project.

## Install

### From extension stores

[![](https://img.shields.io/chrome-web-store/v/fbeffbjdlemaoicjdapfpikkikjoneco?style=flat-square&logo=google-chrome&logoColor=white&label=install&color=4285F4)](https://chrome.google.com/webstore/detail/fbeffbjdlemaoicjdapfpikkikjoneco)  
&nbsp;&nbsp;&nbsp;&nbsp;↳ Install on Google Chrome, Opera, Brave, Vivaldi, Microsoft Edge (>79), and other Chromium-based browsers.

[![](https://img.shields.io/amo/v/scratch-messaging-extension?style=flat-square&logo=firefox-browser&logoColor=white&label=install&color=FF7139)](https://addons.mozilla.org/firefox/addon/scratch-messaging-extension/)  
&nbsp;&nbsp;&nbsp;&nbsp;↳ Install on Mozilla Firefox.

### From source

No build is required. You may download the source code by doing one of these steps.

1. Cloning the repository by running `git clone https://github.com/ScratchAddons/ScratchAddons.git`.
2. Download the zipball of the current state of the repository [here](https://github.com/ScratchAddons/ScratchAddons/archive/master.zip).
3. Download one of the builds on [the releases page](https://github.com/ScratchAddons/ScratchAddons/releases). (.zip recommended)

After downloading the extension to your computer, just load it by following these steps.

- Google Chrome
  1. Open `chrome://extensions` to open the Extension Management page by typing it into your address bar.
  2. Enable Developer Mode by clicking the toggle switch next to Developer mode.
  3. Click the `Load unpacked` button on the top and select the extension directory which has the `manifest.json` file in it. 

- Mozilla Firefox
  1. Open `about:debugging` to open the debugging page by typing it into your address bar.
  2. Click `This Firefox` on the left-hand menu.
  3. Click `Load Temporary Add-on...` and select the `manifest.json` file.

## Contribute

If you found a bug, or want to suggest new features, please use the [issues tab](https://github.com/ScratchAddons/ScratchAddons/issues). If you want to help with the code or add a new addon, fork this repository, and then create a [pull request](https://github.com/ScratchAddons/ScratchAddons/pulls). Also, please read our [contributing guidelines](https://github.com/ScratchAddons/ScratchAddons/blob/master/CONTRIBUTING.md).

## License

Scratch Addons is licensed under the terms of the [GNU General Public License v3.0](https://github.com/ScratchAddons/ScratchAddons/blob/master/LICENSE).

Other third-party libraries used are listed on [/libraries/README.md](https://github.com/ScratchAddons/ScratchAddons/tree/master/libraries#readme).
