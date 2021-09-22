import checkIfUnsupported, { url as getURL } from "../background/handle-unsupported-version.js";

const url = getURL();

if (checkIfUnsupported()) {
  window.parent.location.href = url;
  window.location.href = url;
}
