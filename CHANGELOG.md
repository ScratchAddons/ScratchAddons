# Changelog

All notable changes to this project will be documented in this file.

**Note:** This changelog is more detailed, compared to the summarised changelog on https://scratchaddons.com/changelog.

<!-- 

NOTE: 

Updates on the changelog entry in between the start and stop tags will 
automatically create a PR on the website to synchronize the changes!

-->

<!-- sa-changelog-start -->

## [v1.6.1] - 2020-12-27

NOTE: All updates from [v1.6.0] are pushed on this version.

## Fixed

- Chrome enforces extensionName to be specified

## [v1.6.0] - 2020-12-27 [YANKED]

NOTE: v1.6.0 is only released on Firefox due to a special requirement by the Chrome Web Store related to localization. All updates are included on [v1.6.1].

### Added

#### Addons

- Color picker (#1061)
- Record project video (#1083)
- Show my-ocular status: Support profile pages (#1026)
- Studio manager tools: Add a way to leave studios from My Stuff (#1041)

### Fixed

#### Addons

- Thumbnails setter: Addon listed as a website addon (#1064)

#### Extension and Addon API

- Changing color settings may cause memory leak (#1062)

## [v1.5.1] - 2020-12-15

### Fixed

- Comment loading screen is not dark when using dark-www (#1019)
- Onion-skinning groups images unintentionally (#1037)

## [v1.5.0] - 2020-12-13

### Added

#### Addons

- Onion skinning (#879)
- Profile page banner (#895)

#### Extension and Addon API

- Show full areas supports loading more in What's Happening (#899)
- Warning when posting on Japanese forum (#944)
- Warning when site access is off (#950)
- A way to disable thumbnail overwriting (#964)
- Block switching supports more blocks (#979)
- New devtools feature for showing broadcast senders and receivers (#980)
- Button to open translation page (#1002)
- Notification for updates (#1016)
- "New" tag for addons (#1016)

### Changed

#### Extension and Addon API

- Load addons inside frames (#897)
- Localization updates

### Fixed

#### Addons

- Customizable block colors: Addon did not affect devtools middle click feature (#669)
- Customizable block colors: Custom colors do not apply to custom blocks (#948)
- Customizable block colors: Custom colors do not apply to dropdowns (#956)
- Customizable block colors: Custom colors do not apply to extension blocks in non-English environment (#956)
- Customized quotes & code blocks on forums: Addon categorized as editor addon (#989)
- Mouse position: Addon crashes in project view (#954)
- Scratch 2.0 → 3.0: /news is not supported (#941)
- Scratch Messaging: "Show More" button is partially hidden (#929)
- Scratch Messaging: Addon links to curators page for activity messages (#969)
- Scratch Messaging: Follower name links uses onClick (#969)
- Show my-ocular status: Addon is not localized (#925)
- Studio manager tools: Buttons don't have text when hovered (#994)
- Studio manager tools: Buttons don't have text when hovered (#994)
- Website dark mode: Project comments are unreadable with dark mode (#928)
- Website dark mode: /news is not supported (#941)
- Website dark mode: Some pages are not listed in dark mode list (#949)
- Website dark mode: Addon still loads on editors (#960)
- Website dark mode: Addon does not make cloudmonitor rows dark (#960)
- Website dark mode: Addon changes variable monitor color (#981)
- Website dark mode: Addon styles in-editor Join Flow (#981)
- Website dark mode: Addon styles list row backgrounds when focused (#981)
- Website dark mode: Addon does not apply to loading screen (#995)
- Website dark mode: Addon makes search input dark (#995)
- Website dark mode: Addon makes project warnings unreadable (#995)
- Some addons overflow in small stage (#930)
- Addons sometimes don't load in Firefox (#935)

#### Extension and Addon API

- Most translations don't load (#925)
- "Search" placeholder is not localized (#925)

## [v1.4.1] - 2020-12-03

### Fixed

- Forum search: Fix crashes (#901)
- Messages in editor: Typo in addon description (#903)
- Sprite and script count: Script count was inaccurate (#904)
- Addons have incorrect name (#887)

## [v1.4.0] - 2020-11-29

## [v1.3.3] - 2020-11-24

## [v1.3.2] - 2020-11-24

## [v1.3.1] - 2020-11-09

## [v1.3.0] - 2020-11-08

## [v1.2.1] - 2020-10-27

NOTE: All updates from [v1.2.0] are pushed on this version.

## [v1.2.0] - 2020-10-27 [YANKED]

NOTE: v1.2.0 is only released on Firefox due to an issue with perfomance warnings not showing. SAll updates are included on [v1.2.1].

## [v1.1.1] - 2020-10-11

NOTE: All updates from [v1.1.0] are pushed on this version.

### Fixed

- Use webRequest instead of webNavigation (#457)

## [v1.1.0] - 2020-10-10 [YANKED]

NOTE: v1.1.0 is not released due to a permission issue. All updates are included on [v1.1.1].

### Added

#### Addons

- 60fps (#383)
- Better emojis (#402)
- Cloud games (#407)
- Display stage on left side (#376)
- Forum Search (#363)
- Scratch 2.0 → 3.0 (theme) (#359)
- Search profile (#405)

#### Extension and Addon API

- Access to addon settings via CSS variables (#439)
- Color input on settings (#400)
- General CSS around tabs in popup (#411)
- New links to credits and review pages (#414)
- Uninstall page (#437)
- Warnings, mainly to warn lags for addons that use addon.tab.traps (6a222c0)

### Changed

#### Addons

- Bitmap images copying: Add note to clear up confusion (#454)
- Cloud games: Add new scrollbar to cloud games (#412)
- Display stage on left side: Add warning
- Editor dark mode: Affect password input (#440)
- Editor dark mode: Change var(--text) to white on 3.Darker so that text is more readable
- Editor dark mode: Decrease font-weight from 800 to 700
- Editor dark mode: Don't inject dark mode into the remix tree (#420)
- Editor dark mode: Don't style scratch 3.0 search bar (#420)
- Editor dark mode: Remove a border that shouldn't be in 3.Dark and 3.Darker
- Image uploader: Slight updates (#371)
- Scratch Messaging: Make reply textbox more like Scratch (#375)
- Show full areas: Add expand button instead of all full signatures (#330)
- Show full areas: Clean signature expand button (#384)
- Show full areas: Cleaner expand signature
- Show full areas: Complete refactor of expand signature 
- Update tags and addon names (#422)

#### Extension and Addon API

- Ability to inject userstyles when the page starts loading (#328)
- Automatically update themes when changing settings (#252)
- Change end lines from CRLF to LF (#367)
- Change search to 150px (#378)
- Do not load traps unless addons that use them are enabled (#403)
- Hide settings page until it is loaded (0b3392c)
- Make better variable name (#446)
- Make sure the head loaded before injecting userstyles (#408)
- Run userscripts earlier, when the window load event triggers (#429)

### Removed

#### Extension and Addon API

- "Changed by [line of code]" console logs (#419)

### Fixed

#### Addons

- Scratch Messaging: Fix link to studio comments (#356)
- Scratch Messaging: Ignore Set-Cookie inside comment endpoint (#331)
- Scratch Notifier: Fix studio comments don't notify with the full comment content

#### Extension and Addon API

- Fix Vue warns (#355)
- Fix bug in URL/pattern matcher when addon runs if manifest has no trailing slash (#332)
- Fix messageForAllTabs() not working properly in Firefox (#386)
- Fix modifying "select" setting not disabled if addon disabled (#353)

## [v1.0.0] - 2020-09-24

Initial release.

[v1.6.1]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.6.1
[v1.6.0]: https://github.com/ScratchAddons/ScratchAddons/releases/tag/v1.6.0
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

<!--

Here's the simple format. Other types such as "Removed" can be added later.

### Added

#### Addons

#### Extension and Addon API

### Changed

#### Addons

#### Extension and Addon API

### Fixed

#### Addons

#### Extension and Addon API

-->
