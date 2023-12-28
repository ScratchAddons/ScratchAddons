# The Safari Port

Apple's support for WebExtensions is weird and needs some special treatment. That's what this folder is all about.

## Basic structure

There are actually two apps. The native one (`App`) is a single-window app that just gives the user a button to access Safari settings quickly. This will appear in Launchpad and Spotlight.

The other one (`Extension`) is the actual extension. This breaks down further into two parts; there is a native component and a JavaScript component that can talk to each other. We currently do not use the native component for anything (but we could, so it's still there).

## Development

You just need to install Xcode. No Apple Developer Program subscription is needed for running it on your own computer.

 - Open `safari/Scratch Addons` in Xcode.
 - Make sure the `Scratch Addons (macOS)` target is selected at the top of Xcode as it defaults to the iOS target, which doesn't work (yet?).
 - Build it (Cmd+B). You may have to run the native app at least once (Cmd+R) for Safari to realize it exists. It may take over a minute for the debug build to run for the first time. It often opens behind Xcode so you'll have to focus it manually.
 - In Safari settings, [enable "Show features for web developers" under "Advanced"](https://developer.apple.com/documentation/safari-developer-tools/enabling-developer-features).
 - In Safari settings, [enable "Allow unsigned extensions" under "Developer" (differs in older versions of Safari)](https://developer.apple.com/documentation/safariservices/safari_web_extensions/running_your_safari_web_extension#3744467). You have to do this **each time** you start Safari.
 - In Safari settings, enable "Scratch Addons" under "Extensions"

Once the extension is running, it uses the same manifest.json, JavaScript files, etc. that the Chrome and Firefox versions use. You can use any editor to edit the extension. However, **you still must re-build in Xcode (Cmd+B) for changes to apply**. Unlike other browsers, your changes DO NOT apply automatically.

## Debugging tips

 - There are lots of weird Safari bugs, especially when WebExtensions are rebuilt. Restarting Safari can help.
 - If you've cloned the repository multiple times, you may have multiple copies of the extension installed. Instead of listing each copy of the extension, Safari chooses one arbitrarily. Try uninstalling the extension from Safari's extension list until it goes away completely, then rebuild only the correct version.
 - To open developer tools on the background page, open the Develop menu > Web Extension Background Context > Scratch Addons.
 - Sometimes the `debugger;` statement just doesn't work, especially in background pages. No known workaround.
 - Remember: Safari and Xcode are both extremely buggy pieces of software, so always be on the lookout for exciting new ~~bugs~~ features!

## Sending to Apple

For the most part Xcode figures this out. The code here is already configured for being signed by the right account. Just Product > Archive > Send to App Store Connect > Hope for a kind reviewer.
