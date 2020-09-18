# Welcome to Scratch Addons' repository!

[![](https://img.shields.io/github/stars/ScratchAddons/ScratchAddons?color=blue&style=flat-square)](https://github.com/ScratchAddons/ScratchAddons/stargazers) [![](https://img.shields.io/github/forks/ScratchAddons/ScratchAddons?color=blue&style=flat-square)](https://github.com/ScratchAddons/ScratchAddons/network/members) [![](https://img.shields.io/github/watchers/ScratchAddons/ScratchAddons?color=blue&style=flat-square)](https://github.com/ScratchAddons/ScratchAddons/watchers) [![](https://img.shields.io/github/issues/ScratchAddons/ScratchAddons?color=green&style=flat-square)](https://github.com/ScratchAddons/ScratchAddons/issues) [![](https://img.shields.io/github/issues-pr/ScratchAddons/ScratchAddons?color=green&style=flat-square)](https://github.com/ScratchAddons/ScratchAddons/pulls) [![](https://img.shields.io/github/license/ScratchAddons/ScratchAddons?style=flat-square)](https://github.com/ScratchAddons/ScratchAddons/blob/master/LICENSE) [![](https://img.shields.io/badge/chat-on%20discord-7289da.svg?style=flat-square)](https://discord.gg/Ak8sCDQ)
<!-- 
![](https://img.shields.io/github/v/release/ScratchAddons/ScratchAddons?style=flat-square) ![](https://img.shields.io/amo/users/firefox@scratchaddons?style=flat-square) ![](https://img.shields.io/chrome-web-store/users/whatisthestoreidwwwfplabnoondfjo?style=flat-square) ![](https://img.shields.io/github/downloads/ScratchAddons/ScratchAddons/total?style=flat-square) ![](https://img.shields.io/badge/chat-on%20discord-7289da.svg)
-->

## About

Scratch Addons is a WebExtension (supports both Chrome and Firefox). Scratch Addons' mission is to combine all existing Scratch extensions, userscripts and userstyles into a single easy-to-access place, while still letting users choose which ones to enable.

### What's actually an "addon"?

An addon is similar to an extension or a userscript, but they use special APIs provided by the Scratch Addons extension. These APIs allow addons to run scripts on a Scratch page (userscripts), run scripts on the background (persistent scripts), or apply styles to the Scratch website (userstyles).

Userscripts and persistent scripts can use the `addon.*` JavaScript APIs, which allow them to obtain Scratch-related information (for example, get the current logged in user) and also use extension APIs (like sending notifications).

Converting an already existing extension/userscript into an addon, or writing your own, is very easy. [Check out the guide](https://github.com/ScratchAddons/ScratchAddons/wiki/Creating-an-addon).

### If everything is an addon, then what does Scratch Addons do?

Scratch Addons by itself is just an addon loader. Its main tasks are:

- Allow users to enable, disable and configure addons.
- Run addons and provide APIs to them.
- Provide global state to addons (for example, the `addon.auth` API).
- Pollute prototypes for use by addon userscripts.
- Provide ways to access and modify Redux state.
- Avoid addons from interfering with each other.
- Avoid duplicate work from different addons.

## Installation

No build is required. After cloning the repository to your computer, just load the extension by following these steps.

- Chrome
  1. Open `chrome://extensions` to open the Extension Management page by typing it into your address bar.
  2. Enable Developer Mode by clicking the toggle switch next to Developer mode.
  3. Click the `LOAD UNPACKED` button on the top and select the extension directory which has the `manifest.json` file in it. 

- Firefox
  1. Open `about:debugging` to open the add-ons page by typing it into your address bar.
  2. Click `This Firefox` on the right-hand menu.
  3. Click `Load Temporary Add-on...` and select the `manifest.json` file.

## Contribute

If you found a bug, or want to suggest new features, please use the [issues tab](https://github.com/ScratchAddons/ScratchAddons/issues). If you want to help with the code or add a new addon, fork this repository, and then create a [pull request](https://github.com/ScratchAddons/ScratchAddons/pulls). Also, please read our [contributing guidelines](https://github.com/ScratchAddons/ScratchAddons/blob/master/CONTRIBUTING.md).

## License

Scratch Addons is licensed under the terms of the [GNU General Public License v3.0](https://github.com/ScratchAddons/ScratchAddons/blob/master/LICENSE).

## Learn more
If you would like to know more about Scratch Addons, what it does, and who helped feel free to check out the [ScratchAddons official website](https://ScratchAddons.com) for more!
