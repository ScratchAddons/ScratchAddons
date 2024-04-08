// This file is loaded as ESM.

// Transition from Scratch Messaging Extension
import "./transition.js";

// Load idb
import "../libraries/thirdparty/idb.js";

// Declare scratchAddons object, create global and local state
import "./declare-scratchaddons-object.js";

// Load manifests into memory
import "./load-addon-manifests.js";

// When manifests are ready, check addon settings
import "./get-addon-settings.js";

//  Load handlers. Some expose methods through scratchAddons.methods
import "./handle-fetch.js";
import "./handle-auth.js";
import "./handle-l10n.js";
import "./handle-clipboard.js";
import "./handle-notifications.js";
import "./handle-permissions.js";

// When everything is ready, run scripts and communicate with content scripts
import "./get-userscripts.js";
import "./get-popups.js";

// Respond to requests by the settings page and others
import "./handle-settings-page.js";
import "./handle-licenses.js";
import "./handle-unsupported-version.js";
