This folder is for addons. For messages used by non-addons (such as options), check `_locales` folder.

## Obtaining translations
`LocalizationProvider`'s subclasses are used to obtain translations.
- `UserscriptLocalizationProvider` fetches translations using URL provided from background in `loadByAddonId`. This can be accessed via `scratchAddons.l10n` or `msg`/`safeMsg` passed to userscript functions. This is for userscripts, which get executed inside Scratch website origin.
- `BackgroundLocalizationProvider` fetches translations using the UI locale in `load`. This can be accessed via `scratchAddons.l10n` or `msg` passed to background script functions. This is for background scripts, such as notifications.
- `WebsiteLocalizationProvider` fetches translations using IPC (between BackgroundLocalizationProvider). Instances may be created on all pages, and `loadMessages` is used to load messages. This can be used from content scripts, option screens and popups.

## File name
Files are placed under `addons-l10n/LOCALECODE` folder, where the locale code is lowercased IETF language tag used by Scratch (e.g. en, zh-tw). Note that 2-letter code will be used if ones with regions are unavailable; e.g. if en-US is unavailable, it uses en.

File name is `ADDONID.json`, where addonid is the addon id. `_general.json` contains messages that are shared by addons. Note that if addons are disabled, corresponding message files will not be loaded.

## File contents
The message file is a JSON file.

`_general.json` must contain:
- `_locale`: locale code.
- `_locale_name`: **localized** locale name.

Keys are prefixed with addon IDs: e.g. `set-thumbnail` message on `animated-thumb` addon will be `animated-thumb/set-thumbnail`.

Message names that start with `@` are reserved for use inside manifest. For example, `extension-x/@name` represents the addon's name on the manifest file.

## Placeholders
Placeholder formats are similar to WebExtension placeholders, like this: `foo $placeholder1$ bar`.

The second argument of the functions accepts an object which will have the placeholder name (case-sensitive) as the key and the value.

## Example

`addons-l10n/en/extension-x.json`:

```json
{
    "_locale": "meow",
    "_locale_name": "Meow",
    "extension-x/@name": "Extension X",
    "extension-x/loaded": "meow $name$ meow!"
}
```

```js
export default async function ({msg}) {
    console.log(msg('loaded', {name: 'Extension X'}));
}
```
