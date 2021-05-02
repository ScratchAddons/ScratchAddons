/* Languages for which RTL layout is enabled.
   Only languages that are at least 50% translated should be added
   to this list. */

const rtlList = [
  // List of language codes (xx or xx-XX)
];

export default function getDirection(languageCode) {
  const shortId = languageCode.split("-")[0];
  return rtlList.includes(languageCode) || rtlList.includes(shortId) ? "rtl" : "ltr";
}
