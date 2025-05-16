/**An utility class to manage the addon assets.
 * @constructor Requires the directory of the addon.
 */
export default class AddonAssets {
  /**
   *
   * @param {string} dir - The directory of the addon.
   */
  constructor(dir) {
    this.dir = dir;
  }
  getFileFromAssets(file) {
    return this.dir + `/assets/${file}`;
  }
}
