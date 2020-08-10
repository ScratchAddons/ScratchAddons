# Welcome to Scratch Addons's repository!

![](https://img.shields.io/github/watchers/ScratchAddons/ScratchAddons?color=blue&logo=GitHub&logoColor=white&style=flat-square) ![](https://img.shields.io/github/stars/ScratchAddons/ScratchAddons?color=blue&logo=GitHub&logoColor=white&style=flat-square) ![](https://img.shields.io/github/forks/ScratchAddons/ScratchAddons?color=blue&logo=GitHub&logoColor=white&style=flat-square) ![](https://img.shields.io/github/issues/ScratchAddons/ScratchAddons?color=green&logo=GitHub&logoColor=white&style=flat-square) ![](https://img.shields.io/github/issues-closed/ScratchAddons/ScratchAddons?color=red&logo=GitHub&logoColor=white&style=flat-square) ![](https://img.shields.io/github/issues-pr/ScratchAddons/ScratchAddons?color=green&logo=GitHub&logoColor=white&style=flat-square) ![](https://img.shields.io/github/issues-pr-closed/ScratchAddons/ScratchAddons?color=red&logo=GitHub&logoColor=white&style=flat-square)

## What is Scratch Addons?

Scratch Addons is a WebExtension (supports both Chrome and Firefox). Scratch Addons' mission is to combine all existing Scratch extensions, userscripts and userstyles into a single easy-to-access place, while still letting users choose which ones to enable.

## What's actually an "addon"?

An addon is similar to an extension or a userscript, but they use special APIs provided by the Scratch Addons extension. These APIs allow addons to run scripts on a Scratch page (userscripts), run scripts on the background (persistent scripts), or apply styles to the Scratch website (userstyles).  
Userscripts and persistent scripts can use the `addon.*` JavaScript APIs, which allow them to obtain Scratch-related information (for example, get the current logged in user) and also use extension APIs (like sending notifications).  
Converting an already existing extension/userscript into an addon, or writing your own, is very easy. [Check out the guide](https://github.com/ScratchAddons/ScratchAddons/wiki/Creating-an-addon).

## If everything is an addon, then what does Scratch Addons do?

Scratch Addons by itself is just an addon loader. Its main tasks are:

- Allow users to enable, disable and configure addons.
- Run addons and provide APIs to them.
- Provide global state to addons (for example, the `addon.auth` API)
- Avoid addons from interfering with each other.
- Avoid duplicate work from different addons.

## How can I contribute?

If you found a bug, or want to suggest new features, please use the [issues tab](https://github.com/ScratchAddons/ScratchAddons/issues). If you want to help with the code or add a new addon, fork this repository, and then create a [pull request](https://github.com/ScratchAddons/ScratchAddons/pulls).
