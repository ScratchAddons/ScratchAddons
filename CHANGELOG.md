# Changelog

All notable changes to this project will be documented in this file.

<!-- 

NOTE: 

Updates on the changelog entry in between the start and stop tags will 
automatically create a PR on the website to synchronize the changes!

-->

<!-- sa-changelog-start -->

## [v1.12.0] - 2021-03-28

- New addon: drag and drop files [recommended]
- New addon: custom block shape (with presets to get blocks that look like 2.0)
- New addon: 2D color picker
- New color picker in settings page that allows to set transparency % for some settings
- "Profile page banner" addon: banner is now higher resolution, new "banner blur" setting
- "Sprite folders" addon: now allows saving folders to backpack
- "Variable manager" addon: now allows changing variable names
- New setting on "show full areas" addon: show scroll for forums Scratchblocks
- "Developer tools" addon: fix send to top/bottom buttons showing on all items, instead of just costumes
-  "Mute project player" addon: fix Ctrl+GreenFlag not working in MacOS
- "Auto-hide block pallete" addon: fix closing animation sometimes not working

## [v1.11.2] - 2021-03-17

- "Sprite folders" addon: fix editor crashing when trying to drag and drop a sound within a folder to another sprite.
- "Profile statistics" addon: add missing thousand separator comma to "most loved by country" statistic.

## [v1.11.1] - 2021-03-14

- Bug fix: scrollbar not working in editor with some editor dark modes
- Bug fix: "variable manager" listing broadcast messages as variables
- Bug fix: "developer tools" not removing vanilla "Clean up Blocks" button
- Bug fix: "addons" popup tab sometimes not listing some addons under "currently running on this tab"
- Bug fix: "onion skinning" and "sprite folders" not working properly together
- Bug fix: "show exact count" and "profile statistics" not working properly together
- "Disable auto-save" addon: allow saving with Ctrl+S and File>Save.
- "Website dark mode" addon: change scrollbar color on hover
- "Mute project player" addon: fix bugs
- "Sprite folders" addon: fix bugs
- "Forum search" addon: migrate to ScratchDB v3 for faster results
- "Thumbnails setter" addon: clarify what its only setting does when enabled
- "Auto-show editor extensions": remove option to auto-show video sensing, which turns on the camera

## [v1.11.0] - 2021-03-08

- New addon: folders [beta]
- New addon: variable manager [beta]
- New addon: profile statistics
- New addon: higher character limit in "What I'm Working On"
- New addon: block pallette category icons
- Cloud games addon: add loading indicator
- Infinite scrolling addon: bug fixes
- Bug fix: “more links” treating some links as if they weren't
- Bug fix: "block switching" only letting users type numbers when converting "change variable by" to "set variable to"

## [v1.10.0] - 2021-02-22

- New addon: copy link to comment button [recommended]
- New addon: auto-show editor extensions
- Enhanced pause button addon: bug fixes and improvements
- Website and editor dark modes bug fixes
- Bug fix: addons with permission requirements not getting enabled the first time after permissions granted
- Scratch Messaging: fix bug caused by asterisk after Scratch Team usernames
- Record project video: fix bugs when leaving the editor during recording

## [v1.9.3] - 2021-02-15

Fixes bug that would make the extension crash if browser language set to Spanish.

## [v1.9.2] - 2021-02-13

- Thumbnails setter addon: warn if the Scratch thumbnail server is down
- Bug fix: “more links” treating some non-links as links
- Bug fix: "curator link" sometimes not working
- Bug fix: popup box for sprite direction partially covered with "display stage on left side" enabled
- Bug fix: extension muted through context menu showing badge on startup

## [v1.9.1] - 2021-02-09

- New addon: show BBCode [forums]
- New easter egg addon: fix capitalization of Account Settings. You can access easter egg addons by typing the konami code in the settings page.
- Scratch Messaging: now shows who loved and favorited projects
- Scratch Messaging & Scratch Notifier: now support studio promotion messages
- Auto-hide block palette addon: new "category hover" mode
- Record project video: new option to include microphone input
- Mute project player addon: now shows an icon when the project is muted
- Bug fixes in "linebreaks in comments" addon
- Clone counter addon: improve performance

## [v1.9.0] - 2021-02-08 [YANKED]

Only released on Firefox for a brief moment due to the finding of a bug that would make the extension crash if browser language not set to English.

## [v1.8.1] - 2021-01-29

- Bug fix: "more links" treating non-links as links
- Bug fix: "Scratch 2.0 → 3.0" showing gray text on page load by default
- Bug fix: "Website dark mode" causing unreadable text on "Forums image uploader"
- Bug fix: "Auto-hide block palette" causing reporter return value bubbles to remain on screen

