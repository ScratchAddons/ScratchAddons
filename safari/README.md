# The Safari Port

Apple's support for WebExtensions is weird and needs some special treatment. That's what this folder is all about.

## Basic structure

There are actually two apps. The native one (denoted by `(App)`) just tells Safari that the extension exists and has a button for the use to find where in Safari to enable the extension.

The other one (denoted by `(Extension)`) is the extension itself. This is actually itself two more apps; there is a native component and the JavaScript component that can talk to each other. We currently do not use the native component for anything but it's still there.

## Development

You just need Xcode. For development you don't need an Apple Developer Program subscription.

 - Open `safari/Scratch Addons` in Xcode.
 - Switch to the macOS target. Sometimes Xcode defaults to the iOS target.
 - Build it. You may have to run the native app at least once for Safari to realize it exists.
 - In Safari settings, enable "Show features for web developers" under "Advanced" (may be different for older macOS versions).
 - In Safari settings, enable "Allow unsigned extensions" under "Developer" (may be different for older macOS versions). You have to do this each time you restart Safari.
 - In Safari settings, enable "Scratch Addons" under "Extensions"

Once you have it running, you can edit the normal JavaScript files that all other browsers use. Note that while you don't need to use Xcode to write the rest of the extension, **you still must re-build in Xcode for changes to apply**.

## Sending to Apple

Working on it
