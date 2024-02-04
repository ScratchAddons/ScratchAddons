<img src="images/icon.svg" alt="Scratch Addons logo" align="right" width="128px"></img>
# Scratch Addons

[![Chrome Web Store](.github/readme-images/cws-badge.png)](https://chrome.google.com/webstore/detail/fbeffbjdlemaoicjdapfpikkikjoneco)
[![Firefox Add-ons](.github/readme-images/ff-addon-badge.png)](https://addons.mozilla.org/firefox/addon/scratch-messaging-extension/)

[![](https://img.shields.io/chrome-web-store/v/fbeffbjdlemaoicjdapfpikkikjoneco?style=flat-square&logo=google-chrome&logoColor=white&label=Chrome&color=E23A2E)](https://chrome.google.com/webstore/detail/fbeffbjdlemaoicjdapfpikkikjoneco)
[![](https://img.shields.io/amo/v/scratch-messaging-extension?style=flat-square&logo=firefox-browser&logoColor=white&label=Firefox&color=FF7139)](https://addons.mozilla.org/firefox/addon/scratch-messaging-extension/)
[![](https://img.shields.io/badge/dynamic/json?style=flat-square&logo=microsoftedge&label=Edge&prefix=v&color=067FD8&query=%24.version&url=https%3A%2F%2Fmicrosoftedge.microsoft.com%2Faddons%2Fgetproductdetailsbycrxid%2Filiepgjnemckemgnledoipfiilhajdjj)](https://microsoftedge.microsoft.com/addons/detail/scratch-addons/iliepgjnemckemgnledoipfiilhajdjj)
[![](https://img.shields.io/github/v/release/ScratchAddons/ScratchAddons?style=flat-square&logo=github&logoColor=white&label=GitHub&color=181717)](https://github.com/ScratchAddons/ScratchAddons/releases)

[![](https://img.shields.io/github/license/ScratchAddons/ScratchAddons?style=flat-square)](https://github.com/ScratchAddons/ScratchAddons/blob/master/LICENSE)
[![](https://img.shields.io/badge/chat-on_discord-7289da.svg?style=flat-square)](https://discord.gg/R5NBqwMjNc)
[![](https://img.shields.io/badge/website-scratchaddons.com-ff7b26.svg?style=flat-square)](https://scratchaddons.com)

## About

Scratch Addons combines new and existing features and themes for the [Scratch](https://scratch.mit.edu) website and project editor into one easy-to-access and configurable browser extension. The mission is to provide a centralized, up-to-date platform for community development of new features and themes for Scratch.

<div align="center">

![Scratch Addons screenshot](https://scratchaddons.com/assets/img/showcase/intro-hero.svg)

</div>

### About addons

An addon mainly consists of one or more [userscripts](https://scratchaddons.com/docs/develop/userscripts/) (written in JavaScript) or [userstyles](https://scratchaddons.com/docs/develop/userstyles/) (written in CSS) that run on the Scratch website or project editor.

Each addon declares its own [addon manifest](https://scratchaddons.com/docs/reference/addon-manifest/) (`addon.json` file). This file specifies under which circumstances each one of its userscripts and userstyles should be injected into the page. It also contains user-facing information, such as the description of the feature, and information about the addon's settings.

Userscripts work similarly to [extension content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts) running in the "main world" (the unprivileged context where `chrome.*` extension APIs are not available). Userscripts have access to `addon.*` APIs. They can use these built-in utilities for various purposes: waiting until a certain element exists on the page, listening to settings change events, getting a reference to the Scratch VM object, etc.

Addons are designed to be compatible with each other. They are also developed with performance, internationalization, accessibility, and privacy in mind.

Read the [documentation](https://scratchaddons.com/docs/develop/getting-started/addon-basics/) for more information about addons.

### About the extension

The Scratch Addons browser extension provides a settings page where users can enable, disable and configure addons. The extension interprets addon manifests, stores the user's settings, and provides APIs to userscripts. A new version of the extension is released to the stores regularly with new addons and features.

### Addons beyond the Scratch Addons browser extension

Other open-source projects (such as Scratch forks) can also make use of the addons. For example, the [TurboWarp](https://github.com/TurboWarp/scratch-gui/tree/develop/src/addons) and [Adacraft](https://gitlab.com/adacraft/scratch-mod/scratch-gui/-/tree/adacraft/main/src/addons) project editors allow you to use most of the editor addons without installing browser extensions, and even while offline ([TurboWarp Desktop](https://desktop.turbowarp.org/)).

### File structure

#### Addons
- `addons-l10n`: Translation for addon strings (one file per addon).
- `addon-api`: Implementation of the `addon.*` JavaScript APIs.
- `addons`: Each addon has its own directory, which must include an addon manifest file named `addon.json`.
- `libraries`: Third-party libraries and other utilities, some of which are used by addons.

#### Others
- `.github`: GitHub templates, workflows, and contributing files.
- `_locales`: Translation strings for the browser extension (excluding addons).
- `background`: Background scripts for the extension.
- `content-scripts`: Content scripts, which among other things, execute userscripts and inject userstyles to the page.
- `images`: Logos, screenshots and icons (excluding addon-specific images).
- `popups`: Addon pages that are only accessible through the extension popup (for example, Scratch Messaging).
- `webpages`: The settings page, extension popup, and other pages.

## Installation

No building is required. The best way to download the source is with Git:

```sh
git clone https://github.com/ScratchAddons/ScratchAddons.git
```

For browser support information and other installation methods, check [the documentation](https://scratchaddons.com/docs/getting-started/installing).

### Loading the extension (Chrome)

To load the extension into most Chromium-based browsers, go to `chrome://extensions`, turn on developer mode, click "Load unpacked", and select the `ScratchAddons` folder.

### Loading the extension (Firefox)

Go to `about:debugging`, select "This Firefox", click "Load Temporary Add-on...", and select the `manifest.json` file in the `ScratchAddons` folder.

> [!NOTE]
> Firefox extensions loaded this way are removed when the browser is closed.

## Contributing

### Suggestions and bug reports

If you found a bug or have a suggestion [create an issue](https://github.com/ScratchAddons/ScratchAddons/issues/new/choose) after checking for duplicates. Alternatively, you can use our [feedback page](https://scratchaddons.com/feedback) instead.

If you found a security vulnerability, please follow the instructions in our [Security Policy](https://github.com/ScratchAddons/ScratchAddons/tree/master/.github/SECURITY.md) instead.

### Code

Before contributing code, please read our [contributing guidelines](https://github.com/ScratchAddons/ScratchAddons/blob/master/.github/CONTRIBUTING.md).

We recommend using Visual Studio Code as the code editor.

### Translations

Translations are handled by [Transifex](https://www.transifex.com/). If you are interested in translating the extension, read [Joining the Localization Team](https://scratchaddons.com/docs/localization/joining-the-localization-team/).

### Documentation

The Scratch Addons Docs are available at https://scratchaddons.com/docs/.

Most of the documentation is located in [website-v2](https://github.com/ScratchAddons/website-v2) (repository of the [ScratchAddons.com](https://scratchaddons.com) website) in the [/content/docs](https://github.com/ScratchAddons/website-v2/tree/master/content/docs) directory.

## License

Scratch Addons is licensed under the terms of the [GNU General Public License v3.0](https://github.com/ScratchAddons/ScratchAddons/blob/master/LICENSE).

Other third-party libraries used are listed on [/libraries/README.md](https://github.com/ScratchAddons/ScratchAddons/tree/master/libraries#readme).
