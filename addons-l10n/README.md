This folder is for userscripts. For messages used by background scripts, check `_locales` folder.

String can be obtained by `scratchAddons.l10n.get()` function (which does not prefix the message key) or `msg` function passed to userscripts (which prefixes the message key).

## File name
Files are placed under `addons-l10n/LOCALECODE` folder, where the locale code is lowercased IETF language tag used by Scratch (e.g. en, zh-tw). Note that 2-letter code will be used if ones with regions are unavailable; e.g. if en-US is unavailable, it uses en.

File name is `ADDONID.json`, where addonid is the addon id. `_general.json` contains messages that are shared by addons. Note that if addons are disabled, corresponding message files will not be loaded.

## File contents
The message file is a JSON file.

`_general.json` must contain:
- `_locale`: locale code.
- `_locale_name`: **localized** locale name.

Keys are prefixed with addon IDs: e.g. `set-thumbnail` message on `animated-thumb` addon will be `animated-thumb/set-thumbnail`.

## Placeholders
Placeholder formats are similar to WebExtension placeholders, like this: `foo $placeholder1$ bar`.

The second argument of the functions accepts an object which will have the placeholder name (case-sensitive) as the key and the value.

## Example

`addons-l10n/en/extension-x.json`:

```json
{
    "_locale": "meow",
    "_locale_name": "Meow",
    "extension-x/loaded": "meow $name$ meow!"
}
```

```js
export default async function ({msg}) {
    console.log(msg('loaded', {name: 'Extension X'}));
}
```
