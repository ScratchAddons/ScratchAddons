export default class Localization extends EventTarget {
    constructor (urls, loadedAddons) {
        super();
        this._urls = urls;
        this._loadedAddons = [...loadedAddons, '_general'];
        this.messages = {};
        this.load();
    }
    
    _replacePlaceholders (msg, placeholders) {
        return msg.replace(
            /\$([\w-]+)\$/g,
            (_, placeholder) => {
                if (Object.prototype.hasOwnProperty.call(placeholders, placeholder)) {
                    return placeholders[placeholder];
                }
                return '';
            }
        );
    }
    
    async load () {
        for (const dir of this._urls) {
            for (const addonId of this._loadedAddons) {
                let resp;
                let messages = {};
                const url = `${dir}/${addonId}.json`;
                try {
                    resp = await fetch(url);
                    messages = await resp.json();
                } catch (_) {
                    continue;
                }
                this.messages = Object.assign(messages, this.messages);
            }
        }
    }
    
    get (key, placeholders = {}) {
        if (Object.prototype.hasOwnProperty.call(this.messages, key)) {
            return this._replacePlaceholders(this.messages[key], placeholders);
        }
        return key;
    }
    
    get locale () {
        return this.messages._locale || 'en';
    }
    
    get localeName () {
        return this.messages._locale_name || 'English';
    }
}