export default function(_codeToEvaluate, addon, global, setTimeout, setInterval, clearTimeout, clearInterval, chrome, scratchAddons) {
        eval(_codeToEvaluate);
    
        // NOTE TO POTENTIAL CODE REVIEWERS:

        // This eval call doesn't receive any remotely provided code!
        // All code given to eval is taken directly from the extension's
        // source code, more specifically the "addons" folder.

        // We are aware the chrome.* APIs could still be accessed through
        // window.chrome, however there is no security concern since we
        // write or check the addons' code ourselves. Making chrome.*
        // APIs not work is not for sandboxing - it's to avoid bad
        // practices from 3rd party addon contributors, since we want
        // them to use our addon.* APIs, not Chrome's.
}