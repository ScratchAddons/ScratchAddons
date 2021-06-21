import type UserscriptAddon from "./addon-api/content-script/Addon.js";
import type PersistentScriptAddon from "./addon-api/background/Addon.js";
import type chrome from "./libraries/thirdparty/chrome";
import type Auth from "./addon-api/common/Auth";
import type Self from "./addon-api/common/Self";
import type Settings from "./addon-api/common/Settings";
import type Tab from "./addon-api/content-script/Tab";
import type BackgroundLocalizationProvider from "./background/l10n";
type Script = {
  global: { [key: string]: any };
  console: Console;
  msg: () => string | null;
  msg: { locale: string };
  safeMsg: () => string | null;
};
interface Message {
  id: number;
  datetime_created: Date;
  actor_username: string;
  actor_id: number;
  comment_type?: number;
  comment_obj_id?: number;
  comment_id?: number;
  comment_fragment?: string;
  comment_obj_title?: string;
  commentee_username?: string | null;
  type:
    | "addcomment"
    | "becomeownerstudio"
    | "curatorinvite"
    | "favoriteproject"
    | "followuser"
    | "forumpost"
    | "loveproject"
    | "remixproject"
    | "studioactivity"
    | "userjoin";
  topic_id?: number;
  topic_title?: string;
  gallery_id?: number;
  title?: string;
  project_id?: number;
  project_title?: string;
  followed_user_id?: number;
  followed_username?: string;
  gallery_title?: string;
  recipient_id?: number;
  recipient_username?: string;
  parent_id?: number;
  parent_title?: string;
}

//#region scratchAddons APIs
export interface globalState {
  addonSettings: {
    _target?: { [key: string]: { [key: string]: string | boolean | number } };
    [key: string]: { [key: string]: string | boolean | number };
  };
  auth: {
    _target?: {
      csrfToken?: string;
      isLoggedIn: boolean;
      scratchLang: string;
      userId?: number;
      username?: string;
      xToken?: string;
    };
    csrfToken?: string;
    isLoggedIn: boolean;
    scratchLang: string;
    userId?: number;
    username?: string;
    xToken?: string;
  };
}

interface localState {
  addonsEnabled: { _target?: { [key: string]: boolean }; [key: string]: boolean };
  allReady: boolean;
  badges: {
    _target?: { [key: string]: { text: string | null; color: string | null } };
    [key: string]: { text: string | null; color: string | null };
  };
  ready: {
    _target?: {
      auth: boolean;
      manifests: boolean;
      addonSettings: boolean;
    };
    auth: boolean;
    manifests: boolean;
    addonSettings: boolean;
  };
}
//#endregion

//#region Addon Manifests
export interface Injectable {
  matches: Matches;
  /** Determines whether the addon should be run after the document is complete loading. */
  runAtComplete?: boolean;
  /**
   * You can provide a "settingMatch" object that will result in your userscript/userstyle only running if the specified
   * setting is set to the specified value.
   */
  settingMatch?: SettingMatch;
  /** The path to the userscript. */
  url: string;

  _scratchDomainImplied?: boolean;
}

/** The manifest that describes an addon. */
export interface AddonManifest {
  /** The url to the schema. */
  $schema?: string;

  _english?: {
    name?: string;
    description?: string;
  };

  /** An array containing credits to the authors/contributors of the addon. */
  credits?: {
    /** The link relevant to the credit. */
    link?: string;

    /** The name of the credited person. */
    name: string;
  }[];

  /** An array of CSS variables the addon defines. */
  customCssVariables?: /** A CSS variable. */ {
    /** The name of the CSS variable. */
    name: string;

    value: CssManipulator;
  }[];

  /** The description of the addons. Any credits and attributions also belong here. */
  description: string;

  /** Determines whether the addon's scripts should be considered disabled when disabled as the page is running. */
  dynamicDisable?: boolean;

  /** Determines whether the addon's scripts should be considered enabled when enabled as the page is running. */
  dynamicEnable?: boolean;

  /**
   * You can provide the "enabledByDefault" property and set it to true. Its default value is false. Keep in mind, few
   * addons will be enabled by default. If you want your addon to be enabled by default, please open a discussion issue.
   */
  enabledByDefault?: boolean;

  /** An array of additional information (e.g. warnings, notices) about the addon. */
  info?: /** Information about the addon. */ {
    /** ID of the information. */
    id: string;

    /** Text of the information. */
    text: string;

    /** Type of the information. */
    type: "notice" | "warning";
  }[];

  /** Determines whether the addon's userstyles should be injected as style elements rather than link elements. */
  injectAsStyleElt?: boolean;

  /** An array of libraries that the addon uses. */
  libraries?: string[];

  /** The name of the addon. Don't make it too long. */
  name: string;

  /** You can specify permissions by providing a "permissions" array. */
  permissions?: string[];

  /** You can add persistent scripts by providing a "persistentScripts" array conformed of JS files (e.g. ["example.js"]). */
  persistentScripts?: string[];

  popup?: /** An object for the popup. */ {
    /** Determines whether to show the fullscreen button. */
    fullscreen?: boolean;

    /** The path to the popup icon. */
    icon: string;

    /** The name of the popup. */
    name: string;
  };

