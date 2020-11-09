# Changelog

All notable changes to this project will be documented in this file.

<!-- 

NOTE: 

Updates on the changelog entry in between the start and stop tags will 
automatically create a PR on the website to synchronize the changes!

-->

<!-- sa-changelog-start -->

## [v1.3.1]

The "live featured project" addon was accidentally enabled by default. This update fixes that.

## [v1.3.0]

- Project performance problems fixed - performance warnings removed (#431)
- "Highlight currently executing blocks" does not hurt performance/lag anymore (#336)
- New SVG icons instead of emojis in the extension popup and Scratch Notifier notifications (#617)
- Settings page: new "more settings" button and theme switch in the top right
- New addon: thumbnail setter (enabled by default for all users)
- New addon: resizable comment input (enabled by default for all users)
- Old addons now enabled for all users: 60FPS player mode (alt+click green flag), studio manager tools, full areas
- New addon: pause button (beta)
- New addon: live featured project
- New setting on Scratch Notifier addon: sound notification
- Full areas: new "load more" button on "What I've been doing"
- Fix remix tree button not working
- Fix inaccurate number of projects in a studio (show exact count addon)
- Fix wrong row titles in show exact count addon
- Dark mode fixes (#656, #658)

#### Addon development changes:

- `addon.tab.traps` API traps removed to fix performance issues (except Scratch VM object). In the future, we'll discuss how future addons should implement traps
- Ability to use icons within setting names
- Ability to mark a theme userstyle as non-updatable with `/* sa-autoupdate-theme-ignore */`
- Fix console.log sometimes not working (bug caused by Scratch, not Scratch Addons, see #662)

## [v1.2.1]

- New popup styling, matching the Scratch Addons settings page
- Light theme option for the Scratch Addons popup and settings page
- New addon: customizable block colors
- New addon: studio manager tools
- New addon: infinite scrolling
- New addon: clone counter
- New addon: mouse position
- New addon: remix tree button on project pages
- New addon: show exact count
- Removed addon: data category tweaks, because it caused irreversible bugs to projects (#396)
- Removed addon: load more scrolling fix, because the issue was fixed by the Scratch Team (#506)
- Ability to reset all addon settings
- `Mute for...` option when right clicking the extension icon
- Fix bug: links to cloud games not working (#500) 

#### Addon development changes:

- Ability to use `addon.tab.waitForElement(selector, { markAsSeen: true })` to avoid having to manually add class names to elements to mark them as seen (#470)
- New `urlChange` event on `addon.tab`
- `notice` property in the manifest
- Setting presets (#563)

## [v1.2.0] [YANKED]

Only released on Firefox due to an issue with perfomance warnings not showing. See [v1.2.1].

## [v1.1.1]

- Bug fixes
- New theme: Scratch 2.0 → Scratch 3.0
- New addon: forums search
- New addon: search profile
- New addon: 60FPS player mode
- New addon: better emojis
- New addon: cloud games
- New theme: display stage on left side
- Automatically update themes (no refresh needed)
- Fix slow project performance if no feature with a "hurts performance" warning is enabled

#### Addon development changes:

- New manifest fields: `"traps"`, `"warning"`
- `"runAtComplete": false` can now happen even if there's no \<body> element yet. The default value is still `true`, and those userscripts are run when the window load event triggers
- Userstyles are now injected very rapidly to avoid flickering
- Theme userstyles are now always injected after non-theme userstyles
- Addon settings can now be of type `"color"`
- Access to `"string"`, `"select"`, `"positive_integer"` and `"color"` settings via CSS variables

#### Open source project related changes:

- Links to "credits" and "review" pages on settings page.

## [v1.1.0] [YANKED]

Not released due to a permissions issue. See [v1.1.1].

## [v1.0.0]

Initial release.
[v1.3.1]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.3.1
[v1.3.0]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.3.0
[v1.2.1]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.2.1
[v1.2.0]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.2.0
[v1.1.1]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.1.1
[v1.1.0]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.1.0
[v1.0.0]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.0.0

<!-- sa-changelog-end -->