## [v1.8.0] - 2021-01-25

- New addon: auto-hide block palette [recommended]
- New addon: disable auto-save
- New addon: linebreaks in comments
- New addon: project screen reader support [beta]
- More links addon: remade, now more performant, out of beta
- Record project video addon: you can now record up to 5 minutes of project video and audio
- Data category tweaks addon: new “move data blocks above variable list” setting
- Removed addon: “fix ‘Load more’ scrolling in search results”, the bug was fixed in newer browser versions
- Bug fix: unreadable search bar input with "website dark mode" enabled and "Scratch 2.0 → 3.0" disabled
- Bug fix: permission prompts not working in Firefox

#### Addon development changes:
- You can now access the locale code msg() uses through `msg.locale`

## [v1.7.1] - 2021-01-11

Fixes bug where "website dark mode" would affect certain elements of the Scratch editor.

## [v1.7.0] - 2021-01-10

- New "addons" tab in extension popup: easily see what addons are running in the current page, enable addons, and change their settings, directly after clicking the Scratch Addons icon in the top right of your browser!
- Ability to customize the tabs in the extension popup (such as hiding "cloud games" from the popup if disabled).
- New addon: data category tweaks (version 2)
- New addon: mute project player
- New addon: better forum quoter
- Type the konami code in the settings page for a surprise :)
- Scratch 2.0 → 3.0 addon: new color settings
- Sprite and script count addon: new "live block count in editor" setting
- 60FPS player mode addon: custom FPS number setting
- Ability to import and export Scratch Addons settings as a .json file, available inside "more settings" in the settings page.
- Bug fix: double scrollbar in extension popup if browser zoom over 100%
- Bug fix: browsers now display certain non-English characters correctly, such as i/İ in Turkish and ß/SS in German.
- Bug fixes and better performance in editor devtools, colorful context menus, project notes tabs, block switching, dark modes, and more.

#### Addon development changes:
- Addons can now provide more than 1 warning and notice through the `info` manifest property.
- Popups aren't hardcoded anymore, and they must be specified through the `popup` manifest property. If an addon is disabled, its popup tab is hidden.

## [v1.6.1] - 2020-12-27

- New addon: hex color picker
- New addon: record project video [beta]
- Studio manager tools addon: new option to add "leave" button to studios section of "my stuff"
- Show my-ocular status addon: new option to show statuses in profiles
- Website dark mode fixes: unreadable modals

## [v1.6.0] - 2020-12-27 [YANKED]

Only released on Firefox due to a special requirement by the Chrome Web Store related to localization. See [v1.6.1].

## [v1.5.1] - 2020-12-15