  /** An array containing presets for settings. */
  presets?: /** A preset. */ {
    /** The description of the preset. */
    description?: string;
    /** The identifier of the preset. */
    id: string;
    /** The name of the preset. */
    name: string;
    /** An object containing preset values of the settings. */
    values: { [key: string]: any };
  }[];

  /**
   * The "settings" object allow the addon's users to specify settings in Scratch Addons' settings panel. Inside your
   * persistent scripts and userscripts, you can then access those settings with the "addon.settings" API. Specify an
   * "settings" property and provide an array of setting objects.
   */
  settings?: {
    allowTransparency?: any;
    /** The default value of the setting. */
    default: SettingValue;
    /** The identifier of the setting to get the specified value from your code. */
    id: string;
    max?: any;
    min?: any;
    /** The name of the setting. */
    name: string;
    potentialValues?: (
      | {
          id: string;
          name: string;
        }
      | string
    )[];
    /** The type of the setting. */
    type: "boolean" | "color" | "integer" | "positive_integer" | "select" | "string";
  }[];

  /** Tags which are used for filtering and badges on the Scratch Addons settings page. */
  tags: /** A tag. */
  | "beta"
    | "codeEditor"
    | "comments"
    | "community"
    | "costumeEditor"
    | "danger"
    | "easterEgg"
    | "editor"
    | "editorMenuBar"
    | "forums"
    | "popup"
    | "profiles"
    | "projectPage"
    | "projectPlayer"
    | "recommended"
    | "studios"
    | "theme"[];

  /** Determines whether traps are needed to run the addon. */
  traps?: boolean;

  /** Determines whether the addon's userstyles should be removed and rematched to the new settings. */
  updateUserstylesOnSettingsChange?: boolean;

  /**
   * You can add userscripts by providing a "userscripts" array. Unlike persistent scripts, this is an array of objects,
   * not strings. Each object must specify the url to the userscript through the "url" property, and provide an array of
   * URL matches.
   */
  userscripts?: Injectable[];

  /**
   * Similarly to userscripts, you can specify a "userstyles" array. Each object must specify the url to the stylesheet
   * through the "url" property, and provide an array of URL matches.
   */
  userstyles?: Injectable[];

  /** The version that introduced the addon. */
  versionAdded?: string;
}

type CssManipulator = {
  /** The setting ID to reference. */
  settingId?: string;

  /** The type of the manipulator. */
  type?: string;

  /** The value for black text. */
  black?: CssManipulator;

  /**
   * The source to manipulate.
   *
   * The source that provides the color.
   */
  source?: CssManipulator;

  threshold?: number;

  /** The value for white text. */
  white?: CssManipulator;

  /** The alpha/opacity value of the color. */
  a?: number;

  /** The blue value of the color. */
  b?: number;

  /** The green value of the color. */
  g?: number;

  /** The red value of the color. */
  r?: number;

  /** The source that provides opaque color. */
  opaqueSource?: CssManipulator;

  /** The source that provides transparent color. */
  transparentSource?: CssManipulator;
};

/**
 * The default value of the setting.
 *
 * The value of the setting.
 */
type SettingValue = boolean | number | string;

type Matches = (string | RegExp)[] | string | RegExp;

/**
 * You can provide a "settingMatch" object that will result in your userscript/userstyle only running if the specified
 * setting is set to the specified value.
 */
interface SettingMatch {
  /** The identifier of the setting. */
  id: string;
  /** The value of the setting. */
  value: SettingValue;
}
//#endregion

declare global {
  //#region Addon APIs
  namespace Addon {
    export type Userscript = {
      addon: UserscriptAddon;
    } & Script;

    export type PersistentScript = {
      addon: PersistentScriptAddon;

      // Borrowed from lib.dom.d.ts
      setInterval(handler: TimerHandler, timeout?: number, ...arguments: any[]): number;
      setTimeout(handler: TimerHandler, timeout?: number, ...arguments: any[]): number;
      clearInterval(handle?: number): void;
      clearTimeout(handle?: number): void;
    } & Script;
  }
  //#endregion
  //#region scratchAddons APIs
  declare const scratchAddons: {
    muted: boolean;
    addonObjects: (UserscriptAddon | PersistentScriptAddon)[];
    eventTargets: {
      auth: Auth[];
      self: Self[];
      settings: Settings[];
      tab?: Tab[];
    };
    localEvents: EventTarget;
    l10n: BackgroundLocalizationProvider;
    globalState: {
      _target?: globalState;
    } & globalState;
    localState: {
      _target?: localState;
    } & localState;
    methods: {
      clearMessages: () => Promise<void>;
      getMessages: (opts?: { offset?: number }) => Promise<Message[]>;
      getMsgCount: () => Promise<number>;
    };
    manifests: {
      addonId: string;
      manifest: AddonManifest;
    }[];
  };
  declare const _realConsole: Console;
  declare const __scratchAddonsRedux: {
    target?: EventTarget;
    dispatch?: (payload: { type: string; [key: string]: any }) => any; // I have no idea what this is...@apple502j?
    state: any; // lol way to much to try to type, even using AI
  };
  //#endregion
  interface Window {
    [key: string]: any;
  }
  interface RegExp {
    _scratchDomainImplied?: boolean;
  }
  interface Event {
    detail?: any;
  }
  declare const chrome: chrome;
  declare const InstallTrigger: undefined; // Technically defined in FF, but I'm not gonna type it
}
