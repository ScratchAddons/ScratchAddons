export default function(_codeToEvaluate, addon, global, scratchAddons) {
    eval(_codeToEvaluate);

    // NOTE TO POTENTIAL CODE REVIEWERS:

    // This eval call doesn't receive any remotely provided code!
    // All code given to eval is taken directly from the extension's
    // source code, more specifically the "addons" folder.
}