- Bug fix: Onion skin addon groups together every vector costume ([#1035](https://github.com/ScratchAddons/ScratchAddons/issues/1035))
- Bug fix: loading comment section not black with website dark mode enabled

## [v1.5.0] - 2020-12-13

- New addon: onion skinning
- New addon: profile page banner
- Editor devtools: option to show broadcast senders and receivers
- New setting to avoid overwriting thumbnails in thumbnails setter addon
- New setting to show "load more" in the front page's "What's happening" (show full areas addon)
- More blocks supported in block switching addon
- Customizable block colors: affect "colorful context menus" and editor devtools middle click feature.
- Addons now run in iframes, so for example, you can now use pause button and live featured project together.
- Warn users if extension site access was disabled, which breaks Scratch Addons.
- Remove orange outline in "set thumbnail" and "leave studio" buttons
- Add "help translate" button in settings page
- Bug fixes in website dark editor
- Firefox bug fix: addons not working
- Various other bug fixes

## [v1.4.1] - 2020-12-03

- Fix website dark mode affecting the editor, sometimes making text unreadable
- Fix typos and incorrect uses of title case
- Fix script and sprite count addon working incorrectly
- Fix forum search working incorrectly
- Fix localization bugs

## [v1.4.0] - 2020-11-29

- Scratch Addons is now localized! We'll soon be writing how you can help translate Scratch Addons to your language.
- Responsive settings page
- New addon: website dark mode
- New addon: block switching [recommended]
- New addon: sprite and script count
- New addon: messages in editor
- New addon: project notes tabs
- New addon: feature unshared projects
- New addon: confirm actions
- New addon: fix broken SVG uploads
- New addon: customized quotes & code blocks on forums
- New addon: curator link
- New addon: show my-ocular status
- Enhancement: fix performance when dragging blocks in the editor
- Bug fix: exact forum count removing the word "posts" after the post count
- Bug fix: "last edit tooltip" showing incorrect date
- Bug fix: clone count showing negative numbers

#### Addon development changes:
- Because of localization, any English strings used in addon JavaScript must be put in `addon-l10n/en/addon-name.json`. Then, you can get these strings from the `msg` function that is passed to the default function of your module.
- Source URL was added to theme CSS ([#849](https://github.com/ScratchAddons/ScratchAddons/issues/849))
- Addition of `%addon-self-dir%` placeholder in theme CSS
- Settings of type `"key"` for hotkeys, not yet used by any addon.

## [v1.3.3] - 2020-11-24

Minor extension structure change after Mozilla Add-ons review (moves libraries used by addons, previously loaded from CDNs, to the "libraries" folder). No noticeable changes for users.

## [v1.3.2] - 2020-11-24

Fixes a security issue in the "More links" addon. [Click here for more information](https://github.com/ScratchAddons/ScratchAddons/security/advisories/GHSA-6qfq-px3r-xj4p).

## [v1.3.1] - 2020-11-09

The "live featured project" addon was accidentally enabled by default. This update fixes that.

## [v1.3.0] - 2020-11-08

- Project performance problems fixed - performance warnings removed ([#431](https://github.com/ScratchAddons/ScratchAddons/issues/431))
- "Highlight currently executing blocks" does not hurt performance/lag anymore ([#336](https://github.com/ScratchAddons/ScratchAddons/issues/336))
- New SVG icons instead of emojis in the extension popup and Scratch Notifier notifications ([#617](https://github.com/ScratchAddons/ScratchAddons/issues/617))
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
- Dark mode fixes ([#656](https://github.com/ScratchAddons/ScratchAddons/issues/656), [#658](https://github.com/ScratchAddons/ScratchAddons/issues/658))

#### Addon development changes:

- `addon.tab.traps` API traps removed to fix performance issues (except Scratch VM object). In the future, we'll discuss how future addons should implement traps
- Ability to use icons within setting names
- Ability to mark a theme userstyle as non-updatable with `/* sa-autoupdate-theme-ignore */`
- Fix console.log sometimes not working (bug caused by Scratch, not Scratch Addons, see [#662](https://github.com/ScratchAddons/ScratchAddons/issues/662))

## [v1.2.1] - 2020-10-27

- New popup styling, matching the Scratch Addons settings page
- Light theme option for the Scratch Addons popup and settings page
- New addon: customizable block colors
- New addon: studio manager tools
- New addon: infinite scrolling
- New addon: clone counter
- New addon: mouse position
- New addon: remix tree button on project pages
- New addon: show exact count
- Removed addon: data category tweaks, because it caused irreversible bugs to projects ([#396](https://github.com/ScratchAddons/ScratchAddons/issues/396))
- Removed addon: load more scrolling fix, because the issue was fixed by the Scratch Team ([#506](https://github.com/ScratchAddons/ScratchAddons/issues/506))
- Ability to reset all addon settings
- `Mute for...` option when right clicking the extension icon
- Fix bug: links to cloud games not working ([#500](https://github.com/ScratchAddons/ScratchAddons/issues/500))

#### Addon development changes:

- Ability to use `addon.tab.waitForElement(selector, { markAsSeen: true })` to avoid having to manually add class names to elements to mark them as seen ([#470](https://github.com/ScratchAddons/ScratchAddons/issues/470))
- New `urlChange` event on `addon.tab`
- `notice` property in the manifest
- Setting presets ([#563](https://github.com/ScratchAddons/ScratchAddons/issues/563))

## [v1.2.0] - 2020-10-27 [YANKED]

Only released on Firefox due to an issue with perfomance warnings not showing. See [v1.2.1].

## [v1.1.1] - 2020-10-11

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

## [v1.1.0] - 2020-10-10 [YANKED]

Not released due to a permissions issue. See [v1.1.1].

## [v1.0.0] - 2020-09-24

Initial release.

[v1.12.0]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.12.0
[v1.11.2]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.11.2
[v1.11.1]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.11.1
[v1.11.0]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.11.0
[v1.10.0]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.10.0
[v1.9.3]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.9.3
[v1.9.2]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.9.2
[v1.9.1]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.9.1
[v1.9.0]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.9.0
[v1.8.1]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.8.1
[v1.8.0]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.8.0
[v1.7.1]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.7.1
[v1.7.0]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.7.0
[v1.6.1]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.6.1
[v1.6.0]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.5.1
[v1.5.1]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.5.1
[v1.5.0]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.5.0
[v1.4.1]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.4.1
[v1.4.0]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.4.0
[v1.3.3]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.3.3
[v1.3.2]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.3.2
[v1.3.1]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.3.1
[v1.3.0]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.3.0
[v1.2.1]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.2.1
[v1.2.0]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.2.0
[v1.1.1]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.1.1
[v1.1.0]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.1.0
[v1.0.0]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.0.0

<!-- sa-changelog-end -->
