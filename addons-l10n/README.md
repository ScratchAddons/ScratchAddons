This folder is for addons. For messages used by non-addons (such as options), check `_locales` folder.

## Obtaining translations
`LocalizationProvider`'s subclasses are used to obtain translations.
- `UserscriptLocalizationProvider` fetches translations using URL provided from background in `loadByAddonId`. This can be accessed via `scratchAddons.l10n` or `msg`/`safeMsg` passed to userscript functions. This is for userscripts, which get executed inside Scratch website origin.
- `WebsiteLocalizationProvider` fetches translations using IPC. Instances may be created on all pages, and `loadMessages` is used to load messages. Popups will automatically load messages for its addon and receive `msg`/`safeMsg` function similar to userscripts. This can be used from content scripts, option screens and popups.

## File name
Files are placed under `addons-l10n/LOCALECODE` folder, where the locale code is lowercased IETF language tag used by Scratch (e.g. en, zh-tw). Note that 2-letter code will be used if ones with regions are unavailable; e.g. if ja-JP is unavailable, it uses ja. English (en) is used as a fallback, so if ja is unavailable, en is loaded.

File name is `ADDONID.json`, where addonid is the addon id. `_general.json` contains messages that are shared by addons. Note that if addons are disabled, corresponding message files will not be loaded.

## File contents
The message file is a JSON file.

`_general.json` must contain:
- `_locale`: locale code.
- `_locale_name`: **localized** locale name.

Keys are prefixed with addon IDs: e.g. `set-thumbnail` message on `animated-thumb` addon will be `animated-thumb/set-thumbnail`.

Message names that start with `@` are reserved for use inside manifest. For example, `extension-x/@name` represents the addon's name on the manifest file. See below for details.

## Placeholders and Plurals
See the [ICU messaging format](https://unicode-org.github.io/icu/userguide/format_parse/messages/) for details. In short:
- `{PLACEHOLDER_NAME}` is used for placeholders; e.g. `Press {keyCode} key.`
- `{PLACEHOLDER_NAME, plural, one {MESSAGE FOR ONE} other {MESSAGE FOR OTHER}}` is used for plurals; e.g. `{count, plural, one {Here it is, one apple.} other {Here they are, # apples.}}`

The second argument of the functions accepts an object which will have the placeholder name (case-sensitive) as the key and the value. For example, you can call `msg("press-key", {keyCode: "space"})` or `msg("apple", {count: 100})`.

## Manifest (addon.json)
These keys are overridden by the translated ones, if it exists. Here are the keys on addon.json and the message file:
- `name` - `addon-id/@name`
- `description` - `addon-id/@description`

Detailed information can be translated:
- `info.text` - `addon-id/@info-INFOID`.

Preset names and descriptions can be localized, too:
- `preset.name` - `addon-id/@preset-name-PRESETID`
- `preset.description` - `addon-id/@preset-description-PRESETID`

Setting default values can be translated if the `type` is `string`:
- `setting.default` - `addon-id/@setting-default-SETTINGID`

Setting potential values can be translated:
- `potentialValue.name` - `addon-id/@setting-select-SETTINGID-POTENTIALVALUEID`

Popup names can be translated:
- `popup.name` - `addon-id/@popup-name`

Latest update temporary notices can be translated:
- `latestUpdate.temporaryNotice` - `addon-id/@update`

Note that in most cases you **do not have to do anything**, as English messages are fetched from the addon.json, not `addons-l10n/en`.

## Example

`addons-l10n/en/extension-x.json`:

```json
{
    "_locale": "meow",
    "_locale_name": "Meow",
    "extension-x/@name": "Extension X",
    "extension-x/loaded": "meow {name} meow! {catCount, plural, one {A cat is meowing!} other {# cats are meowing!}}"
}
```

```js
export default async function ({msg}) {
    console.log(msg('loaded', {name: 'Extension X', catCount: 5}));
}
```
