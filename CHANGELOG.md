# Changelog

All notable changes to this project will be documented in this file.

**Note:** This changelog is more detailed, compared to the summarised changelog on https://scratchaddons.com/changelog.

<!-- 

NOTE: 

Updates on the changelog entry in between the start and stop tags will 
automatically create a PR on the website to synchronize the changes!

-->

<!-- sa-changelog-start -->

## [v1.5.1] - 2020-12-15

## [v1.5.0] - 2020-12-13

## [v1.4.1] - 2020-12-03

## [v1.4.0] - 2020-11-29

## [v1.3.3] - 2020-11-24

## [v1.3.2] - 2020-11-24

## [v1.3.1] - 2020-11-09

## [v1.3.0] - 2020-11-08

## [v1.2.1] - 2020-10-27

## [v1.2.0] - 2020-10-27 [YANKED]

## [v1.1.1] - 2020-10-11

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
- Use webRequest instead of webNavigation (#457)

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

## [v1.1.0] - 2020-10-10 [YANKED]

Not released due to a permissions issue. See [v1.1.1].

## [v1.0.0] - 2020-09-24

Initial release.

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
