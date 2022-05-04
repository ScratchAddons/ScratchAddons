import type { Addon, Listenable } from "./common";

/* ------------------------------ Utility Types ----------------------------- */

/*
  Aliases for types that are provided by scratch and too big to type here
*/
type ScratchVM = any;
type ScratchVMThread = any;
type ScratchBlocks = any;
type ScratchPaper = any;
type ScratchReduxState = any;

/**
 * A Redux action.
 */
interface PayloadAction {
  /**
   * The type of action used by the reducer.
   */
  type: string;
  /**
   * Action payload/data.
   */
  [key: string]: any;
}

/* ---------------------------------- Core ---------------------------------- */
/**
 * Manages object trapping.
 */
interface Trap extends Listenable<never> {
  /**
   * scratch-vm instance.
   * @throws when on non-project page.
   */
  get vm(): ScratchVM;
  /**
   * Gets Blockly instance actually used by Scratch.
   * This is different from window.Blockly.
   * @throws when on non-project page.
   */
  getBlockly(): Promise<ScratchBlocks>;
  /**
   * Gets react internal key.
   * @param elem The reference
   * @returns the key
   */
  getInternalKey(elem: HTMLElement): string;
  /**
   * Gets @scratch/paper instance.
   * @throws when on non-project page or if paper couldn't be found.
   */
  getPaper(): Promise<ScratchPaper>;
}

/**
 * Handles Redux state.
 */
interface ReduxHandler extends Listenable<"statechanged"> {
  /**
   * Whether the handler is initialized or not.
   */
  initialized: boolean;
  /**
   * Initialize the handler. Must be called before adding events.
   */
  initialize(): void;
  /**
   * Redux state.
   */
  get state(): ScratchReduxState;
  /**
   * Dispatches redux state change.
   * @param payload payload to pass to redux.
   * @throws when Redux is unavaliable.
   */
  dispatch(payload: PayloadAction): void;
  /**
   * Waits until a state meets the condition.
   * @param condition a function that takes redux state and returns whether to keep waiting or not.
   * @param opts options.
   * @returns a Promise resolved when the state meets the condition.
   */
  waitForState(
    condition: (state: ScratchReduxState) => boolean,
    opts?: {
      actions?: string | string[];
    }
  ): Promise<void>;
}

/**
 * APIs specific to userscripts.
 */
declare namespace Tab {
  export interface Tab extends Listenable<"urlChange"> {
    traps: Trap;
    redux: ReduxHandler;
    /**
     * version of the renderer (scratch-www, scratchr2, etc)
     */
    get clientVersion(): "scratch-www" | "scratchr2" | null;
    /**
     * Add a custom block to the user's workspace.
     * Do not use this unless you are adding blocks to the debugger addon.
     * @param proccode The name that will be used to refer to the block internally.
     * Must specify inputs on the block (if any) using %s (string), %n (number-only), and %b (boolean).
     * @param options Block options.
     */
    addblock<A extends string[]>(
      proccode: string,
      options: {
        /**
         * A list of names that will be used to refer to the block's inputs in the
         * callback. If there are no inputs, use an empty array.
         */
        args: A;
        /**
         * The name that will be displayed on the block to the user.
         * Must also include block input syntax.
         */
        displayName: string;
        /**
         * The function that will execute when the block runs.
         */
        callback: (
          /**
           * An object containing the values that are entered into the block
           * inputs.
           */
          args: { (arg: A[number]): any },
          /**
           * A reference to the thread that this block is running in.
           */
          thread: ScratchVMThread
        ) => void;
        hidden: boolean;
      }
    ): void;
    /**
     * Removes a block that was previously added to the Debugger category in the block palette.
     * @param proccode The `proccode` value of the block to remove
     */
    removeBlock(proccode: string): void;
    /**
     * Get a block that was previously added to the Debugger category in the block palette.
     * @param proccode The `proccode` value of the block to remove
     */
    getCustomBlock(proccode: string): any;
    /**
     * Loads a script by URL.
     * @param url the script URL.
     */
    loadScript(url: string): Promise<void>;
    /**
     * Waits until an element renders, then return the element.
     * @param selector argument passed to querySelector.
     * @param opts options.
     * @returns element found.
     */
    waitForElement(
      selector: string,
      opts?: {
        /**
         * Whether it should mark resolved elements to be skipped next time or not.
         */
        markAsSeen?: boolean;
        /**
         * A function that returns whether to resolve the selector or not.
         */
        condition?: () => boolean;
        /**
         * A function that returns whether to resolve the selector or not, given an element.
         */
        elementCondition?: (el: Element) => boolean;
        /**
         * A function that returns whether to resolve the selector or not.
         */
        reduxCondition?: (state: ScratchReduxState) => boolean;
        /**
         * An array of redux events that must be dispatched before resolving the selector.
         */
        reduxEvents?: string[];
      }
    ): Promise<Element>;
    /**
     * editor mode (or null for non-editors)
     */
    get editorMode(): string | void;
    /**
     * Copies a PNG image.
     * @param dataURL data url of the png image
     */
    copyImage(dataURL: string): Promise<void>;
    /**
     * Gets translation used by Scratch.
     * @param key Translation key.
     * @returns Translation.
     */
    scratchMessage(key: string): string;
    /**
     * Gets the hashed class name for a Scratch stylesheet class name.
     * @param classes Unhashed class names.
     * @param opts options.
     * @returns Hashed class names
     */
    scratchClass(
      ...classes: [
        ...(
          | string[]
          | [
              ...string[],
              {
                /**
                 * Non-Scratch class or classes to merge.
                 */
                others: string | string[];
              }
            ]
        )
      ]
    ): string;
    /**
     * Hides an element when the addon is disabled.
     * @param el the element
     * @param opts the options
     */
    displayNoneWhileDisabled(
      el: HTMLElement,
      opts: {
        /**
         * the fallback value for CSS display.
         */
        display?: string;
      }
    ): void;
    /**
     * The direction of the text; i.e. rtl or ltr.
     */
    get direction(): "rtl" | "ltr";
    /**
     * Adds an item to a shared space.
     * Defined shared spaces are:
     * stageHeader - the stage header
     * fullscreenStageHeader - the stage header for fullscreen
     * afterGreenFlag - after the green flag
     * afterStopButton - after the stop button
     * afterCopyLinkButton - after the copy link button, shown below project descriptions
     * afterSoundTab - after the sound tab in editor
     * forumsBeforePostReport - before the report button in forum posts
     * forumsAfterPostReport - after the report button in forum posts
     * beforeRemixButton - before the remix button in project page
     * studioCuratorsTab - inside the studio curators tab
     * @param opts options.
     * @returns whether the operation was successful or not.
     */
    appendToSharedSpace(opts: {
      /**
       * The shared space name
       */
      space:
        | "stageHeader"
        | "fullscreenStageHeader"
        | "afterGreenFlag"
        | "afterStopButton"
        | "beforeProjectActionButtons"
        | "afterCopyLinkButton"
        | "afterSoundTab"
        | "forumsBeforePostReport"
        | "forumsAfterPostReport"
        | "beforeRemixButton"
        | "studioCuratorsTab"
        | "forumToolbarTextDecoration"
        | "forumToolbarLinkDecoration"
        | "forumToolbarFont"
        | "forumToolbarList"
        | "forumToolbarDecoration"
        | "forumToolbarEnvironment"
        | "forumToolbarScratchblocks"
        | "forumToolbarTools"
        | "assetContextMenuAfterExport"
        | "assetContextMenuAfterDelete"
        | "monitor";
      /**
       * The element to add
       */
      element: HTMLElement;
      /**
       * the order of the added element. Should not conflict with other addons.
       */
      order: number;
      /**
       * if multiple shared spaces exist, the one where the shared space gets added to.
       */
      scope?: HTMLElement;
    }): boolean;

