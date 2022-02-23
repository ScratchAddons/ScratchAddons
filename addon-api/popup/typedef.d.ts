import type Utils from "../common/typedef";
import type PopupAddon from "./Addon";

declare global {
  /**
   * Popups must default-export an async function that takes this object as a sole argument. Example:
   *
   *     export default async function (/** @type{PopupUtils} *\/util)
   *
   * Note that it is commonly done using destructing syntax.
   */
  const PopupUtils: Utils<PopupAddon>;
}
