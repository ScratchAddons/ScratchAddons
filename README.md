# Welcome to ScratchAddons extension's Github repo!

![](https://img.shields.io/github/stars/ScratchAddons/ScratchAddons?style=flat-square&color=blue) ![](https://img.shields.io/github/forks/ScratchAddons/ScratchAddons?style=flat-square&color=red) ![](https://img.shields.io/github/watchers/ScratchAddons/ScratchAddons?style=flat-square) ![](https://img.shields.io/github/issues/ScratchAddons/ScratchAddons?color=green&logo=GitHub&logoColor=Red&style=flat-square) ![](https://img.shields.io/github/issues-closed/ScratchAddons/ScratchAddons?color=red&logo=GitHub&logoColor=red&style=flat-square) ![](https://img.shields.io/github/issues-pr/ScratchAddons/ScratchAddons?color=green&logo=GitHub&logoColor=red&style=flat-square) ![](https://img.shields.io/github/issues-pr-closed/ScratchAddons/ScratchAddons?color=red&logo=GitHub&logoColor=red&style=flat-square)

_Note, that this was written by a person, who has a general idea of what's going on, but can't really dive into any details :P_

Let's start nice and simple with:

## What is this extension for?

ScratchAddons' mission is to combine all existing Scratch extensions, used by many people into a single easy-to-access place. The extension itself contains various _addons_ - scripts or styles, that modify the look or behaviour of Scratch editor/website.

There aren't many addons yet, since we're still working on the _addon API_ (more on that later), but feel free to add new ones to the `addons` folder using the power of pull requests.

## Addon API

The Addon API allows addons to interact with the environment. It allows them to access stuff, like viewing info about account the user's logged in, sending messages between tabs, adding stuff to editor's context menus, sending notifications, etc.

TODO: Add a more detailed explanation of API

## Webpages

Oh right, that's one of the things I'm qualified to talk about! So, currently there is only a "settings" page for the user to manage addons and other extension settings. It is located at `webpages/settings` and contains an HTML, CSS and a few media files.

## Miscellaneous

If you found a bug, or want to suggest new features, please use the [issues tab](https://github.com/ScratchAddons/ScratchAddons/issues). If you want to help with the code or add a new addon, you can do a [pull request](https://github.com/ScratchAddons/ScratchAddons/pulls). I think that's it, i honestly never wrote a proper README.