    /**
     * Creates an item in the editor Blockly context menu.
     * @param callback Returns new menu items.
     * @param conditions Show context menu when one of these conditions meet.
     */
    createBlockContextMenu(
      callback: BlockContextMenuCallback,
      conditions: {
        /**
         * Add to workspace context menu.
         */
        workspace: boolean;
        /**
         * Add to block context menu outside the flyout.
         */
        blocks: boolean;
        /**
         * Add to block context menu in flyout/palette.
         */
        flyout: boolean;
        /**
         * Add to comments
         */
        comments: boolean;
      }
    ): void;
    /**
     * Adds a context menu item for the editor.
     * @param callback the callback executed when the item is clicked.
     * @param opts the options.
     */
    createEditorContextMenu(
      callback: EditorContextMenuItemCallback,
      opts: {
        /**
         * the class name to add to the item.
         */
        className: string;
        /**
         * which types of context menu it should add to.
         */
        types: string[];
        /**
         * the position inside the context menu.
         */
        position: string;
        /**
         * the order within the position.
         */
        order: number;
        /**
         * the label for the item.
         */
        label: string;
        /**
         * whether to add a border at the top or not.
         */
        border: boolean;
        /**
         * whether to indicate the item as dangerous or not.
         */
        dangerous: boolean;
        /**
         * a function to check if the item should be shown.
         */
        condition: EditorContextMenuItemCondition;
      }
    ): void;
  }
  /**
   * Type for context menu item.
   */
  export interface ContextMenuItem {
    /**
     * Whether it is enabled
     */
    enabled: boolean;
    /**
     * The context menu item label
     */
    text: string;
    /**
     * The function that is called when the item is clicked.
     */
    callback: () => void;
    /**
     * Whether to add a separator above the item.
     */
    separator: boolean;
  }
  /**
   * Callback to modify the context menu.
   * @param items - the items added by vanilla code or other addons.
   * @param block - the targeted block, if any.
   * @returns the array that contains values of items array as well as new items.
   */
  export type BlockContextMenuCallback = (
    /**
     * the items added by vanilla code or other addons.
     */
    items: ContextMenuItem[],
    /**
     * the targeted block, if any.
     */
    block?: any
  ) => ContextMenuItem[];
  export interface EditorContextMenuContext {
    /**
     * The type of the context menu
     */
    type: string;
    /**
     * The item element
     */
    menuItem: HTMLElement;
    /**
     * The target item
     */
    target: HTMLElement;
    /**
     * The index, if applicable.
     */
    index: number;
  }
  /**
   * Callback executed when the item is clicked.
   */
  export type EditorContextMenuItemCallback = (
    /**
     * The context for the action.
     */
    context: EditorContextMenuContext
  ) => void;
  /**
   * Callback to check if the item should be visible.
   */
  export type EditorContextMenuItemCondition = (
    /**
     * The context for the action.
     */
    context: EditorContextMenuContext
  ) => boolean;
}

interface Account extends Listenable<never> {
  /**
   * Fetches message count.
   * @returns current message count.
   */
  getMsgCount(): Promise<number | void>;
}

/* ----------------------------- Main Interface ----------------------------- */

export interface UserscriptAddon extends Addon {
  tab: Tab.Tab;
  account: Account;
}
