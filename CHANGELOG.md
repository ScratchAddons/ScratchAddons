# v1.2.1
---
##  Summary

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


### Addon development changes:
- Ability to use `addon.tab.waitForElement(selector, { markAsSeen: true })` to avoid having to manually add class names to elements to mark them as seen (#470)
- New `urlChange` event on `addon.tab`
- `notice` property in the manifest
- Setting presets (#563)

# v1.2.0 [NOT RELEASED]
---
Same changes as version 1.2.1, but never released because of an issue with perfomance warnings not showing.

# v1.1.1
---
## Summary

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

### Addon development changes:
- New manifest fields: `"traps"`, `"warning"`
- `"runAtComplete": false` can now happen even if there's no \<body> element yet. The default value is still `true`, and those userscripts are run when the window load event triggers
- Userstyles are now injected very rapidly to avoid flickering
- Theme userstyles are now always injected after non-theme userstyles
- Addon settings can now be of type `"color"`
- Access to `"string"`, `"select"`, `"positive_integer"` and `"color"` settings via CSS variables

### Open source project related changes:
- Links to "credits" and "review" pages on settings page.


# v1.1.0 [NOT RELEASED]
---
Same changes as version 1.1.1, but never released because of a permissions issue.
