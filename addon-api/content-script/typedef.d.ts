import type Utils from "../common/typedef";
import type UserscriptAddon from "./Addon";

declare global {
  /**
   * Userscripts must default-export an async function that takes this object as a sole argument. Example:
   *
   *     export default async function (/** @type {typeof UserscriptUtils} *\/ utils)
   *
   * Note that it is commonly done using destructing syntax.
   */
  const  UserscriptUtils: Utils<UserscriptAddon>;
}
