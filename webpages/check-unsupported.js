import checkIfUnsupported, { url as getURL } from "../background/handle-unsupported-version.js";

const url = getURL();

if (checkIfUnsupported()) {
  window.top.location.href = url;
  window.parent.location.href = url;
  window.location.href = url;
}
